import re
import logging
from typing import Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, azienda_for_user, notify_admins
from geo import haversine_km

logger = logging.getLogger(__name__)
router = APIRouter()


def _rx(s: str) -> str:
    return re.escape(s.strip())


@router.get("/aziende/mine")
async def my_azienda(user: dict = Depends(require_roles("azienda"))):
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    return clean_doc(azienda)


class AziendaUpdateIn(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=120)
    categorie: Optional[List[str]] = None
    zone: Optional[List[str]] = None
    piva: Optional[str] = None
    descrizione: Optional[str] = None
    telefono: Optional[str] = None
    sito: Optional[str] = None
    durc_number: Optional[str] = None
    emergenze: Optional[bool] = None
    emergenze_weekend: Optional[bool] = None
    emergenze_notturno: Optional[bool] = None
    emergenze_telefono: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)


@router.put("/aziende/mine")
async def update_my_azienda(inp: AziendaUpdateIn, user: dict = Depends(require_roles("azienda"))):
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    updates = {k: v for k, v in inp.model_dump().items() if v is not None}
    lat, lng = updates.pop("lat", None), updates.pop("lng", None)
    if lat is not None and lng is not None:
        updates["location"] = {"type": "Point", "coordinates": [lng, lat]}
    if updates:
        await db.aziende.update_one({"_id": azienda["_id"]}, {"$set": updates})
    fresh = await db.aziende.find_one({"_id": azienda["_id"]})
    return clean_doc(fresh)


@router.post("/aziende/mine/verifica")
async def request_verification(user: dict = Depends(require_roles("azienda"))):
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    if azienda.get("verification_status") == "in_attesa":
        raise HTTPException(status_code=400, detail="Richiesta gia in lavorazione")
    if not azienda.get("piva"):
        raise HTTPException(status_code=400, detail="Inserisci la Partita IVA prima di richiedere la verifica")
    if not azienda.get("durc_number"):
        raise HTTPException(status_code=400, detail="Inserisci il numero DURC prima di richiedere la verifica")
    await db.aziende.update_one({"_id": azienda["_id"]},
                                {"$set": {"verification_status": "in_attesa",
                                          "docs": [{"tipo": "P.IVA", "valore": azienda["piva"]},
                                                   {"tipo": "DURC", "valore": azienda["durc_number"]}],
                                          "docs_uploaded_at": now()}})
    await notify_admins("Nuova richiesta di verifica",
                        f"L'azienda {azienda.get('nome', '')} ha inviato i documenti per la verifica PRO.",
                        link="/dashboard/admin")
    return {"ok": True, "verification_status": "in_attesa"}


@router.get("/aziende")
async def list_aziende(categoria: str = "", zona: str = "", q: str = "", verificate: bool = False,
                       emergenze: bool = False, weekend: bool = False, notturno: bool = False,
                       lat: Optional[float] = None, lng: Optional[float] = None,
                       radius_km: float = Query(25, gt=0, le=500)):
    query = {}
    if categoria.strip():
        query["categorie"] = categoria.strip()
    if zona.strip():
        query["zone"] = {"$regex": _rx(zona), "$options": "i"}
    if q.strip():
        query["$or"] = [
            {"nome": {"$regex": _rx(q), "$options": "i"}},
            {"descrizione": {"$regex": _rx(q), "$options": "i"}},
        ]
    if verificate:
        query["verified"] = True
    if emergenze:
        query["emergenze"] = True
    if weekend:
        query["emergenze_weekend"] = True
    if notturno:
        query["emergenze_notturno"] = True

    docs = await db.aziende.find(query, {"owner_id": 0}) \
        .sort([("verified", -1), ("plan", -1), ("nome", 1)]).to_list(200)

    geo_search = lat is not None and lng is not None
    out = []
    for d in docs:
        item = clean_doc(d)
        if geo_search:
            coords = (d.get("location") or {}).get("coordinates", [])
            if len(coords) != 2:
                continue
            dist = haversine_km(lat, lng, coords[1], coords[0])
            if dist > radius_km:
                continue
            item["distance_km"] = round(dist, 1)
        out.append(item)

    if geo_search:
        out.sort(key=lambda x: x.get("distance_km", 1e9))
    return out


@router.get("/aziende/{azienda_id}")
async def get_azienda(azienda_id: str):
    try:
        oid = ObjectId(azienda_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    doc = await db.aziende.find_one({"_id": oid}, {"owner_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    return clean_doc(doc)
