import logging
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from core import db, now, clean_doc, require_roles

logger = logging.getLogger(__name__)
router = APIRouter()


def _oid(azienda_id: str) -> ObjectId:
    try:
        return ObjectId(azienda_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Azienda non trovata")


@router.get("/preferiti/ids")
async def preferiti_ids(user: dict = Depends(require_roles("privato"))):
    docs = await db.preferiti.find({"user_id": user["id"]}, {"azienda_id": 1}).to_list(500)
    return [d["azienda_id"] for d in docs]


@router.get("/preferiti")
async def lista_preferiti(user: dict = Depends(require_roles("privato"))):
    prefs = await db.preferiti.find({"user_id": user["id"]}).sort("created_at", -1).to_list(500)
    if not prefs:
        return []
    oids = [ObjectId(p["azienda_id"]) for p in prefs]
    aziende = await db.aziende.find({"_id": {"$in": oids}}, {"owner_id": 0}).to_list(500)
    by_id = {str(a["_id"]): clean_doc(a) for a in aziende}
    out = []
    for p in prefs:
        a = by_id.get(p["azienda_id"])
        if a:
            a["saved_at"] = p["created_at"].isoformat()
            out.append(a)
    return out


@router.put("/preferiti/{azienda_id}")
async def aggiungi_preferito(azienda_id: str, user: dict = Depends(require_roles("privato"))):
    oid = _oid(azienda_id)
    if not await db.aziende.find_one({"_id": oid}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    await db.preferiti.update_one(
        {"user_id": user["id"], "azienda_id": str(oid)},
        {"$setOnInsert": {"user_id": user["id"], "azienda_id": str(oid), "created_at": now()}},
        upsert=True,
    )
    return {"ok": True, "saved": True}


@router.delete("/preferiti/{azienda_id}")
async def rimuovi_preferito(azienda_id: str, user: dict = Depends(require_roles("privato"))):
    oid = _oid(azienda_id)
    await db.preferiti.delete_one({"user_id": user["id"], "azienda_id": str(oid)})
    return {"ok": True, "saved": False}
