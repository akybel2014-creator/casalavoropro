"""Interventi / cantieri registrati dall'azienda (funzione 'Nuovo Intervento')."""
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from core import db, now, clean_doc, require_roles

router = APIRouter()

STATI = ["pianificato", "in_corso", "completato"]


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Intervento non trovato")


class InterventoIn(BaseModel):
    titolo: str
    cliente: str | None = None
    indirizzo: str | None = None
    data: str | None = None
    importo: float | None = None
    note: str | None = None
    stato: str | None = "pianificato"


class StatoIn(BaseModel):
    stato: str


@router.post("/interventi")
async def crea_intervento(inp: InterventoIn, user: dict = Depends(require_roles("azienda"))):
    titolo = (inp.titolo or "").strip()
    if not titolo:
        raise HTTPException(status_code=400, detail="Il titolo è obbligatorio")
    stato = inp.stato if inp.stato in STATI else "pianificato"
    doc = {
        "user_id": user["id"],
        "titolo": titolo,
        "cliente": (inp.cliente or "").strip() or None,
        "indirizzo": (inp.indirizzo or "").strip() or None,
        "data": (inp.data or "").strip() or None,
        "importo": float(inp.importo) if inp.importo is not None else None,
        "note": (inp.note or "").strip() or None,
        "stato": stato,
        "created_at": now(),
    }
    res = await db.interventi.insert_one(doc)
    created = await db.interventi.find_one({"_id": res.inserted_id})
    return clean_doc(created)


@router.get("/interventi/mine")
async def miei_interventi(user: dict = Depends(require_roles("azienda"))):
    docs = await db.interventi.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [clean_doc(d) for d in docs]


@router.patch("/interventi/{intervento_id}/stato")
async def aggiorna_stato(intervento_id: str, inp: StatoIn, user: dict = Depends(require_roles("azienda"))):
    if inp.stato not in STATI:
        raise HTTPException(status_code=400, detail="Stato non valido")
    oid = _oid(intervento_id)
    res = await db.interventi.update_one(
        {"_id": oid, "user_id": user["id"]}, {"$set": {"stato": inp.stato}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Intervento non trovato")
    return {"ok": True, "stato": inp.stato}


@router.delete("/interventi/{intervento_id}")
async def elimina_intervento(intervento_id: str, user: dict = Depends(require_roles("azienda"))):
    oid = _oid(intervento_id)
    res = await db.interventi.delete_one({"_id": oid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Intervento non trovato")
    return {"ok": True}
