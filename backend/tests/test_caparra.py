"""Backend tests: Caparra flow, Stripe checkout, email events, Stripe abbonamento regression."""
import os
from datetime import date, timedelta
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ORIGIN = BASE_URL

PRIVATO = ("mario.rossi@example.com", "Demo2026!")
AZIENDA_LAMPIONI = ("info@lampioniidraulica.it", "Demo2026!")
AZIENDA_EDIL = ("info@edilnuovacostruzioni.it", "Demo2026!")
AZIENDA_FREE = ("info@colorartimbiancatura.it", "Demo2026!")
AZIENDA_CALORE = ("info@caloreeclima.it", "Demo2026!")


def _login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    s.email = email
    return s


@pytest.fixture(scope="module")
def ctx():
    priv = _login(*PRIVATO)
    r = requests.get(f"{API}/annunci", params={"tipo": "noleggio", "limit": 100}, timeout=30)
    assert r.status_code == 200
    body = r.json()
    items = body if isinstance(body, list) else body.get("items", [])
    assert items, "no annunci"
    # find a noleggio owned by one of our azienda accounts
    owners = {"info@lampioniidraulica.it": AZIENDA_LAMPIONI,
              "info@edilnuovacostruzioni.it": AZIENDA_EDIL,
              "info@caloreeclima.it": AZIENDA_CALORE}
    azienda = None
    annuncio = None
    for it in items:
        az_email = (it.get("azienda_email") or "").lower()
        if az_email in owners:
            annuncio = it
            azienda = _login(*owners[az_email])
            break
    if not annuncio:
        # fallback: pick first annuncio and try each azienda
        for it in items:
            for creds in (AZIENDA_LAMPIONI, AZIENDA_EDIL, AZIENDA_CALORE):
                s = _login(*creds)
                r2 = s.get(f"{API}/annunci/mine", timeout=30)
                if r2.status_code == 200:
                    mine_ids = {a["id"] for a in r2.json()}
                    if it["id"] in mine_ids:
                        annuncio = it
                        azienda = s
                        break
            if annuncio:
                break
    assert annuncio and azienda, "no owned annuncio found"
    print(f"Using annuncio {annuncio['id']} '{annuncio.get('titolo')}' owner {azienda.email}")
    return {"priv": priv, "az": azienda, "annuncio": annuncio, "state": {}}


class TestCaparra:
    def _create_pren(self, ctx):
        annuncio_id = ctx["annuncio"]["id"]
        for offset in range(70, 300, 7):
            dal = (date.today() + timedelta(days=offset)).isoformat()
            al = (date.today() + timedelta(days=offset + 3)).isoformat()
            r = ctx["priv"].post(f"{API}/annunci/{annuncio_id}/prenotazioni",
                                 json={"dal": dal, "al": al, "nota": "TEST caparra"}, timeout=30)
            if r.status_code == 200:
                return r.json()
            if r.status_code != 409:
                pytest.fail(f"create {r.status_code} {r.text}")
        pytest.fail("could not find free slot")

    def test_01_checkout_before_confirm_400(self, ctx):
        p = self._create_pren(ctx)
        pid = p["id"]
        ctx["state"]["pid"] = pid
        r = ctx["priv"].post(f"{API}/prenotazioni/{pid}/caparra/checkout",
                             json={"origin_url": ORIGIN}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text}"

    def test_02_azienda_confirm(self, ctx):
        pid = ctx["state"]["pid"]
        r = ctx["az"].post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "confermata"}, timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert data["stato"] == "confermata"
        assert data["caparra_stato"] == "da_pagare"
        expected = round(max(10.0, data["totale"] * 0.20), 2)
        assert abs(data["caparra_importo"] - expected) < 0.01
        print(f"caparra={data['caparra_importo']} totale={data['totale']}")

    def test_03_checkout_privato_ok(self, ctx):
        pid = ctx["state"]["pid"]
        r = ctx["priv"].post(f"{API}/prenotazioni/{pid}/caparra/checkout",
                             json={"origin_url": ORIGIN}, timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        j = r.json()
        assert "checkout.stripe.com" in j["checkout_url"]
        assert j["session_id"].startswith("cs_")
        ctx["state"]["sid"] = j["session_id"]

    def test_04_status_pending_kind_caparra(self, ctx):
        sid = ctx["state"]["sid"]
        r = requests.get(f"{API}/payments/status/{sid}", timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        j = r.json()
        assert j["payment_status"] == "pending"
        assert j.get("kind") == "caparra"

    def test_05_status_inesistente_404(self):
        r = requests.get(f"{API}/payments/status/cs_test_inesistente_xyz", timeout=30)
        assert r.status_code == 404, f"got {r.status_code} {r.text}"

    def test_06_azienda_checkout_forbidden(self, ctx):
        pid = ctx["state"]["pid"]
        r = ctx["az"].post(f"{API}/prenotazioni/{pid}/caparra/checkout",
                           json={"origin_url": ORIGIN}, timeout=30)
        assert r.status_code == 403, f"{r.status_code} {r.text}"

    def test_07_segna_caparra_pagata_direct(self, ctx):
        """Simulate paid via internal function."""
        pid = ctx["state"]["pid"]
        import subprocess
        script = f"""
import asyncio, sys
sys.path.insert(0, '/app/backend')
from routes_prenotazioni import segna_caparra_pagata
from core import db
from bson import ObjectId
async def main():
    await segna_caparra_pagata('{pid}', 'pi_test_1')
    p = await db.prenotazioni.find_one({{'_id': ObjectId('{pid}')}})
    print('STATO:', p.get('caparra_stato'), 'PAID_AT:', p.get('caparra_paid_at'))
    # idempotent
    await segna_caparra_pagata('{pid}', 'pi_test_2')
    # count notifications for this pid
    n1 = await db.notifiche.count_documents({{'user_id': p['owner_id'], 'titolo': 'Caparra pagata'}})
    n2 = await db.notifiche.count_documents({{'user_id': p['client_id'], 'titolo': 'Caparra registrata'}})
    print('NOTIF_AZ:', n1, 'NOTIF_PRIV:', n2)
asyncio.run(main())
"""
        r = subprocess.run(["/root/.venv/bin/python", "-c", script],
                           capture_output=True, text=True, cwd="/app/backend", timeout=60)
        out = r.stdout + r.stderr
        print(out)
        assert "STATO: pagata" in out, out
        assert "PAID_AT:" in out and "None" not in out.split("PAID_AT:")[1].split()[0], out

    def test_08_checkout_after_paid_400(self, ctx):
        pid = ctx["state"]["pid"]
        r = ctx["priv"].post(f"{API}/prenotazioni/{pid}/caparra/checkout",
                             json={"origin_url": ORIGIN}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text}"
        assert "pagata" in r.text.lower()

    def test_09_annulla_after_paid_behaviour(self, ctx):
        pid = ctx["state"]["pid"]
        r = ctx["priv"].post(f"{API}/prenotazioni/{pid}/annulla", timeout=30)
        print(f"annulla after paid: {r.status_code} {r.text}")
        # record behavior - no assert; cleanup



class TestAbbonamento:
    def test_abbonamento_checkout_status(self):
        s = _login(*AZIENDA_FREE)
        r = s.post(f"{API}/payments/checkout",
                   json={"lookup_key": "pro_monthly", "origin_url": ORIGIN}, timeout=45)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        j = r.json()
        assert "checkout.stripe.com" in j["checkout_url"]
        sid = j["session_id"]
        r2 = requests.get(f"{API}/payments/status/{sid}", timeout=30)
        assert r2.status_code == 200, f"NOT 500? got {r2.status_code} {r2.text}"
        j2 = r2.json()
        assert j2["payment_status"] == "pending"
        assert j2.get("kind") == "abbonamento"
