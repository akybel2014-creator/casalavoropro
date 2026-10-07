"""Backend tests for annunci sottocategorie validation + offerte-lavoro CRUD."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TRIAL = {"email": "trial@test.it", "password": "Demo2026!"}
OTHER = {"email": "info@caloreeclima.it", "password": "Demo2026!"}
PRIV = {"email": "mario.rossi@example.com", "password": "Demo2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login {creds['email']} failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def trial_session():
    return _login(TRIAL)


@pytest.fixture(scope="module")
def other_session():
    return _login(OTHER)


# ---------- Annunci meta + sottocategorie ----------
class TestAnnunciMeta:
    def test_meta_returns_categorie_and_sottocategorie(self):
        r = requests.get(f"{API}/annunci/meta", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data.get("categorie"), list) and len(data["categorie"]) > 0
        assert isinstance(data.get("sottocategorie"), dict)
        for cat in data["categorie"]:
            assert cat in data["sottocategorie"], f"missing sottocategorie for {cat}"
            assert isinstance(data["sottocategorie"][cat], list)


class TestAnnuncioSottocategoria:
    created_id = None

    def test_create_with_valid_sottocategoria(self, trial_session):
        payload = {
            "tipo": "noleggio",
            "titolo": "TEST_ Escavatore cingolato",
            "descrizione": "Macchina per test automatici, perfetta per scavi.",
            "categoria": "Movimento terra",
            "sottocategoria": "Escavatori",
            "zona": "Milano",
            "prezzo": 150.0,
            "unita": "giorno",
        }
        r = trial_session.post(f"{API}/annunci", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["categoria"] == "Movimento terra"
        assert data["sottocategoria"] == "Escavatori"
        TestAnnuncioSottocategoria.created_id = data["id"]

    def test_create_with_invalid_sottocategoria_returns_400(self, trial_session):
        payload = {
            "tipo": "noleggio",
            "titolo": "TEST_ invalid sub",
            "descrizione": "Test sottocategoria non appartenente alla categoria.",
            "categoria": "Movimento terra",
            "sottocategoria": "Tagliaerba",  # belongs to Giardinaggio
            "zona": "Milano",
            "prezzo": 100.0,
        }
        r = trial_session.post(f"{API}/annunci", json=payload, timeout=30)
        assert r.status_code == 400, r.text

    def test_list_filtered_by_sottocategoria(self):
        r = requests.get(
            f"{API}/annunci",
            params={"tipo": "noleggio", "categoria": "Movimento terra", "sottocategoria": "Escavatori"},
            timeout=20,
        )
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        for it in items:
            assert it.get("categoria") == "Movimento terra"
            assert it.get("sottocategoria") == "Escavatori"
            assert it.get("tipo") == "noleggio"

    def test_cleanup_created(self, trial_session):
        if TestAnnuncioSottocategoria.created_id:
            r = trial_session.delete(f"{API}/annunci/{TestAnnuncioSottocategoria.created_id}", timeout=20)
            assert r.status_code == 200


# ---------- Offerte di lavoro CRUD ----------
class TestOfferteLavoro:
    created_id = None

    def test_create_offerta(self, trial_session):
        payload = {
            "titolo": "TEST_ Assunzione Muratore",
            "descrizione": "Cerchiamo muratore qualificato per cantieri a Milano.",
            "zona": "Milano",
            "tipo_contratto": "Full-time",
            "retribuzione": "1800-2200 EUR",
            "contatto_email": "jobs@test.it",
        }
        r = trial_session.post(f"{API}/offerte-lavoro", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["titolo"] == payload["titolo"]
        assert data["tipo_contratto"] == "Full-time"
        assert "id" in data
        TestOfferteLavoro.created_id = data["id"]
        TestOfferteLavoro.azienda_id = data["azienda_id"]

    def test_create_invalid_tipo_contratto(self, trial_session):
        payload = {
            "titolo": "TEST_ Invalid contratto",
            "descrizione": "Descrizione sufficientemente lunga per il test.",
            "zona": "Milano",
            "tipo_contratto": "Freelance",
        }
        r = trial_session.post(f"{API}/offerte-lavoro", json=payload, timeout=30)
        assert r.status_code == 400, r.text

    def test_mine_lists_offerta(self, trial_session):
        r = trial_session.get(f"{API}/offerte-lavoro/mine", timeout=20)
        assert r.status_code == 200
        ids = [o["id"] for o in r.json()]
        assert TestOfferteLavoro.created_id in ids

    def test_update_offerta_owner(self, trial_session):
        r = trial_session.put(
            f"{API}/offerte-lavoro/{TestOfferteLavoro.created_id}",
            json={"titolo": "TEST_ Assunzione Muratore (upd)"},
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["titolo"] == "TEST_ Assunzione Muratore (upd)"

    def test_update_offerta_other_owner_403(self, other_session):
        r = other_session.put(
            f"{API}/offerte-lavoro/{TestOfferteLavoro.created_id}",
            json={"titolo": "hacked"},
            timeout=20,
        )
        assert r.status_code == 403, r.text

    def test_public_offerte_by_azienda(self):
        r = requests.get(
            f"{API}/aziende/{TestOfferteLavoro.azienda_id}/offerte-lavoro", timeout=20
        )
        assert r.status_code == 200
        items = r.json()
        assert any(o["id"] == TestOfferteLavoro.created_id for o in items)
        for o in items:
            assert o.get("attivo") is True

    def test_delete_offerta_other_owner_403(self, other_session):
        r = other_session.delete(
            f"{API}/offerte-lavoro/{TestOfferteLavoro.created_id}", timeout=20
        )
        assert r.status_code == 403

    def test_delete_offerta_owner(self, trial_session):
        r = trial_session.delete(
            f"{API}/offerte-lavoro/{TestOfferteLavoro.created_id}", timeout=20
        )
        assert r.status_code == 200
        # verify gone from mine
        r2 = trial_session.get(f"{API}/offerte-lavoro/mine", timeout=20)
        ids = [o["id"] for o in r2.json()]
        assert TestOfferteLavoro.created_id not in ids
