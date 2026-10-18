"""Backend tests for new SaaS subscription model (credit/wallet removed).

Covers:
- /api/auth/register: new azienda has plan=free, subscription_status=none
- /api/billing/me and /api/billing/trial
- PRO gating (402) on interventi/offerte-lavoro/annunci for Base
- PRO company (info@caloreeclima.it) can create interventi/offerte/annunci
- Old credit endpoints removed (404/405)
- Admin metrics / users new shape (no credits fields)
- Admin PATCH role
"""
import os
import uuid
import pytest
import requests
from pathlib import Path

def _load_frontend_url():
    env = Path("/app/frontend/.env")
    for line in env.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip().strip('"')
    raise RuntimeError("REACT_APP_BACKEND_URL not found")

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_url()).rstrip("/") + "/api"

ADMIN = ("admin@casalavoripro.it", "Admin2026!")
PRO_AZIENDA = ("info@caloreeclima.it", "Demo2026!")
BASE_AZIENDA = ("azienda.free@casalavoripro.it", "Demo2026!")


def _login(email, password):
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def admin_session():
    return _login(*ADMIN)


@pytest.fixture(scope="session")
def pro_session():
    return _login(*PRO_AZIENDA)


@pytest.fixture(scope="session")
def base_session():
    return _login(*BASE_AZIENDA)


# -------- Registration: new azienda defaults -----------------------------------
def test_register_new_azienda_defaults_to_free():
    tag = uuid.uuid4().hex[:8]
    email = f"TEST_az_{tag}@example.com"
    payload = {
        "email": email,
        "password": "Test2026!",
        "ruolo": "azienda",
        "name": f"TEST Az {tag}",
        "azienda": {"nome": f"TEST Az {tag}", "categorie": ["idraulico"], "zone": ["Milano"]},
    }
    s = requests.Session()
    r = s.post(f"{BASE}/auth/register", json=payload, timeout=20)
    assert r.status_code in (200, 201), f"register: {r.status_code} {r.text}"
    # Check billing/me
    me = s.get(f"{BASE}/billing/me", timeout=15)
    assert me.status_code == 200
    data = me.json()
    assert data["pro_active"] is False, data
    assert data["plan"] == "free", data
    assert data["subscription_status"] in (None, "none"), data

    # Trial should be eligible
    tr = s.get(f"{BASE}/billing/trial", timeout=15)
    assert tr.status_code == 200
    tj = tr.json()
    assert tj["eligible"] is True
    assert tj["days"] == 14


# -------- billing/me for existing accounts -------------------------------------
def test_billing_me_base(base_session):
    r = base_session.get(f"{BASE}/billing/me", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["pro_active"] is False, data


def test_billing_me_pro(pro_session):
    r = pro_session.get(f"{BASE}/billing/me", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["pro_active"] is True, data


# -------- Gating 402 for Base azienda ------------------------------------------
def test_base_cannot_create_intervento(base_session):
    r = base_session.post(f"{BASE}/interventi", json={"titolo": "TEST_block"}, timeout=15)
    assert r.status_code == 402, f"expected 402, got {r.status_code}: {r.text}"


def test_base_cannot_create_offerta_lavoro(base_session):
    r = base_session.post(f"{BASE}/offerte-lavoro", json={
        "titolo": "TEST_block", "categoria": "idraulico", "zona": "Milano",
        "descrizione": "x" * 20, "tipo_contratto": "Full-time",
    }, timeout=15)
    assert r.status_code == 402, f"expected 402, got {r.status_code}: {r.text}"


def test_base_cannot_create_annuncio(base_session):
    r = base_session.post(f"{BASE}/annunci", json={
        "tipo": "usato", "titolo": "TEST_block", "descrizione": "x" * 20,
        "prezzo": 100, "categoria": "Elettroutensili", "zona": "Milano",
    }, timeout=15)
    assert r.status_code == 402, f"expected 402, got {r.status_code}: {r.text}"


# -------- PRO azienda can create -----------------------------------------------
def test_pro_can_create_intervento(pro_session):
    r = pro_session.post(f"{BASE}/interventi", json={"titolo": "TEST_pro_int"}, timeout=15)
    assert r.status_code == 200, f"{r.status_code}: {r.text}"
    doc = r.json()
    iid = doc.get("id")
    assert iid
    # cleanup
    pro_session.delete(f"{BASE}/interventi/{iid}", timeout=15)


def test_pro_can_create_offerta(pro_session):
    r = pro_session.post(f"{BASE}/offerte-lavoro", json={
        "titolo": "TEST_pro_off", "categoria": "idraulico", "zona": "Milano",
        "descrizione": "x" * 20, "tipo_contratto": "Full-time",
    }, timeout=15)
    assert r.status_code == 200, f"{r.status_code}: {r.text}"
    oid = r.json().get("id")
    if oid:
        pro_session.delete(f"{BASE}/offerte-lavoro/{oid}", timeout=15)


def test_pro_can_create_annuncio(pro_session):
    r = pro_session.post(f"{BASE}/annunci", json={
        "tipo": "usato", "titolo": "TEST_pro_ann", "descrizione": "x" * 20,
        "prezzo": 100, "categoria": "Elettroutensili", "zona": "Milano",
    }, timeout=15)
    assert r.status_code == 200, f"{r.status_code}: {r.text}"
    aid = r.json().get("id")
    if aid:
        pro_session.delete(f"{BASE}/annunci/{aid}", timeout=15)


# -------- Old credit endpoints must be gone ------------------------------------
@pytest.mark.parametrize("method,path", [
    ("GET", "/crediti/wallet"),
    ("GET", "/crediti/costi"),
    ("GET", "/crediti/movimenti"),
    ("POST", "/crediti/sblocca-contatto"),
    ("POST", "/stripe/create-checkout-session"),
])
def test_credit_endpoints_gone(pro_session, method, path):
    r = pro_session.request(method, f"{BASE}{path}", json={} if method == "POST" else None, timeout=15)
    assert r.status_code in (404, 405), f"{method} {path} returned {r.status_code}: {r.text[:200]}"


def test_admin_credits_endpoint_gone(admin_session):
    r = admin_session.patch(f"{BASE}/admin/users/anyid/credits", json={"amount": 1}, timeout=15)
    assert r.status_code in (404, 405), f"got {r.status_code}: {r.text[:200]}"


# -------- Admin metrics new shape ----------------------------------------------
def test_admin_metrics_shape(admin_session):
    r = admin_session.get(f"{BASE}/admin/metrics", timeout=15)
    assert r.status_code == 200
    data = r.json()
    for k in ("mrr_eur", "active_subscriptions", "trial_subscriptions", "counts"):
        assert k in data, f"missing {k} in {data}"
    counts = data["counts"]
    for k in ("privati", "aziende_pro", "aziende_trial", "aziende_free", "aziende_totali", "totale"):
        assert k in counts, f"missing counts.{k} in {counts}"
    assert "credit_revenue" not in data


def test_admin_users_shape(admin_session):
    r = admin_session.get(f"{BASE}/admin/users", timeout=15)
    assert r.status_code == 200
    data = r.json()
    items = data if isinstance(data, list) else (data.get("items") or data.get("users") or [])
    assert isinstance(items, list) and items, data
    sample = items[0]
    # No old credit fields
    assert "bonus_credits" not in sample
    assert "purchased_credits" not in sample
    has_plan = any("plan" in it for it in items)
    has_sub = any("subscription_status" in it for it in items)
    assert has_plan, "no 'plan' field in any admin users item"
    assert has_sub, "no 'subscription_status' field in any admin users item"


def test_admin_patch_role(admin_session):
    r = admin_session.get(f"{BASE}/admin/users?q=mario.rossi", timeout=15)
    assert r.status_code == 200
    data = r.json()
    items = data if isinstance(data, list) else (data.get("items") or data.get("users") or [])
    target = next((u for u in items if u.get("email") == "mario.rossi@example.com"), None)
    if not target:
        pytest.skip("mario.rossi not found")
    uid = target.get("id") or target.get("_id")
    original = target.get("role", "privato")
    # Attempt the PATCH; revert immediately
    r2 = admin_session.patch(f"{BASE}/admin/users/{uid}/role", json={"role": "azienda"}, timeout=15)
    assert r2.status_code == 200, f"{r2.status_code}: {r2.text}"
    # revert
    admin_session.patch(f"{BASE}/admin/users/{uid}/role", json={"role": original}, timeout=15)
