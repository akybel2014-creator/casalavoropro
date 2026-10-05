import re
import logging
import uuid as uuidlib
from typing import Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, azienda_for_user
from routes_gallery import _put_object, ALLOWED, MAX_SIZE, APP_NAME, EMERGENT_KEY

logger = logging.getLogger(__name__)
router = APIRouter()

TIPI = ("noleggio", "usato")
UNITA = ("giorno", "settimana", "mese", "fisso")
STATI_USATO = ("Nuovo", "Ottimo", "Buono", "Revisionato", "Da sistemare")
CATEGORIE_ANNUNCI = [
    "Movimento terra", "Edilizia e betoniere", "Ponteggi e facciate", "Lavori in quota",
    "Elettroutensili", "Giardinaggio", "Idraulica e riscaldamento", "Trasporto e sollevamento", "Altro",
]
MAX_FOTO_ANNUNCIO = 4


class AnnuncioIn(BaseModel):
    tipo: str
    titolo: str = Field(min_length=3, max_length=120)
    descrizione: str = Field(min_length=10, max_length=2000)
    categoria: str
    zona: str = Field(min_length=2, max_length=80)
    prezzo: float = Field(gt=0, le=1_000_000)
    unita: str = "giorno"
    stato: Optional[str] = None
    attivo: bool = True


class AnnuncioUpdateIn(BaseModel):
    titolo: Optional[str] = Field(None, min_length=3, max_length=120)
    descrizione: Optional[str] = Field(None, min_length=10, max_length=2000)
    categoria: Optional[str] = None
    zona: Optional[str] = Field(None, min_length=2, max_length=80)
    prezzo: Optional[float] = Field(None, gt=0, le=1_000_000)
    unita: Optional[str] = None
    stato: Optional[str] = None
    attivo: Optional[bool] = None


def _validate(data: dict, tipo: str):
    if tipo not in TIPI:
        raise HTTPException(status_code=400, detail="Tipo annuncio non valido")
    if "categoria" in data and data["categoria"] not in CATEGORIE_ANNUNCI:
        raise HTTPException(status_code=400, detail="Categoria non valida")
    if "unita" in data and data["unita"] not in UNITA:
        raise HTTPException(status_code=400, detail="Unità di prezzo non valida")
    if tipo == "usato":
        if data.get("stato") is not None and data["stato"] not in STATI_USATO:
            raise HTTPException(status_code=400, detail="Stato dell'usato non valido")
        data["unita"] = "fisso"
    return data


def _oid(annuncio_id: str) -> ObjectId:
    try:
        return ObjectId(annuncio_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Annuncio non trovato")


async def _owned(annuncio_id: str, user: dict) -> dict:
    doc = await db.annunci.find_one({"_id": _oid(annuncio_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    if doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    return doc


async def _pro_azienda(user: dict) -> dict:
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    if azienda.get("plan") != "pro":
        raise HTTPException(status_code=402, detail="Gli annunci noleggio e usato sono riservati alle aziende con abbonamento PRO")
    return azienda


@router.get("/annunci/meta")
async def annunci_meta():
    return {"categorie": CATEGORIE_ANNUNCI, "unita": list(UNITA), "stati_usato": list(STATI_USATO)}


@router.get("/annunci/mine")
async def miei_annunci(user: dict = Depends(require_roles("azienda"))):
    docs = await db.annunci.find({"owner_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [clean_doc(d) for d in docs]


@router.get("/annunci")
async def lista_annunci(tipo: str = "", categoria: str = "", zona: str = "", q: str = "",
                        prezzo_min: Optional[float] = Query(None, ge=0),
                        prezzo_max: Optional[float] = Query(None, ge=0),
                        limit: int = Query(60, ge=1, le=200)):
    query = {"attivo": True}
    if tipo.strip():
        query["tipo"] = tipo.strip()
    if categoria.strip():
        query["categoria"] = categoria.strip()
    if zona.strip():
        query["zona"] = {"$regex": re.escape(zona.strip()), "$options": "i"}
    if q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query["$or"] = [{"titolo": rx}, {"descrizione": rx}, {"azienda_nome": rx}]
    prezzo = {}
    if prezzo_min is not None:
        prezzo["$gte"] = prezzo_min
    if prezzo_max is not None:
        prezzo["$lte"] = prezzo_max
    if prezzo:
        query["prezzo"] = prezzo
    docs = await db.annunci.find(query, {"owner_id": 0}).sort("created_at", -1).to_list(limit)
    return [clean_doc(d) for d in docs]


@router.post("/annunci")
async def crea_annuncio(inp: AnnuncioIn, user: dict = Depends(require_roles("azienda"))):
    azienda = await _pro_azienda(user)
    data = _validate(inp.model_dump(), inp.tipo)
    if data["tipo"] == "usato" and not data.get("stato"):
        data["stato"] = "Buono"
    doc = {
        **data,
        "titolo": data["titolo"].strip(), "descrizione": data["descrizione"].strip(), "zona": data["zona"].strip(),
        "azienda_id": str(azienda["_id"]), "azienda_nome": azienda.get("nome", ""),
        "azienda_verified": bool(azienda.get("verified")), "azienda_telefono": azienda.get("telefono", ""),
        "owner_id": user["id"], "foto": [], "created_at": now(),
    }
    res = await db.annunci.insert_one(doc)
    doc["_id"] = res.inserted_id
    return clean_doc(doc, drop=("password_hash", "owner_id"))


@router.get("/annunci/{annuncio_id}")
async def get_annuncio(annuncio_id: str):
    doc = await db.annunci.find_one({"_id": _oid(annuncio_id)}, {"owner_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    return clean_doc(doc)


@router.put("/annunci/{annuncio_id}")
async def aggiorna_annuncio(annuncio_id: str, inp: AnnuncioUpdateIn, user: dict = Depends(require_roles("azienda"))):
    doc = await _owned(annuncio_id, user)
    updates = {k: v for k, v in inp.model_dump().items() if v is not None}
    updates = _validate(updates, doc["tipo"]) if updates else updates
    if updates:
        await db.annunci.update_one({"_id": doc["_id"]}, {"$set": updates})
    fresh = await db.annunci.find_one({"_id": doc["_id"]})
    return clean_doc(fresh)


@router.delete("/annunci/{annuncio_id}")
async def elimina_annuncio(annuncio_id: str, user: dict = Depends(require_roles("azienda"))):
    doc = await _owned(annuncio_id, user)
    for f in doc.get("foto", []):
        await db.files.update_one({"path": f["path"]}, {"$set": {"is_deleted": True}})
    await db.annunci.delete_one({"_id": doc["_id"]})
    return {"ok": True}


@router.post("/annunci/{annuncio_id}/foto")
async def upload_foto_annuncio(annuncio_id: str, files: List[UploadFile] = File(...),
                               user: dict = Depends(require_roles("azienda"))):
    doc = await _owned(annuncio_id, user)
    if EMERGENT_KEY is None:
        raise HTTPException(status_code=503, detail="Storage non configurato")
    existing = doc.get("foto", [])
    if len(existing) + len(files) > MAX_FOTO_ANNUNCIO:
        raise HTTPException(status_code=400, detail=f"Massimo {MAX_FOTO_ANNUNCIO} foto per annuncio")
    uploaded = []
    for file in files:
        if file.content_type not in ALLOWED:
            raise HTTPException(status_code=400, detail="Formato non supportato: usa JPG, PNG o WEBP")
        data = await file.read()
        if len(data) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Immagine troppo grande (max 5 MB)")
        path = f"{APP_NAME}/annunci/{doc['_id']}/{uuidlib.uuid4()}.{ALLOWED[file.content_type]}"
        try:
            result = _put_object(path, data, file.content_type)
        except Exception:
            logger.exception("upload annuncio failed")
            raise HTTPException(status_code=502, detail="Upload non riuscito, riprova")
        entry = {"id": str(uuidlib.uuid4()), "path": result["path"], "filename": file.filename, "created_at": now()}
        await db.files.insert_one({**entry, "owner_id": user["id"], "is_deleted": False,
                                   "is_public": True, "content_type": file.content_type})
        uploaded.append(entry)
    await db.annunci.update_one({"_id": doc["_id"]}, {"$push": {"foto": {"$each": uploaded}}})
    fresh = await db.annunci.find_one({"_id": doc["_id"]})
    return clean_doc(fresh)


@router.delete("/annunci/{annuncio_id}/foto/{foto_id}")
async def elimina_foto_annuncio(annuncio_id: str, foto_id: str, user: dict = Depends(require_roles("azienda"))):
    doc = await _owned(annuncio_id, user)
    foto = next((f for f in doc.get("foto", []) if f.get("id") == foto_id), None)
    if not foto:
        raise HTTPException(status_code=404, detail="Foto non trovata")
    await db.files.update_one({"path": foto["path"]}, {"$set": {"is_deleted": True}})
    await db.annunci.update_one({"_id": doc["_id"]}, {"$pull": {"foto": {"id": foto_id}}})
    fresh = await db.annunci.find_one({"_id": doc["_id"]})
    return clean_doc(fresh)
