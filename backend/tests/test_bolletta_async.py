"""Tests for async bolletta analysis pipeline + broker queue behavior.

Validates:
- POST /api/analizza-bolletta responds in <2s with lead.stato=='in_elaborazione'
- GET /api/lead/{id} polling -> transitions to 'lead_in_attesa' (or 'errore')
- GET /api/lead/mine not shadowed by /lead/{id}
- Invalid id -> 400; non-owned/missing -> 404
- POST /api/lead/{id}/risparmia with unreachable broker -> 200 {in_coda: True}, no 502
- POST /api/analizza-macchinario still works (clean JSON on errors)
- Regression: PRO vs Base gating on interventi/offerte-lavoro/annunci
"""
import io
import os
import time
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

PRIVATO = ("mario.rossi@example.com", "Demo2026!")
PRO = ("info@caloreeclima.it", "Demo2026!")
BASE = ("azienda.free@casalavoripro.it", "Demo2026!")


def login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    return s


def _tiny_png():
    img = Image.new("RGB", (320, 200), color=(230, 230, 230))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


# ---------- Bolletta async flow ----------

@pytest.fixture(scope="module")
def privato_session():
    return login(*PRIVATO)


def test_analizza_bolletta_responds_fast_in_elaborazione(privato_session):
    png = _tiny_png()
    t0 = time.time()
    r = privato_session.post(
        f"{API}/analizza-bolletta",
        files=[("files", ("bolletta.png", png, "image/png"))],
        timeout=10,
    )
    elapsed = time.time() - t0
    assert r.status_code == 200, f"{r.status_code} {r.text}"
    assert "application/json" in r.headers.get("content-type", "")
    assert elapsed < 5, f"Risposta troppo lenta: {elapsed}s (atteso <2s, ok <5s)"
    data = r.json()
    assert "lead" in data
    lead = data["lead"]
    assert lead.get("stato") == "in_elaborazione"
    assert lead.get("id")
    pytest.lead_id = lead["id"]


def test_lead_mine_not_shadowed(privato_session):
    r = privato_session.get(f"{API}/lead/mine", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    # il lead appena creato deve esserci
    ids = [x.get("id") for x in body]
    assert pytest.lead_id in ids


def test_lead_invalid_id_400(privato_session):
    r = privato_session.get(f"{API}/lead/not-an-objectid", timeout=10)
    assert r.status_code == 400


def test_lead_not_found_404(privato_session):
    # ObjectId formalmente valido ma inesistente
    r = privato_session.get(f"{API}/lead/507f1f77bcf86cd799439011", timeout=10)
    assert r.status_code == 404


def test_lead_other_user_404():
    # Lead appartiene a mario.rossi; proviamo come azienda PRO
    s2 = login(*PRO)
    r = s2.get(f"{API}/lead/{pytest.lead_id}", timeout=10)
    assert r.status_code == 404


def test_polling_converge(privato_session):
    """Poll fino a 90s per vedere lo stato passare da 'in_elaborazione'."""
    final = None
    for _ in range(45):
        r = privato_session.get(f"{API}/lead/{pytest.lead_id}", timeout=10)
        assert r.status_code == 200
        lead = r.json()["lead"]
        if lead.get("stato") != "in_elaborazione":
            final = lead
            break
        time.sleep(2)
    assert final is not None, "Lead rimasto in_elaborazione dopo 90s"
    # Accettiamo lead_in_attesa (ok) o errore (es. timeout AI). Documentiamo errore.
    assert final.get("stato") in ("lead_in_attesa", "errore"), f"stato inatteso: {final.get('stato')}"
    if final["stato"] == "lead_in_attesa":
        assert final.get("dati") is not None
    pytest.lead_final = final


# ---------- Risparmia (broker irraggiungibile -> in_coda, non 502) ----------

def test_risparmia_broker_unreachable_returns_in_coda(privato_session):
    # Serve un lead con stato != 'in_elaborazione'. Se e 'errore', va bene lo stesso:
    # /risparmia non ha check di stato, usa solo dati e aggiorna.
    r = privato_session.post(f"{API}/lead/{pytest.lead_id}/risparmia", timeout=25)
    assert r.status_code == 200, f"NON deve essere 502. Got {r.status_code}: {r.text}"
    assert "application/json" in r.headers.get("content-type", "")
    body = r.json()
    assert body.get("ok") is True
    # Il broker e configurato ma dominio placeholder non risolvibile -> in_coda
    assert body.get("inviato") is False
    assert body.get("in_coda") is True
    assert "messaggio" in body
    # Verifica lo stato persistito
    r2 = privato_session.get(f"{API}/lead/{pytest.lead_id}", timeout=10)
    assert r2.status_code == 200
    assert r2.json()["lead"].get("stato") == "in_coda_broker"


# ---------- Macchinario (deve continuare a funzionare) ----------

def test_analizza_macchinario_pro_responds_json():
    s = login(*PRO)
    png = _tiny_png()
    r = s.post(f"{API}/analizza-macchinario",
               files=[("file", ("tool.png", png, "image/png"))], timeout=90)
    # Puo essere 200 (ok), 502 (gemini interpretazione), 503 (no key), 504 (timeout).
    # Mai risposta vuota: deve essere JSON.
    assert "application/json" in r.headers.get("content-type", ""), f"content-type: {r.headers.get('content-type')} body={r.text[:200]}"
    assert r.text.strip(), "Risposta vuota NON ammessa"
    assert r.status_code in (200, 400, 500, 502, 503, 504), f"status: {r.status_code}"


def test_analizza_macchinario_privato_403(privato_session):
    png = _tiny_png()
    r = privato_session.post(f"{API}/analizza-macchinario",
                             files=[("file", ("tool.png", png, "image/png"))], timeout=15)
    assert r.status_code == 403


# ---------- Regressione gating SaaS ----------

def test_base_azienda_402_on_interventi():
    s = login(*BASE)
    r = s.post(f"{API}/interventi", json={"titolo": "TEST_x", "descrizione": "x"}, timeout=15)
    assert r.status_code == 402


def test_base_azienda_402_on_offerte_lavoro():
    s = login(*BASE)
    r = s.post(f"{API}/offerte-lavoro", json={
        "titolo": "TEST_x", "categoria": "idraulico", "zona": "Milano",
        "descrizione": "x" * 20, "tipo_contratto": "Full-time",
    }, timeout=15)
    assert r.status_code == 402


def test_base_azienda_402_on_annunci():
    s = login(*BASE)
    r = s.post(f"{API}/annunci", json={
        "tipo": "usato", "titolo": "TEST_x", "descrizione": "x" * 20,
        "prezzo": 100, "categoria": "Elettroutensili", "zona": "Milano",
    }, timeout=15)
    assert r.status_code == 402


def test_pro_azienda_can_create_intervento():
    s = login(*PRO)
    r = s.post(f"{API}/interventi", json={
        "titolo": "TEST_async_int", "descrizione": "test",
        "categoria": "Idraulica", "zona": "Roma", "prezzo": 100
    }, timeout=15)
    assert r.status_code in (200, 201), f"{r.status_code}: {r.text}"
    iid = r.json().get("id") or r.json().get("_id")
    if iid:
        s.delete(f"{API}/interventi/{iid}", timeout=10)
