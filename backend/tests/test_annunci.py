"""Backend tests for 'Annunci noleggio e usato' endpoints."""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

PRO = {"email": "info@caloreeclima.it", "password": "Demo2026!"}
FREE = {"email": "info@colorartimbiancatura.it", "password": "Demo2026!"}
PRIV = {"email": "mario.rossi@example.com", "password": "Demo2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code}: {r.text}"
    return s


@pytest.fixture(scope="module")
def pro_s():
    return _login(PRO)


@pytest.fixture(scope="module")
def free_s():
    return _login(FREE)


@pytest.fixture(scope="module")
def priv_s():
    return _login(PRIV)


@pytest.fixture(scope="module")
def created_ids(pro_s):
    ids = []
    yield ids
    # cleanup
    for aid in ids:
        try:
            pro_s.delete(f"{API}/annunci/{aid}", timeout=10)
        except Exception:
            pass


# ---------- META ----------
def test_meta():
    r = requests.get(f"{API}/annunci/meta", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "Elettroutensili" in d["categorie"]
    assert "fisso" in d["unita"]
    assert "Buono" in d["stati_usato"]


# ---------- PUBLIC LIST ----------
def test_list_noleggio_has_demo():
    r = requests.get(f"{API}/annunci", params={"tipo": "noleggio"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 4
    for a in data:
        assert a["attivo"] is True
        assert "owner_id" not in a
        assert a["tipo"] == "noleggio"


def test_filter_categoria():
    r = requests.get(f"{API}/annunci", params={"tipo": "usato", "categoria": "Elettroutensili"}, timeout=15)
    assert r.status_code == 200
    for a in r.json():
        assert a["categoria"] == "Elettroutensili"


def test_filter_zona_case_insensitive():
    r = requests.get(f"{API}/annunci", params={"zona": "roma"}, timeout=15)
    assert r.status_code == 200
    for a in r.json():
        assert "roma" in a["zona"].lower()


def test_filter_q_betoniera():
    r = requests.get(f"{API}/annunci", params={"q": "betoniera"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert any("betoniera" in a["titolo"].lower() or "betoniera" in a["descrizione"].lower() for a in data)


def test_filter_prezzo_max_roma_noleggio():
    r = requests.get(f"{API}/annunci", params={"tipo": "noleggio", "zona": "roma", "prezzo_max": 50}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    titoli = [a["titolo"] for a in data]
    assert any("Ponteggio" in t for t in titoli)
    assert any("Betoniera" in t for t in titoli)
    for a in data:
        assert a["prezzo"] <= 50


# ---------- CREATE / VALIDATION ----------
def test_create_requires_auth():
    r = requests.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "x", "descrizione": "y" * 10,
                                              "categoria": "Altro", "zona": "Roma", "prezzo": 10}, timeout=15)
    assert r.status_code == 401


def test_create_privato_forbidden(priv_s):
    r = priv_s.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "test ann", "descrizione": "descrizione demo",
                                            "categoria": "Altro", "zona": "Roma", "prezzo": 10})
    assert r.status_code == 403


def test_create_free_azienda_402(free_s):
    r = free_s.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "test ann", "descrizione": "descrizione demo",
                                            "categoria": "Altro", "zona": "Roma", "prezzo": 10})
    assert r.status_code == 402


def test_create_usato_default_stato(pro_s, created_ids):
    payload = {"tipo": "usato", "titolo": "TEST compressore 50L", "descrizione": "compressore demo test lungo",
               "categoria": "Elettroutensili", "zona": "Milano", "prezzo": 120}
    r = pro_s.post(f"{API}/annunci", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["stato"] == "Buono"
    assert d["unita"] == "fisso"
    assert "owner_id" not in d
    created_ids.append(d["id"])


def test_create_noleggio_giorno(pro_s, created_ids):
    payload = {"tipo": "noleggio", "titolo": "TEST noleggio demo", "descrizione": "descrizione lunga demo",
               "categoria": "Movimento terra", "zona": "Torino", "prezzo": 150, "unita": "giorno"}
    r = pro_s.post(f"{API}/annunci", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["unita"] == "giorno"
    created_ids.append(d["id"])


def test_create_invalid_categoria(pro_s):
    r = pro_s.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "TEST xx", "descrizione": "0123456789",
                                           "categoria": "Nonesiste", "zona": "Roma", "prezzo": 10})
    assert r.status_code == 400


def test_create_invalid_unita(pro_s):
    r = pro_s.post(f"{API}/annunci", json={"tipo": "noleggio", "titolo": "TEST xx", "descrizione": "0123456789",
                                           "categoria": "Altro", "zona": "Roma", "prezzo": 10, "unita": "secolo"})
    assert r.status_code == 400


def test_create_invalid_tipo(pro_s):
    r = pro_s.post(f"{API}/annunci", json={"tipo": "scambio", "titolo": "TEST xx", "descrizione": "0123456789",
                                           "categoria": "Altro", "zona": "Roma", "prezzo": 10})
    assert r.status_code == 400


def test_create_prezzo_zero(pro_s):
    r = pro_s.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "TEST xx", "descrizione": "0123456789",
                                           "categoria": "Altro", "zona": "Roma", "prezzo": 0})
    assert r.status_code == 422


# ---------- MINE / UPDATE / DELETE ----------
def test_mine_includes_inactive(pro_s, created_ids):
    # create and hide
    payload = {"tipo": "noleggio", "titolo": "TEST hidden", "descrizione": "hidden demo descrizione",
               "categoria": "Altro", "zona": "Verona", "prezzo": 50, "unita": "giorno"}
    r = pro_s.post(f"{API}/annunci", json=payload)
    assert r.status_code == 200
    aid = r.json()["id"]
    created_ids.append(aid)
    pu = pro_s.put(f"{API}/annunci/{aid}", json={"attivo": False, "prezzo": 99})
    assert pu.status_code == 200
    assert pu.json()["attivo"] is False
    assert pu.json()["prezzo"] == 99
    mine = pro_s.get(f"{API}/annunci/mine").json()
    assert any(a["id"] == aid for a in mine)
    # not in public list
    pub = requests.get(f"{API}/annunci", timeout=15).json()
    assert not any(a["id"] == aid for a in pub)
    # but direct GET works
    g = requests.get(f"{API}/annunci/{aid}", timeout=15)
    assert g.status_code == 200


def test_update_forbidden_other_user(pro_s, free_s, created_ids):
    # create via pro, try update via free
    r = pro_s.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "TEST own", "descrizione": "descrizione demo xx",
                                           "categoria": "Altro", "zona": "Roma", "prezzo": 20})
    assert r.status_code == 200
    aid = r.json()["id"]
    created_ids.append(aid)
    r2 = free_s.put(f"{API}/annunci/{aid}", json={"prezzo": 5})
    assert r2.status_code == 403
    r3 = free_s.delete(f"{API}/annunci/{aid}")
    assert r3.status_code == 403


def test_delete_and_404(pro_s):
    r = pro_s.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "TEST del", "descrizione": "descrizione demo xx",
                                           "categoria": "Altro", "zona": "Roma", "prezzo": 20})
    aid = r.json()["id"]
    d = pro_s.delete(f"{API}/annunci/{aid}")
    assert d.status_code == 200
    g = requests.get(f"{API}/annunci/{aid}", timeout=15)
    assert g.status_code == 404


def test_malformed_id():
    r = requests.get(f"{API}/annunci/not-an-objectid", timeout=15)
    assert r.status_code == 404


# ---------- FOTO ----------
def _tiny_png():
    # 1x1 red PNG
    sig = b'\x89PNG\r\n\x1a\n'
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
    raw = b'\x00\xff\x00\x00'
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


def test_foto_flow(pro_s, created_ids):
    r = pro_s.post(f"{API}/annunci", json={"tipo": "usato", "titolo": "TEST foto", "descrizione": "descrizione demo xx",
                                           "categoria": "Altro", "zona": "Roma", "prezzo": 20})
    aid = r.json()["id"]
    created_ids.append(aid)
    png = _tiny_png()
    files = {"files": ("t.png", io.BytesIO(png), "image/png")}
    up = pro_s.post(f"{API}/annunci/{aid}/foto", files=files)
    assert up.status_code == 200, up.text
    foto = up.json()["foto"]
    assert len(foto) == 1
    path = foto[0]["path"]
    foto_id = foto[0]["id"]
    img = requests.get(f"{API}/files/{path}", timeout=15)
    assert img.status_code == 200
    # txt rejected
    bad = pro_s.post(f"{API}/annunci/{aid}/foto",
                     files={"files": ("x.txt", io.BytesIO(b"hello"), "text/plain")})
    assert bad.status_code == 400
    # fill to max 4 then 5th -> 400
    for _ in range(3):
        pro_s.post(f"{API}/annunci/{aid}/foto",
                   files={"files": ("t.png", io.BytesIO(png), "image/png")})
    over = pro_s.post(f"{API}/annunci/{aid}/foto",
                      files={"files": ("t.png", io.BytesIO(png), "image/png")})
    assert over.status_code == 400
    # delete one foto
    de = pro_s.delete(f"{API}/annunci/{aid}/foto/{foto_id}")
    assert de.status_code == 200
    assert not any(f["id"] == foto_id for f in de.json()["foto"])
