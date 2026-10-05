"""Backend tests for 'Aziende preferite' endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

PRIVATO = {"email": "mario.rossi@example.com", "password": "Demo2026!"}
AZIENDA = {"email": "info@caloreeclima.it", "password": "Demo2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code}: {r.text}"
    return s


@pytest.fixture(scope="module")
def privato_session():
    return _login(PRIVATO)


@pytest.fixture(scope="module")
def azienda_session():
    return _login(AZIENDA)


@pytest.fixture(scope="module")
def azienda_id():
    r = requests.get(f"{API}/aziende", timeout=15)
    assert r.status_code == 200
    data = r.json()
    items = data if isinstance(data, list) else data.get("items") or data.get("aziende") or []
    assert items, "no aziende available"
    return items[0]["id"]


def test_list_ids_initial(privato_session):
    r = privato_session.get(f"{API}/preferiti/ids")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_put_requires_auth(azienda_id):
    r = requests.put(f"{API}/preferiti/{azienda_id}", timeout=15)
    assert r.status_code == 401


def test_put_azienda_forbidden(azienda_session, azienda_id):
    r = azienda_session.put(f"{API}/preferiti/{azienda_id}")
    assert r.status_code == 403


def test_put_malformed_id(privato_session):
    r = privato_session.put(f"{API}/preferiti/not-an-objectid")
    assert r.status_code == 404


def test_put_nonexistent_id(privato_session):
    r = privato_session.put(f"{API}/preferiti/000000000000000000000000")
    assert r.status_code == 404


def test_put_idempotent_and_persistence(privato_session, azienda_id):
    r1 = privato_session.put(f"{API}/preferiti/{azienda_id}")
    assert r1.status_code == 200
    r2 = privato_session.put(f"{API}/preferiti/{azienda_id}")
    assert r2.status_code == 200
    ids = privato_session.get(f"{API}/preferiti/ids").json()
    assert ids.count(azienda_id) == 1

    r = privato_session.get(f"{API}/preferiti")
    assert r.status_code == 200
    items = r.json()
    assert any(a["id"] == azienda_id for a in items)
    saved = next(a for a in items if a["id"] == azienda_id)
    assert "saved_at" in saved
    assert "owner_id" not in saved
    assert "_id" not in saved


def test_delete_removes(privato_session, azienda_id):
    r = privato_session.delete(f"{API}/preferiti/{azienda_id}")
    assert r.status_code == 200
    ids = privato_session.get(f"{API}/preferiti/ids").json()
    assert azienda_id not in ids
