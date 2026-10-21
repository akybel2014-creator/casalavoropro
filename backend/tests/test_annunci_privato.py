"""Backend regression for 'Vendo' module - privato publishing products in marketplace."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend/.env (when running pytest outside preview)
    try:
        with open("/app/frontend/.env") as fh:
            for line in fh:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
PRIVATO = {"email": "privato@test.it", "password": "Privato2026!"}
ADMIN = {"email": "admin@casalavoripro.it", "password": "Admin2026!"}
OTHER_PRIVATO = {"email": "mario.rossi@example.com", "password": "Demo2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"login failed {creds['email']}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def privato_session():
    return _login(PRIVATO)


@pytest.fixture(scope="module")
def other_session():
    return _login(OTHER_PRIVATO)


def test_meta_available():
    r = requests.get(f"{API}/annunci/meta", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "categorie" in data and "stati_usato" in data
    assert "Giardinaggio" in data["categorie"]


def test_privato_create_update_photo_url_delete(privato_session, other_session):
    # CREATE
    payload = {
        "titolo": "TEST_Tagliaerba usato",
        "descrizione": "Tagliaerba a benzina usato pochissimo, buone condizioni",
        "categoria": "Giardinaggio",
        "sottocategoria": "Tagliaerba",
        "zona": "Bologna",
        "prezzo": 180.0,
        "stato": "Buono",
        "telefono": "+39 333 1234567",
    }
    r = privato_session.post(f"{API}/annunci/privato", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    ann = r.json()
    assert ann["tipo"] == "usato"
    assert ann["venditore_privato"] is True
    assert ann["azienda_telefono"] == "+39 333 1234567"
    assert ann["azienda_nome"]  # user name used
    assert ann["unita"] == "fisso"
    ann_id = ann["id"]

    # Appears in /annunci/mine
    r = privato_session.get(f"{API}/annunci/mine", timeout=10)
    assert r.status_code == 200
    assert any(a["id"] == ann_id for a in r.json())

    # Appears in public marketplace /annunci?tipo=usato
    r = requests.get(f"{API}/annunci", params={"tipo": "usato", "limit": 200}, timeout=10)
    assert r.status_code == 200
    found = next((a for a in r.json() if a["id"] == ann_id), None)
    assert found is not None, "annuncio privato non appare nel marketplace pubblico"
    assert found.get("venditore_privato") is True
    assert found.get("azienda_telefono") == "+39 333 1234567"

    # Phone validation: too short
    bad = {**payload, "titolo": "TEST_bad", "telefono": "123"}
    r = privato_session.post(f"{API}/annunci/privato", json=bad, timeout=10)
    assert r.status_code == 422

    # Non-authenticated/azienda cannot create via /privato endpoint
    r = requests.post(f"{API}/annunci/privato", json=payload, timeout=10)
    assert r.status_code == 401

    # UPDATE price + telefono
    r = privato_session.put(f"{API}/annunci/{ann_id}", json={"prezzo": 199.0, "telefono": "+39 555 9876543"}, timeout=10)
    assert r.status_code == 200
    updated = r.json()
    assert updated["prezzo"] == 199.0
    assert updated["azienda_telefono"] == "+39 555 9876543"

    # Ownership 403: other privato tries to update
    r = other_session.put(f"{API}/annunci/{ann_id}", json={"prezzo": 1.0}, timeout=10)
    assert r.status_code == 403

    # Ownership 403: other privato tries to delete
    r = other_session.delete(f"{API}/annunci/{ann_id}", timeout=10)
    assert r.status_code == 403

    # Photo via URL
    r = privato_session.post(
        f"{API}/annunci/{ann_id}/foto-url",
        json={"urls": ["https://picsum.photos/id/1021/400/300"]},
        timeout=40,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("aggiunte", 0) >= 1, f"foto-url response: {data}"
    assert len(data.get("foto", [])) >= 1
    foto_id = data["foto"][0]["id"]

    # Delete photo
    r = privato_session.delete(f"{API}/annunci/{ann_id}/foto/{foto_id}", timeout=10)
    assert r.status_code == 200
    assert all(f["id"] != foto_id for f in r.json().get("foto", []))

    # DELETE annuncio (owner)
    r = privato_session.delete(f"{API}/annunci/{ann_id}", timeout=10)
    assert r.status_code == 200
    r = requests.get(f"{API}/annunci/{ann_id}", timeout=10)
    assert r.status_code == 404


def test_privato_cannot_use_azienda_endpoint(privato_session):
    r = privato_session.post(f"{API}/annunci", json={
        "tipo": "usato", "titolo": "TEST_x", "descrizione": "lorem ipsum dolor",
        "categoria": "Giardinaggio", "zona": "Milano", "prezzo": 10.0,
    }, timeout=10)
    assert r.status_code == 403


def test_admin_can_create_annuncio_with_telefono():
    s = _login(ADMIN)
    # create azienda-style annuncio with telefono via admin endpoint
    r = s.get(f"{API}/admin/aziende", timeout=10)
    assert r.status_code == 200
    aziende = r.json()
    assert aziende, "no aziende seeded"
    az = aziende[0]
    payload = {
        "azienda_id": az["id"],
        "tipo": "usato",
        "titolo": "TEST_admin_annuncio",
        "descrizione": "descrizione admin test valida",
        "categoria": "Giardinaggio",
        "zona": "Roma",
        "prezzo": 500.0,
        "stato": "Buono",
        "azienda_nome": "TEST Nome Venditore",
        "azienda_telefono": "+39 02 1234567",
    }
    r = s.post(f"{API}/admin/annunci", json=payload, timeout=15)
    if r.status_code == 404:
        pytest.skip("admin annunci endpoint not available")
    assert r.status_code == 200, r.text
    ann = r.json()
    assert ann.get("azienda_telefono") == "+39 02 1234567"
    ann_id = ann["id"]

    # update telefono via admin
    r = s.put(f"{API}/admin/annunci/{ann_id}", json={"azienda_telefono": "+39 06 9999"}, timeout=10)
    assert r.status_code == 200
    assert r.json().get("azienda_telefono") == "+39 06 9999"

    # cleanup
    s.delete(f"{API}/admin/annunci/{ann_id}", timeout=10)
