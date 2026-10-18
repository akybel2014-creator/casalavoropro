"""Tests for /api/interventi CRUD endpoints (azienda role only)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

AZIENDA = {"email": "info@caloreeclima.it", "password": "Demo2026!"}
PRIVATO = {"email": "mario.rossi@example.com", "password": "Demo2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def azienda_session():
    return _login(AZIENDA)


@pytest.fixture(scope="module")
def privato_session():
    return _login(PRIVATO)


@pytest.fixture(scope="module")
def anon_session():
    return requests.Session()


class TestInterventiAccess:
    def test_anon_cannot_list(self, anon_session):
        r = anon_session.get(f"{API}/interventi/mine")
        assert r.status_code in (401, 403)

    def test_privato_cannot_list(self, privato_session):
        r = privato_session.get(f"{API}/interventi/mine")
        assert r.status_code in (401, 403)

    def test_privato_cannot_create(self, privato_session):
        r = privato_session.post(f"{API}/interventi", json={"titolo": "TEST_privato"})
        assert r.status_code in (401, 403)


class TestInterventiCRUD:
    created_id = None

    def test_create(self, azienda_session):
        r = azienda_session.post(f"{API}/interventi", json={
            "titolo": "TEST_Intervento_API",
            "cliente": "Mario Test",
            "importo": 1500.5,
            "stato": "pianificato",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["titolo"] == "TEST_Intervento_API"
        assert data["cliente"] == "Mario Test"
        assert data["importo"] == 1500.5
        assert data["stato"] == "pianificato"
        assert "id" in data
        TestInterventiCRUD.created_id = data["id"]

    def test_create_empty_title_fails(self, azienda_session):
        r = azienda_session.post(f"{API}/interventi", json={"titolo": "   "})
        assert r.status_code == 400

    def test_list_contains_created(self, azienda_session):
        r = azienda_session.get(f"{API}/interventi/mine")
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert TestInterventiCRUD.created_id in ids

    def test_update_stato(self, azienda_session):
        iid = TestInterventiCRUD.created_id
        r = azienda_session.patch(f"{API}/interventi/{iid}/stato", json={"stato": "in_corso"})
        assert r.status_code == 200
        assert r.json()["stato"] == "in_corso"
        # verify persisted
        lr = azienda_session.get(f"{API}/interventi/mine")
        it = next(x for x in lr.json() if x["id"] == iid)
        assert it["stato"] == "in_corso"

    def test_update_stato_invalid(self, azienda_session):
        iid = TestInterventiCRUD.created_id
        r = azienda_session.patch(f"{API}/interventi/{iid}/stato", json={"stato": "nope"})
        assert r.status_code == 400

    def test_delete(self, azienda_session):
        iid = TestInterventiCRUD.created_id
        r = azienda_session.delete(f"{API}/interventi/{iid}")
        assert r.status_code == 200
        # verify removed
        lr = azienda_session.get(f"{API}/interventi/mine")
        ids = [x["id"] for x in lr.json()]
        assert iid not in ids

    def test_delete_nonexistent(self, azienda_session):
        r = azienda_session.delete(f"{API}/interventi/507f1f77bcf86cd799439011")
        assert r.status_code == 404
