"""Backend tests: Rental review (recensione noleggio) and company cancellation with Stripe refund."""
import os
import sys
from datetime import date, datetime, timezone, timedelta
import pytest
import requests

sys.path.insert(0, "/app/backend")

from dotenv import load_dotenv
load_dotenv("/app/frontend/.env")
load_dotenv("/app/backend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ORIGIN = BASE_URL

# Sync pymongo client (avoid motor event-loop issues in pytest)
from pymongo import MongoClient
from bson import ObjectId
_mc = MongoClient(os.environ["MONGO_URL"])
sdb = _mc[os.environ["DB_NAME"]]

PRIVATO = ("mario.rossi@example.com", "Demo2026!")
AZIENDA_EDIL = ("info@edilnuovacostruzioni.it", "Demo2026!")
AZIENDA_LAMPIONI = ("info@lampioniidraulica.it", "Demo2026!")

MARIO_PID = "6ac39a0fd79613950e825cb2"
MARIO_ANNUNCIO_ID = "6ac38bcc988bbc4a470b08f3"
MARIO_AZIENDA_ID = "6abf836b428f188d703b1ffc"


def _login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def privato():
    return _login(*PRIVATO)


@pytest.fixture(scope="module")
def azienda_edil():
    return _login(*AZIENDA_EDIL)


@pytest.fixture(scope="module")
def azienda_other():
    return _login(*AZIENDA_LAMPIONI)


def _create_future_prenotazione(sess, start_offset_days=120, nota="TEST"):
    for offset in range(0, 90, 3):
        d1 = (date.today() + timedelta(days=start_offset_days + offset)).isoformat()
        d2 = (date.today() + timedelta(days=start_offset_days + offset + 2)).isoformat()
        r = sess.post(f"{API}/annunci/{MARIO_ANNUNCIO_ID}/prenotazioni",
                      json={"dal": d1, "al": d2, "nota": nota}, timeout=30)
        if r.status_code == 200:
            return r.json().get("id") or r.json().get("_id")
    pytest.skip(f"Cannot find free slot for prenotazione (offset={start_offset_days})")


def _delete_prenotazione(pid):
    try:
        sdb.prenotazioni.delete_one({"_id": ObjectId(pid)})
    except Exception:
        pass


# ================================================================
# Recensione noleggio
# ================================================================
class TestRecensione:
    def test_01_azienda_cannot_review(self, azienda_edil):
        r = azienda_edil.post(f"{API}/prenotazioni/{MARIO_PID}/recensione",
                              json={"voto_mezzo": 5, "voto_azienda": 4, "commento": "ciao mondo"}, timeout=30)
        assert r.status_code == 403, r.text

    def test_02_validation_voto_out_of_range(self, privato):
        r = privato.post(f"{API}/prenotazioni/{MARIO_PID}/recensione",
                         json={"voto_mezzo": 6, "voto_azienda": 4, "commento": "ciao mondo"}, timeout=30)
        assert r.status_code == 422, r.text

    def test_03_validation_commento_short(self, privato):
        r = privato.post(f"{API}/prenotazioni/{MARIO_PID}/recensione",
                         json={"voto_mezzo": 5, "voto_azienda": 4, "commento": "abc"}, timeout=30)
        assert r.status_code == 422, r.text

    def test_04_recensione_success(self, privato):
        # Cleanup any pre-existing recensione for this prenotazione
        sdb.recensioni_noleggio.delete_many({"prenotazione_id": MARIO_PID})
        sdb.prenotazioni.update_one({"_id": ObjectId(MARIO_PID)}, {"$unset": {"recensione": ""}})

        a_before = requests.get(f"{API}/aziende/{MARIO_AZIENDA_ID}", timeout=30).json()
        pre_recensioni = a_before.get("recensioni", 0)

        r = privato.post(f"{API}/prenotazioni/{MARIO_PID}/recensione",
                         json={"voto_mezzo": 5, "voto_azienda": 4,
                               "commento": "Betoniera perfetta, consegna puntuale"}, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["voto_mezzo"] == 5
        assert body["voto_azienda"] == 4

        an = requests.get(f"{API}/annunci/{MARIO_ANNUNCIO_ID}", timeout=30).json()
        assert an.get("rating") == 5.0, f"annuncio rating {an.get('rating')}"
        assert an.get("recensioni") == 1, f"annuncio recensioni {an.get('recensioni')}"

        a_after = requests.get(f"{API}/aziende/{MARIO_AZIENDA_ID}", timeout=30).json()
        # Note: _recompute_azienda_rating overwrites with actual counts from recensioni + recensioni_noleggio
        # EdilNuova's cosmetic seed (132 recensioni) is replaced by actual DB counts (0 + 1 = 1)
        actual_rec = sdb.recensioni.count_documents({"azienda_id": MARIO_AZIENDA_ID})
        actual_rec_nol = sdb.recensioni_noleggio.count_documents({"azienda_id": MARIO_AZIENDA_ID})
        assert a_after.get("recensioni") == actual_rec + actual_rec_nol, \
            f"azienda recensioni count mismatch: {a_after.get('recensioni')} vs {actual_rec+actual_rec_nol}"

        r2 = requests.get(f"{API}/annunci/{MARIO_ANNUNCIO_ID}/recensioni", timeout=30)
        assert r2.status_code == 200
        lst = r2.json()
        assert any(x.get("commento", "").startswith("Betoniera perfetta") for x in lst)
        for x in lst:
            assert "client_id" not in x, f"client_id leaked: {x}"

        mine = privato.get(f"{API}/prenotazioni/mine", timeout=30).json()
        found = next((p for p in mine if (p.get("id") or p.get("_id")) == MARIO_PID), None)
        assert found and found.get("recensione"), f"recensione not embedded in /mine: {found}"
        assert found["recensione"]["voto_mezzo"] == 5
        assert found["recensione"]["voto_azienda"] == 4

    def test_05_duplicate_recensione(self, privato):
        r = privato.post(f"{API}/prenotazioni/{MARIO_PID}/recensione",
                         json={"voto_mezzo": 4, "voto_azienda": 4, "commento": "duplicato test"}, timeout=30)
        assert r.status_code == 400, r.text

    def test_06_future_prenotazione_cannot_review(self, privato):
        dal = (date.today() + timedelta(days=200)).isoformat()
        al = (date.today() + timedelta(days=202)).isoformat()
        doc = {"annuncio_id": MARIO_ANNUNCIO_ID, "annuncio_titolo": "Betoniera 350 L elettrica",
               "azienda_id": MARIO_AZIENDA_ID, "azienda_nome": "EdilNuova Costruzioni",
               "owner_id": "6abf836b428f188d703b1ffb",
               "client_id": "6abf836c428f188d703b2005", "client_name": "Mario Rossi",
               "dal": dal, "al": al, "giorni": 3, "prezzo": 35.0, "unita": "giorno",
               "totale": 105.0, "nota": "TEST future", "stato": "confermata",
               "created_at": datetime.now(timezone.utc)}
        pid = str(sdb.prenotazioni.insert_one(doc).inserted_id)
        try:
            r = privato.post(f"{API}/prenotazioni/{pid}/recensione",
                             json={"voto_mezzo": 5, "voto_azienda": 5, "commento": "non ancora conclusa"}, timeout=30)
            assert r.status_code == 400, r.text
            assert "fine" in r.text.lower() or "periodo" in r.text.lower()
        finally:
            _delete_prenotazione(pid)

    def test_07_non_confermata_cannot_review(self, privato):
        dal = (date.today() - timedelta(days=20)).isoformat()
        al = (date.today() - timedelta(days=18)).isoformat()
        doc = {"annuncio_id": MARIO_ANNUNCIO_ID, "annuncio_titolo": "Betoniera 350 L elettrica",
               "azienda_id": MARIO_AZIENDA_ID, "azienda_nome": "EdilNuova Costruzioni",
               "owner_id": "6abf836b428f188d703b1ffb",
               "client_id": "6abf836c428f188d703b2005", "client_name": "Mario Rossi",
               "dal": dal, "al": al, "giorni": 3, "prezzo": 35.0, "unita": "giorno",
               "totale": 105.0, "nota": "TEST past richiesta", "stato": "richiesta",
               "created_at": datetime.now(timezone.utc)}
        pid = str(sdb.prenotazioni.insert_one(doc).inserted_id)
        try:
            r = privato.post(f"{API}/prenotazioni/{pid}/recensione",
                             json={"voto_mezzo": 5, "voto_azienda": 5, "commento": "stato sbagliato"}, timeout=30)
            assert r.status_code == 400, r.text
        finally:
            _delete_prenotazione(pid)


# ================================================================
# Annulla-azienda senza caparra
# ================================================================
class TestAnnullaAzienda:
    @pytest.fixture
    def pid(self, privato, azienda_edil):
        pid = _create_future_prenotazione(privato, 120, "TEST annulla-az")
        # confirm
        rc = azienda_edil.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "confermata"}, timeout=30)
        assert rc.status_code == 200, rc.text
        yield pid
        _delete_prenotazione(pid)

    def test_01_privato_forbidden(self, privato, pid):
        r = privato.post(f"{API}/prenotazioni/{pid}/annulla-azienda", json={"motivo": "x"}, timeout=30)
        assert r.status_code == 403, r.text

    def test_02_altra_azienda_forbidden(self, azienda_other, pid):
        r = azienda_other.post(f"{API}/prenotazioni/{pid}/annulla-azienda", json={"motivo": "x"}, timeout=30)
        assert r.status_code == 403, r.text

    def test_03_annulla_success_senza_caparra(self, azienda_edil, pid):
        r = azienda_edil.post(f"{API}/prenotazioni/{pid}/annulla-azienda",
                              json={"motivo": "Mezzo in manutenzione"}, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["stato"] == "annullata"
        assert body.get("annullata_da") == "azienda"
        assert body.get("motivo_annullamento") == "Mezzo in manutenzione"
        assert body.get("caparra_stato") in (None, "da_pagare")
        # second call -> 400
        r2 = azienda_edil.post(f"{API}/prenotazioni/{pid}/annulla-azienda",
                               json={"motivo": "again"}, timeout=30)
        assert r2.status_code == 400, r2.text

    def test_04_annulla_su_richiesta(self, privato, azienda_edil):
        pid = _create_future_prenotazione(privato, 160, "TEST annulla richiesta")
        try:
            ra = azienda_edil.post(f"{API}/prenotazioni/{pid}/annulla-azienda",
                                   json={"motivo": "cambio idea"}, timeout=30)
            assert ra.status_code == 200, ra.text
            assert ra.json()["stato"] == "annullata"
        finally:
            _delete_prenotazione(pid)


# ================================================================
# Stripe refund (real test mode)
# ================================================================
class TestStripeRefund:
    def _confirm_prenotazione(self, privato, azienda_edil, offset_days):
        pid = _create_future_prenotazione(privato, offset_days, f"TEST stripe {offset_days}")
        rc = azienda_edil.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "confermata"}, timeout=30)
        assert rc.status_code == 200
        return pid

    def test_01_rimborso_stripe_real(self, privato, azienda_edil):
        pid = self._confirm_prenotazione(privato, azienda_edil, offset_days=90)
        try:
            import stripe
            stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
            p = sdb.prenotazioni.find_one({"_id": ObjectId(pid)})
            amount_cents = int(round(p["caparra_importo"] * 100))
            pi = stripe.PaymentIntent.create(
                amount=amount_cents, currency="eur",
                payment_method="pm_card_visa", confirm=True,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"})
            assert pi.status == "succeeded", f"PI status {pi.status}"
            # Mark deposit paid directly in DB (bypass notify to avoid motor loop issues)
            sdb.prenotazioni.update_one(
                {"_id": ObjectId(pid), "caparra_stato": {"$ne": "pagata"}},
                {"$set": {"caparra_stato": "pagata",
                          "caparra_paid_at": datetime.now(timezone.utc),
                          "caparra_payment_intent": pi.id}})
            # company cancels -> should refund
            r = azienda_edil.post(f"{API}/prenotazioni/{pid}/annulla-azienda",
                                  json={"motivo": "Guasto improvviso"}, timeout=60)
            assert r.status_code == 200, r.text
            body = r.json()
            assert body["stato"] == "annullata"
            assert body.get("caparra_stato") == "rimborsata", body
            refund_id = body.get("caparra_refund_id")
            assert refund_id and refund_id.startswith("re_"), f"refund_id={refund_id}"
            refund = stripe.Refund.retrieve(refund_id)
            assert refund.status in ("succeeded", "pending"), f"refund status {refund.status}"
        finally:
            _delete_prenotazione(pid)

    def test_02_caparra_pagata_senza_payment_intent(self, privato, azienda_edil):
        pid = self._confirm_prenotazione(privato, azienda_edil, offset_days=50)
        try:
            # force caparra_stato=pagata but no payment intent and no transaction
            sdb.prenotazioni.update_one({"_id": ObjectId(pid)},
                                        {"$set": {"caparra_stato": "pagata",
                                                  "caparra_payment_intent": None}})
            sdb.payment_transactions.delete_many({"prenotazione_id": pid})

            r = azienda_edil.post(f"{API}/prenotazioni/{pid}/annulla-azienda",
                                  json={"motivo": "nessun PI"}, timeout=30)
            assert r.status_code == 400, r.text
            assert "rimborsare" in r.text.lower() or "pagamento" in r.text.lower()

            # ensure state unchanged
            p = sdb.prenotazioni.find_one({"_id": ObjectId(pid)})
            assert p["stato"] == "confermata"
            assert p["caparra_stato"] == "pagata"
        finally:
            _delete_prenotazione(pid)


# ================================================================
# Regression
# ================================================================
class TestRegression:
    def test_01_privato_annulla_blocked_after_caparra(self, privato):
        # Mario's original prenotazione still has caparra_stato=pagata
        r = privato.post(f"{API}/prenotazioni/{MARIO_PID}/annulla", timeout=30)
        assert r.status_code == 400, r.text
        assert "caparra" in r.text.lower()

    def test_02_caparra_checkout_still_works(self, privato, azienda_edil):
        pid = _create_future_prenotazione(privato, 220, "TEST checkout")
        try:
            azienda_edil.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "confermata"}, timeout=30)
            rc = privato.post(f"{API}/prenotazioni/{pid}/caparra/checkout",
                              json={"origin_url": ORIGIN}, timeout=30)
            assert rc.status_code == 200, rc.text
            body = rc.json()
            assert body.get("checkout_url", "").startswith("https://")
            assert "stripe" in body.get("checkout_url", "")
        finally:
            _delete_prenotazione(pid)
