import math
import logging
from datetime import date
from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, notify
from emailer import send_noleggio_event

logger = logging.getLogger(__name__)
router = APIRouter()

ATTIVE = ("richiesta", "confermata")


def _oid(value: str, msg: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail=msg)


def _parse_day(s: str) -> date:
    try:
        return date.fromisoformat(s)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data non valida (formato AAAA-MM-GG)")


def calcola_totale(prezzo: float, unita: str, giorni: int) -> float:
    if unita == "settimana":
        return round(prezzo * math.ceil(giorni / 7), 2)
    if unita == "mese":
        return round(prezzo * math.ceil(giorni / 30), 2)
    return round(prezzo * giorni, 2)


class PrenotazioneIn(BaseModel):
    dal: str
    al: str
    nota: Optional[str] = Field(None, max_length=500)


class StatoIn(BaseModel):
    stato: str


def _pub(doc: dict) -> dict:
    return clean_doc(doc, drop=("password_hash", "owner_id"))


CAPARRA_PERC = 0.20
CAPARRA_MIN = 10.0


def calcola_caparra(totale: float) -> float:
    return round(max(CAPARRA_MIN, totale * CAPARRA_PERC), 2)


async def _email_entrambi(p: dict, evento: str):
    """Sends the event email to both the private client and the company owner (best effort)."""
    try:
        for uid, ruolo in ((p.get("client_id"), "privato"), (p.get("owner_id"), "azienda")):
            if not uid:
                continue
            u = await db.users.find_one({"_id": ObjectId(uid)}, {"email": 1})
            if u and u.get("email"):
                await send_noleggio_event(u["email"], ruolo, evento, p)
    except Exception:
        logger.exception("email noleggio failed")


@router.get("/annunci/{annuncio_id}/disponibilita")
async def disponibilita(annuncio_id: str):
    oid = _oid(annuncio_id, "Annuncio non trovato")
    if not await db.annunci.find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    today = date.today().isoformat()
    docs = await db.prenotazioni.find(
        {"annuncio_id": str(oid), "stato": {"$in": list(ATTIVE)}, "al": {"$gte": today}},
        {"dal": 1, "al": 1, "stato": 1},
    ).to_list(500)
    return [{"dal": d["dal"], "al": d["al"], "stato": d["stato"]} for d in docs]


@router.post("/annunci/{annuncio_id}/prenotazioni")
async def crea_prenotazione(annuncio_id: str, inp: PrenotazioneIn, user: dict = Depends(require_roles("privato"))):
    oid = _oid(annuncio_id, "Annuncio non trovato")
    annuncio = await db.annunci.find_one({"_id": oid})
    if not annuncio or not annuncio.get("attivo"):
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    if annuncio.get("tipo") != "noleggio":
        raise HTTPException(status_code=400, detail="Le prenotazioni sono disponibili solo per il noleggio")

    dal, al = _parse_day(inp.dal), _parse_day(inp.al)
    if dal < date.today():
        raise HTTPException(status_code=400, detail="La data di inizio non può essere nel passato")
    if al < dal:
        raise HTTPException(status_code=400, detail="La data di fine deve essere successiva all'inizio")
    giorni = (al - dal).days + 1
    if giorni > 180:
        raise HTTPException(status_code=400, detail="Massimo 180 giorni per prenotazione")

    overlap = await db.prenotazioni.find_one({
        "annuncio_id": str(oid), "stato": {"$in": list(ATTIVE)},
        "dal": {"$lte": al.isoformat()}, "al": {"$gte": dal.isoformat()},
    })
    if overlap:
        raise HTTPException(status_code=409, detail="Il mezzo non è disponibile in queste date: scegli un altro periodo")

    doc = {
        "annuncio_id": str(oid), "annuncio_titolo": annuncio["titolo"],
        "azienda_id": annuncio["azienda_id"], "azienda_nome": annuncio.get("azienda_nome", ""),
        "owner_id": annuncio["owner_id"],
        "client_id": user["id"], "client_name": user["name"],
        "dal": dal.isoformat(), "al": al.isoformat(), "giorni": giorni,
        "prezzo": annuncio["prezzo"], "unita": annuncio.get("unita", "giorno"),
        "totale": calcola_totale(annuncio["prezzo"], annuncio.get("unita", "giorno"), giorni),
        "nota": (inp.nota or "").strip(), "stato": "richiesta", "created_at": now(),
    }
    res = await db.prenotazioni.insert_one(doc)
    doc["_id"] = res.inserted_id
    await notify(annuncio["owner_id"], "Nuova richiesta di noleggio",
                 f"{user['name']} chiede «{annuncio['titolo']}» dal {dal.strftime('%d/%m/%Y')} al {al.strftime('%d/%m/%Y')} ({giorni} gg).",
                 link="/dashboard/azienda")
    await _email_entrambi(doc, "richiesta")
    return _pub(doc)


@router.get("/prenotazioni/mine")
async def mie_prenotazioni(user: dict = Depends(require_roles("privato"))):
    docs = await db.prenotazioni.find({"client_id": user["id"]}).sort("dal", 1).to_list(200)
    return [_pub(d) for d in docs]


@router.get("/prenotazioni/azienda")
async def prenotazioni_azienda(user: dict = Depends(require_roles("azienda"))):
    docs = await db.prenotazioni.find({"owner_id": user["id"]}).sort([("stato", 1), ("dal", 1)]).to_list(300)
    return [_pub(d) for d in docs]


@router.post("/prenotazioni/{prenotazione_id}/stato")
async def cambia_stato(prenotazione_id: str, inp: StatoIn, user: dict = Depends(require_roles("azienda"))):
    if inp.stato not in ("confermata", "rifiutata"):
        raise HTTPException(status_code=400, detail="Stato non valido")
    oid = _oid(prenotazione_id, "Prenotazione non trovata")
    doc = await db.prenotazioni.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    if doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    if doc["stato"] != "richiesta":
        raise HTTPException(status_code=400, detail="La prenotazione è già stata gestita")
    updates = {"stato": inp.stato, "updated_at": now()}
    if inp.stato == "confermata":
        updates["caparra_importo"] = calcola_caparra(doc.get("totale", 0))
        updates["caparra_stato"] = "da_pagare"
    await db.prenotazioni.update_one({"_id": oid}, {"$set": updates})
    label = "confermato" if inp.stato == "confermata" else "rifiutato"
    await notify(doc["client_id"], f"Noleggio {label}",
                 f"{doc['azienda_nome']} ha {label} il noleggio di «{doc['annuncio_titolo']}» dal {doc['dal']} al {doc['al']}.",
                 link="/dashboard")
    fresh = await db.prenotazioni.find_one({"_id": oid})
    await _email_entrambi(fresh, inp.stato)
    return _pub(fresh)


@router.post("/prenotazioni/{prenotazione_id}/annulla")
async def annulla(prenotazione_id: str, user: dict = Depends(require_roles("privato"))):
    oid = _oid(prenotazione_id, "Prenotazione non trovata")
    doc = await db.prenotazioni.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    if doc["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    if doc["stato"] not in ATTIVE:
        raise HTTPException(status_code=400, detail="Prenotazione già chiusa")
    if doc.get("caparra_stato") == "pagata":
        raise HTTPException(status_code=400, detail="Caparra già pagata: per annullare contatta direttamente l'azienda")
    await db.prenotazioni.update_one({"_id": oid}, {"$set": {"stato": "annullata", "updated_at": now()}})
    await notify(doc["owner_id"], "Noleggio annullato",
                 f"{user['name']} ha annullato la richiesta per «{doc['annuncio_titolo']}» ({doc['dal']} → {doc['al']}).",
                 link="/dashboard/azienda")
    fresh = await db.prenotazioni.find_one({"_id": oid})
    await _email_entrambi(fresh, "annullata")
    return _pub(fresh)


class CaparraCheckoutIn(BaseModel):
    origin_url: str


class AnnullaAziendaIn(BaseModel):
    motivo: Optional[str] = Field(None, max_length=500)


@router.post("/prenotazioni/{prenotazione_id}/annulla-azienda")
async def annulla_azienda(prenotazione_id: str, inp: AnnullaAziendaIn, user: dict = Depends(require_roles("azienda"))):
    """Company cancels a booking (even confirmed). If the deposit was paid, it is refunded automatically via Stripe."""
    from routes_billing import rimborsa_caparra
    oid = _oid(prenotazione_id, "Prenotazione non trovata")
    doc = await db.prenotazioni.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    if doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    if doc["stato"] not in ATTIVE:
        raise HTTPException(status_code=400, detail="Prenotazione già chiusa")

    updates = {"stato": "annullata", "annullata_da": "azienda", "motivo_annullamento": (inp.motivo or "").strip(), "updated_at": now()}
    rimborso = None
    if doc.get("caparra_stato") == "pagata":
        rimborso = await rimborsa_caparra(doc)
        updates.update({"caparra_stato": "rimborsata", "caparra_refund_id": rimborso.get("id"),
                        "caparra_refunded_at": now()})
    await db.prenotazioni.update_one({"_id": oid}, {"$set": updates})
    fresh = await db.prenotazioni.find_one({"_id": oid})

    extra = f" La caparra di {doc.get('caparra_importo', 0):.2f} EUR ti verrà rimborsata sulla carta entro 5-10 giorni." if rimborso else ""
    await notify(doc["client_id"], "Noleggio annullato dall'azienda",
                 f"{doc['azienda_nome']} ha annullato il noleggio di «{doc['annuncio_titolo']}» ({doc['dal']} → {doc['al']}).{extra}",
                 link="/dashboard")
    await _email_entrambi(fresh, "annullata_azienda")
    return _pub(fresh)


@router.post("/prenotazioni/{prenotazione_id}/caparra/checkout")
async def caparra_checkout(prenotazione_id: str, inp: CaparraCheckoutIn, user: dict = Depends(require_roles("privato"))):
    from routes_billing import create_caparra_session
    oid = _oid(prenotazione_id, "Prenotazione non trovata")
    doc = await db.prenotazioni.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    if doc["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    if doc["stato"] != "confermata":
        raise HTTPException(status_code=400, detail="La caparra si paga solo dopo la conferma dell'azienda")
    if doc.get("caparra_stato") == "pagata":
        raise HTTPException(status_code=400, detail="Caparra già pagata")
    importo = doc.get("caparra_importo") or calcola_caparra(doc.get("totale", 0))
    return await create_caparra_session(doc, importo, user["id"], inp.origin_url)


class RecensioneNoleggioIn(BaseModel):
    voto_mezzo: int = Field(ge=1, le=5)
    voto_azienda: int = Field(ge=1, le=5)
    commento: str = Field(min_length=5, max_length=1000)


async def _recompute_annuncio_rating(annuncio_id: str):
    agg = await db.recensioni_noleggio.aggregate([
        {"$match": {"annuncio_id": annuncio_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$voto_mezzo"}, "n": {"$sum": 1}}},
    ]).to_list(1)
    if agg:
        await db.annunci.update_one({"_id": ObjectId(annuncio_id)},
                                    {"$set": {"rating": round(agg[0]["avg"], 1), "recensioni": agg[0]["n"]}})


async def _recompute_azienda_rating(azienda_id: str):
    """Company rating = average of job reviews (voto) and rental reviews (voto_azienda)."""
    a = await db.recensioni.aggregate([{"$match": {"azienda_id": azienda_id}},
                                       {"$group": {"_id": None, "s": {"$sum": "$voto"}, "n": {"$sum": 1}}}]).to_list(1)
    b = await db.recensioni_noleggio.aggregate([{"$match": {"azienda_id": azienda_id}},
                                                {"$group": {"_id": None, "s": {"$sum": "$voto_azienda"}, "n": {"$sum": 1}}}]).to_list(1)
    s_tot = (a[0]["s"] if a else 0) + (b[0]["s"] if b else 0)
    n_tot = (a[0]["n"] if a else 0) + (b[0]["n"] if b else 0)
    if n_tot:
        await db.aziende.update_one({"_id": ObjectId(azienda_id)},
                                    {"$set": {"rating": round(s_tot / n_tot, 1), "recensioni": n_tot}})


@router.post("/prenotazioni/{prenotazione_id}/recensione")
async def recensisci_noleggio(prenotazione_id: str, inp: RecensioneNoleggioIn, user: dict = Depends(require_roles("privato"))):
    oid = _oid(prenotazione_id, "Prenotazione non trovata")
    doc = await db.prenotazioni.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    if doc["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    if doc["stato"] != "confermata":
        raise HTTPException(status_code=400, detail="Puoi recensire solo un noleggio confermato")
    if doc["al"] >= date.today().isoformat():
        raise HTTPException(status_code=400, detail="Potrai recensire il noleggio dopo la fine del periodo")
    if await db.recensioni_noleggio.find_one({"prenotazione_id": str(oid)}):
        raise HTTPException(status_code=400, detail="Hai già recensito questo noleggio")

    rec = {
        "prenotazione_id": str(oid), "annuncio_id": doc["annuncio_id"], "annuncio_titolo": doc["annuncio_titolo"],
        "azienda_id": doc["azienda_id"], "client_id": user["id"], "client_name": user["name"],
        "voto_mezzo": inp.voto_mezzo, "voto_azienda": inp.voto_azienda, "commento": inp.commento.strip(),
        "created_at": now(),
    }
    res = await db.recensioni_noleggio.insert_one(rec)
    rec["_id"] = res.inserted_id
    await db.prenotazioni.update_one({"_id": oid}, {"$set": {"recensione": {
        "voto_mezzo": inp.voto_mezzo, "voto_azienda": inp.voto_azienda, "commento": rec["commento"]}}})
    await _recompute_annuncio_rating(doc["annuncio_id"])
    await _recompute_azienda_rating(doc["azienda_id"])
    await notify(doc["owner_id"], "Nuova recensione sul noleggio",
                 f"{user['name']} ha valutato «{doc['annuncio_titolo']}»: mezzo {inp.voto_mezzo}/5, azienda {inp.voto_azienda}/5.",
                 link="/dashboard/azienda")
    return clean_doc(rec)


@router.get("/annunci/{annuncio_id}/recensioni")
async def recensioni_annuncio(annuncio_id: str):
    oid = _oid(annuncio_id, "Annuncio non trovato")
    docs = await db.recensioni_noleggio.find({"annuncio_id": str(oid)}, {"client_id": 0}).sort("created_at", -1).to_list(50)
    return [clean_doc(d) for d in docs]


async def segna_caparra_pagata(prenotazione_id: str, payment_intent: str | None):
    """Called by billing when a deposit checkout is paid. Idempotent."""
    oid = ObjectId(prenotazione_id)
    res = await db.prenotazioni.update_one(
        {"_id": oid, "caparra_stato": {"$ne": "pagata"}},
        {"$set": {"caparra_stato": "pagata", "caparra_paid_at": now(), "caparra_payment_intent": payment_intent}})
    if not res.modified_count:
        return
    p = await db.prenotazioni.find_one({"_id": oid})
    if not p:
        return
    await notify(p["owner_id"], "Caparra pagata",
                 f"{p['client_name']} ha pagato la caparra ({p.get('caparra_importo', 0):.2f} EUR) per «{p['annuncio_titolo']}» ({p['dal']} → {p['al']}).",
                 link="/dashboard/azienda")
    await notify(p["client_id"], "Caparra registrata",
                 f"Caparra pagata: il noleggio di «{p['annuncio_titolo']}» dal {p['dal']} al {p['al']} è bloccato.",
                 link="/dashboard")
    await _email_entrambi(p, "caparra_pagata")
