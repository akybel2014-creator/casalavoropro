import logging
from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from core import db, now, clean_doc, require_roles, azienda_for_user

logger = logging.getLogger(__name__)
router = APIRouter()

TIPI_CONTRATTO = ("Full-time", "Part-time", "Stagionale", "Apprendistato", "A chiamata", "Tirocinio")


class OffertaLavoroIn(BaseModel):
    titolo: str = Field(min_length=3, max_length=120)
    descrizione: str = Field(min_length=10, max_length=3000)
    zona: str = Field(min_length=2, max_length=80)
    tipo_contratto: str
    retribuzione: Optional[str] = Field(None, max_length=120)
    contatto_email: Optional[str] = Field(None, max_length=160)
    contatto_telefono: Optional[str] = Field(None, max_length=40)
    attivo: bool = True


class OffertaLavoroUpdateIn(BaseModel):
    titolo: Optional[str] = Field(None, min_length=3, max_length=120)
    descrizione: Optional[str] = Field(None, min_length=10, max_length=3000)
    zona: Optional[str] = Field(None, min_length=2, max_length=80)
    tipo_contratto: Optional[str] = None
    retribuzione: Optional[str] = Field(None, max_length=120)
    contatto_email: Optional[str] = Field(None, max_length=160)
    contatto_telefono: Optional[str] = Field(None, max_length=40)
    attivo: Optional[bool] = None


def _oid(oid: str) -> ObjectId:
    try:
        return ObjectId(oid)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Offerta non trovata")


def _validate_contratto(tc: Optional[str]):
    if tc is not None and tc not in TIPI_CONTRATTO:
        raise HTTPException(status_code=400, detail="Tipo di contratto non valido")


async def _azienda(user: dict) -> dict:
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    return azienda


@router.get("/offerte-lavoro/meta")
async def offerte_meta():
    return {"tipi_contratto": list(TIPI_CONTRATTO)}


@router.get("/offerte-lavoro/mine")
async def mie_offerte(user: dict = Depends(require_roles("azienda"))):
    docs = await db.offerte_lavoro.find({"owner_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [clean_doc(d) for d in docs]


@router.post("/offerte-lavoro")
async def crea_offerta(inp: OffertaLavoroIn, user: dict = Depends(require_roles("azienda"))):
    azienda = await _azienda(user)
    _validate_contratto(inp.tipo_contratto)
    doc = {
        **inp.model_dump(),
        "titolo": inp.titolo.strip(), "descrizione": inp.descrizione.strip(), "zona": inp.zona.strip(),
        "azienda_id": str(azienda["_id"]), "azienda_nome": azienda.get("nome", ""),
        "azienda_verified": bool(azienda.get("verified")),
        "owner_id": user["id"], "created_at": now(),
    }
    res = await db.offerte_lavoro.insert_one(doc)
    doc["_id"] = res.inserted_id
    return clean_doc(doc, drop=("owner_id",))


@router.put("/offerte-lavoro/{offerta_id}")
async def aggiorna_offerta(offerta_id: str, inp: OffertaLavoroUpdateIn, user: dict = Depends(require_roles("azienda"))):
    doc = await db.offerte_lavoro.find_one({"_id": _oid(offerta_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Offerta non trovata")
    if doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    updates = {k: v for k, v in inp.model_dump().items() if v is not None}
    if "tipo_contratto" in updates:
        _validate_contratto(updates["tipo_contratto"])
    for f in ("titolo", "descrizione", "zona"):
        if f in updates:
            updates[f] = updates[f].strip()
    if updates:
        updates["updated_at"] = now()
        await db.offerte_lavoro.update_one({"_id": doc["_id"]}, {"$set": updates})
    fresh = await db.offerte_lavoro.find_one({"_id": doc["_id"]})
    return clean_doc(fresh, drop=("owner_id",))


@router.delete("/offerte-lavoro/{offerta_id}")
async def elimina_offerta(offerta_id: str, user: dict = Depends(require_roles("azienda"))):
    doc = await db.offerte_lavoro.find_one({"_id": _oid(offerta_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Offerta non trovata")
    if doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    await db.offerte_lavoro.delete_one({"_id": doc["_id"]})
    return {"ok": True}


@router.get("/aziende/{azienda_id}/offerte-lavoro")
async def offerte_pubbliche(azienda_id: str):
    docs = await db.offerte_lavoro.find(
        {"azienda_id": azienda_id, "attivo": True}, {"owner_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [clean_doc(d) for d in docs]
