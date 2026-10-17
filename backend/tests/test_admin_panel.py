"""Admin panel endpoints: metrics, users search, manage credits/role/suspend."""
import os
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

ADMIN = ("admin@casalavoripro.it", "Admin2026!")
AZIENDA = ("info@caloreeclima.it", "Demo2026!")
PRIVATO = ("mario.rossi@example.com", "Demo2026!")
TRIAL = ("trial@test.it", "Demo2026!")


def login(email, password):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_sess():
    return login(*ADMIN)


@pytest.fixture(scope="module")
def azienda_sess():
    return login(*AZIENDA)


@pytest.fixture(scope="module")
def privato_sess():
    return login(*PRIVATO)


def test_admin_metrics(admin_sess):
    r = admin_sess.get(f"{API}/admin/metrics")
    assert r.status_code == 200, r.text
    data = r.json()
    # expect euro MRR, incasso crediti, user counts
    keys = str(data.keys()).lower()
    assert "mrr" in keys or "mrr_eur" in keys
    print("metrics:", data)


def test_admin_metrics_forbidden_for_azienda(azienda_sess):
    r = azienda_sess.get(f"{API}/admin/metrics")
    assert r.status_code in (401, 403), r.status_code


def test_admin_metrics_forbidden_for_privato(privato_sess):
    r = privato_sess.get(f"{API}/admin/metrics")
    assert r.status_code in (401, 403), r.status_code


def test_admin_users_list(admin_sess):
    r = admin_sess.get(f"{API}/admin/users")
    assert r.status_code == 200, r.text
    body = r.json()
    users = body if isinstance(body, list) else body.get("users") or body.get("items") or []
    assert len(users) > 0


def test_admin_users_search(admin_sess):
    r = admin_sess.get(f"{API}/admin/users", params={"q": "trial@test.it"})
    assert r.status_code == 200
    body = r.json()
    users = body if isinstance(body, list) else body.get("users") or body.get("items") or []
    emails = [u.get("email") for u in users]
    assert any("trial@test.it" in (e or "") for e in emails), emails


def _find_user(admin_sess, email):
    r = admin_sess.get(f"{API}/admin/users", params={"q": email})
    body = r.json()
    users = body if isinstance(body, list) else body.get("users") or body.get("items") or []
    for u in users:
        if u.get("email") == email:
            return u
    return None


def test_admin_patch_credits(admin_sess):
    user = _find_user(admin_sess, "trial@test.it")
    assert user, "trial user not found"
    uid = user.get("id") or user.get("_id")
    r = admin_sess.patch(f"{API}/admin/users/{uid}/credits", json={"bonus_credits": 7, "purchased_credits": 2})
    assert r.status_code == 200, r.text
    # revert
    admin_sess.patch(f"{API}/admin/users/{uid}/credits", json={"bonus_credits": 5, "purchased_credits": 0})


def test_admin_patch_role(admin_sess):
    user = _find_user(admin_sess, "trial@test.it")
    uid = user.get("id") or user.get("_id")
    r = admin_sess.patch(f"{API}/admin/users/{uid}/role", json={"ruolo": "azienda_abbonata"})
    assert r.status_code == 200, r.text


def test_admin_patch_suspend(admin_sess):
    user = _find_user(admin_sess, "trial@test.it")
    uid = user.get("id") or user.get("_id")
    r = admin_sess.patch(f"{API}/admin/users/{uid}/suspend", json={"suspended": True})
    assert r.status_code == 200, r.text
    # revert
    r2 = admin_sess.patch(f"{API}/admin/users/{uid}/suspend", json={"suspended": False})
    assert r2.status_code == 200


def test_azienda_cannot_patch(azienda_sess, admin_sess):
    user = _find_user(admin_sess, "trial@test.it")
    uid = user.get("id") or user.get("_id")
    r = azienda_sess.patch(f"{API}/admin/users/{uid}/credits", json={"bonus_credits": 1})
    assert r.status_code in (401, 403), r.status_code
