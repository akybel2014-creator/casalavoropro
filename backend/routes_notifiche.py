import logging
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from core import db, clean_doc, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/notifiche")
async def list_notifiche(user: dict = Depends(get_current_user)):
    docs = await db.notifiche.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [clean_doc(d) for d in docs]


@router.post("/notifiche/{notifica_id}/letta")
async def mark_letta(notifica_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(notifica_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Notifica non trovata")
    await db.notifiche.update_one({"_id": oid, "user_id": user["id"]}, {"$set": {"letto": True}})
    return {"ok": True}


@router.post("/notifiche/leggi-tutte")
async def mark_all_letta(user: dict = Depends(get_current_user)):
    await db.notifiche.update_many({"user_id": user["id"], "letto": False}, {"$set": {"letto": True}})
    return {"ok": True}
