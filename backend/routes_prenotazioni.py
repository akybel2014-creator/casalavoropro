import math
import logging
from datetime import date
from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, notify

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
    await db.prenotazioni.update_one({"_id": oid}, {"$set": {"stato": inp.stato, "updated_at": now()}})
    label = "confermato" if inp.stato == "confermata" else "rifiutato"
    await notify(doc["client_id"], f"Noleggio {label}",
                 f"{doc['azienda_nome']} ha {label} il noleggio di «{doc['annuncio_titolo']}» dal {doc['dal']} al {doc['al']}.",
                 link="/dashboard")
    fresh = await db.prenotazioni.find_one({"_id": oid})
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
    await db.prenotazioni.update_one({"_id": oid}, {"$set": {"stato": "annullata", "updated_at": now()}})
    await notify(doc["owner_id"], "Noleggio annullato",
                 f"{user['name']} ha annullato la richiesta per «{doc['annuncio_titolo']}» ({doc['dal']} → {doc['al']}).",
                 link="/dashboard/azienda")
    fresh = await db.prenotazioni.find_one({"_id": oid})
    return _pub(fresh)
