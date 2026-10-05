"""Backend tests for prenotazioni (calendario noleggio) and PUT /annunci/{id}."""
import os
from datetime import date, timedelta
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://home-pro-landing.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

PRIV = {"email": "mario.rossi@example.com", "password": "Demo2026!"}
PRO_CC = {"email": "info@caloreeclima.it", "password": "Demo2026!"}         # owns Piattaforma aerea
PRO_EN = {"email": "info@edilnuovacostruzioni.it", "password": "Demo2026!"}  # owns Betoniera, Ponteggio

ANN_PIATTAFORMA = "6ac38bcc988bbc4a470b08f5"  # noleggio giorno 190, Calore & Clima
ANN_BETONIERA = "6ac38bcc988bbc4a470b08f3"    # noleggio giorno 35, EdilNuova
ANN_PONTEGGIO = "6ac38bcc988bbc4a470b08f4"    # noleggio mese 9, EdilNuova


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code}: {r.text}"
    return s


@pytest.fixture(scope="module")
def priv_s():
    return _login(PRIV)


@pytest.fixture(scope="module")
def pro_cc_s():
    return _login(PRO_CC)


@pytest.fixture(scope="module")
def pro_en_s():
    return _login(PRO_EN)


@pytest.fixture(scope="module")
def cleanup_pren(priv_s):
    created = []
    yield created
    for pid in created:
        try:
            priv_s.post(f"{API}/prenotazioni/{pid}/annulla", timeout=10)
        except Exception:
            pass


def _d(offset):
    return (date.today() + timedelta(days=offset)).isoformat()


# ---------- DISPONIBILITA ----------
def test_disponibilita_public_ok():
    r = requests.get(f"{API}/annunci/{ANN_PIATTAFORMA}/disponibilita", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_disponibilita_404():
    r = requests.get(f"{API}/annunci/000000000000000000000000/disponibilita", timeout=15)
    assert r.status_code == 404
    r2 = requests.get(f"{API}/annunci/bad/disponibilita", timeout=15)
    assert r2.status_code == 404


# ---------- CREATE prenotazione: AUTH / RUOLI ----------
def test_crea_prenotazione_anonimo_401():
    r = requests.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                      json={"dal": _d(10), "al": _d(12)}, timeout=15)
    assert r.status_code == 401


def test_crea_prenotazione_azienda_403(pro_cc_s):
    r = pro_cc_s.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                      json={"dal": _d(10), "al": _d(12)})
    assert r.status_code == 403


# ---------- CREATE: VALIDAZIONE ----------
def test_crea_data_passato_400(priv_s):
    r = priv_s.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                    json={"dal": _d(-1), "al": _d(2)})
    assert r.status_code == 400


def test_crea_al_prima_dal_400(priv_s):
    r = priv_s.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                    json={"dal": _d(10), "al": _d(5)})
    assert r.status_code == 400


def test_crea_durata_oltre_180_400(priv_s):
    r = priv_s.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                    json={"dal": _d(1), "al": _d(200)})
    assert r.status_code == 400


def test_crea_data_malformata_400(priv_s):
    r = priv_s.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                    json={"dal": "2026/01/10", "al": "2026-01-12"})
    assert r.status_code == 400


def test_crea_annuncio_404(priv_s):
    r = priv_s.post(f"{API}/annunci/000000000000000000000000/prenotazioni",
                    json={"dal": _d(10), "al": _d(12)})
    assert r.status_code == 404


def test_crea_su_annuncio_usato_400(priv_s):
    # trova un annuncio usato
    r = requests.get(f"{API}/annunci", params={"tipo": "usato"}, timeout=15).json()
    assert r, "nessun annuncio usato nel db"
    aid = r[0]["id"]
    rr = priv_s.post(f"{API}/annunci/{aid}/prenotazioni",
                     json={"dal": _d(10), "al": _d(12)})
    assert rr.status_code == 400


# ---------- CREATE: SUCCESSO + TOTALE ----------
def test_crea_prenotazione_giorno(priv_s, cleanup_pren):
    dal, al = _d(40), _d(43)  # 4 giorni
    r = priv_s.post(f"{API}/annunci/{ANN_PIATTAFORMA}/prenotazioni",
                    json={"dal": dal, "al": al, "nota": "test"})
    assert r.status_code == 200, r.text
    d = r.json()
    cleanup_pren.append(d["id"])
    assert d["stato"] == "richiesta"
    assert d["giorni"] == 4
    assert d["totale"] == 190.0 * 4
    assert "owner_id" not in d
    # overlap -> 409
    r2 = priv_s.post(f"{API}/annunci/{ANN_PIATTAFORMA}/prenotazioni",
                     json={"dal": dal, "al": al})
    assert r2.status_code == 409
    # disponibilita contiene la prenotazione
    disp = requests.get(f"{API}/annunci/{ANN_PIATTAFORMA}/disponibilita", timeout=15).json()
    assert any(x["dal"] == dal and x["al"] == al for x in disp)


def test_crea_prenotazione_mese_totale(priv_s, cleanup_pren):
    dal, al = _d(50), _d(84)  # 35 giorni -> ceil(35/30)=2 -> 9*2=18
    r = priv_s.post(f"{API}/annunci/{ANN_PONTEGGIO}/prenotazioni",
                    json={"dal": dal, "al": al})
    assert r.status_code == 200, r.text
    d = r.json()
    cleanup_pren.append(d["id"])
    assert d["giorni"] == 35
    assert d["totale"] == 18.0


# ---------- GESTIONE AZIENDA ----------
def test_gestione_conferma_e_notifiche(priv_s, pro_cc_s, cleanup_pren):
    dal, al = _d(60), _d(62)
    r = priv_s.post(f"{API}/annunci/{ANN_PIATTAFORMA}/prenotazioni",
                    json={"dal": dal, "al": al})
    assert r.status_code == 200
    pid = r.json()["id"]
    cleanup_pren.append(pid)

    # elenco azienda include
    lst = pro_cc_s.get(f"{API}/prenotazioni/azienda").json()
    assert any(p["id"] == pid for p in lst)

    # altra azienda non proprietaria -> 403
    pro_en = _login(PRO_EN)
    r403 = pro_en.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "confermata"})
    assert r403.status_code == 403

    # stato non valido
    r400 = pro_cc_s.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "boh"})
    assert r400.status_code == 400

    # conferma
    rc = pro_cc_s.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "confermata"})
    assert rc.status_code == 200
    assert rc.json()["stato"] == "confermata"

    # già gestita
    r_dup = pro_cc_s.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "rifiutata"})
    assert r_dup.status_code == 400

    # notifiche privato: 'Noleggio confermato'
    notif = priv_s.get(f"{API}/notifiche").json()
    assert any("Noleggio confermato" in n.get("titolo", "") for n in notif)


def test_rifiuto_libera_date(priv_s, pro_en_s, cleanup_pren):
    dal, al = _d(70), _d(72)
    r = priv_s.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                    json={"dal": dal, "al": al})
    assert r.status_code == 200
    pid = r.json()["id"]

    rr = pro_en_s.post(f"{API}/prenotazioni/{pid}/stato", json={"stato": "rifiutata"})
    assert rr.status_code == 200

    disp = requests.get(f"{API}/annunci/{ANN_BETONIERA}/disponibilita", timeout=15).json()
    assert not any(x["dal"] == dal and x["al"] == al and x["stato"] in ("richiesta", "confermata") for x in disp)

    # nuova prenotazione sulle stesse date OK
    r2 = priv_s.post(f"{API}/annunci/{ANN_BETONIERA}/prenotazioni",
                     json={"dal": dal, "al": al})
    assert r2.status_code == 200
    cleanup_pren.append(r2.json()["id"])

    # notifiche azienda: 'Nuova richiesta di noleggio'
    nots = pro_en_s.get(f"{API}/notifiche").json()
    assert any("Nuova richiesta di noleggio" in n.get("titolo", "") for n in nots)


def test_annulla_privato(priv_s, cleanup_pren):
    dal, al = _d(90), _d(92)
    r = priv_s.post(f"{API}/annunci/{ANN_PIATTAFORMA}/prenotazioni",
                    json={"dal": dal, "al": al})
    assert r.status_code == 200
    pid = r.json()["id"]

    # altro privato non ha accesso (usa un privato diverso? solo mario in demo). Testiamo 400 doppio annulla.
    ok = priv_s.post(f"{API}/prenotazioni/{pid}/annulla")
    assert ok.status_code == 200
    assert ok.json()["stato"] == "annullata"
    dup = priv_s.post(f"{API}/prenotazioni/{pid}/annulla")
    assert dup.status_code == 400

    # dopo annulla, nuova sulle stesse date OK
    r2 = priv_s.post(f"{API}/annunci/{ANN_PIATTAFORMA}/prenotazioni",
                     json={"dal": dal, "al": al})
    assert r2.status_code == 200
    cleanup_pren.append(r2.json()["id"])


def test_mine_elenco(priv_s):
    r = priv_s.get(f"{API}/prenotazioni/mine")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- PUT /annunci/{id} ----------
def test_update_annuncio_full(pro_cc_s):
    # crea annuncio test
    payload = {"tipo": "noleggio", "titolo": "TEST update annuncio", "descrizione": "descrizione iniziale demo lunga",
               "categoria": "Altro", "zona": "Milano", "prezzo": 50, "unita": "giorno"}
    r = pro_cc_s.post(f"{API}/annunci", json=payload)
    assert r.status_code == 200
    aid = r.json()["id"]
    try:
        upd = {"titolo": "TEST update annuncio (modificato)", "prezzo": 77.5,
               "descrizione": "nuova descrizione aggiornata demo", "categoria": "Movimento terra",
               "zona": "Torino"}
        r2 = pro_cc_s.put(f"{API}/annunci/{aid}", json=upd)
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d["titolo"] == upd["titolo"]
        assert d["prezzo"] == 77.5
        assert d["categoria"] == "Movimento terra"
        assert d["zona"] == "Torino"
        # unita invalida -> 400
        r3 = pro_cc_s.put(f"{API}/annunci/{aid}", json={"unita": "secolo"})
        assert r3.status_code == 400
    finally:
        pro_cc_s.delete(f"{API}/annunci/{aid}")
