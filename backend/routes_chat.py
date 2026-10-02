import logging
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, clean_doc, get_current_user, azienda_for_user, notify

logger = logging.getLogger(__name__)
router = APIRouter()


class MessaggioIn(BaseModel):
    testo: str = Field(min_length=1, max_length=2000)


async def _context_for(risposta_id: str, user: dict):
    try:
        rid_oid = ObjectId(risposta_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    risposta = await db.risposte.find_one({"_id": rid_oid})
    if not risposta:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    req = await db.richieste.find_one({"_id": ObjectId(risposta["richiesta_id"])})
    if not req:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")

    if user["role"] == "privato" and req["client_id"] == user["id"]:
        return risposta, req, "privato"
    if user["role"] == "azienda":
        azienda = await azienda_for_user(user["id"])
        if azienda and str(azienda["_id"]) == risposta["azienda_id"]:
            return risposta, req, "azienda"
    raise HTTPException(status_code=403, detail="Permesso negato")


@router.get("/risposte/{risposta_id}/messaggi")
async def lista_messaggi(risposta_id: str, user: dict = Depends(get_current_user)):
    risposta, req, ruolo = await _context_for(risposta_id, user)
    docs = await db.messaggi.find({"risposta_id": risposta_id}).sort("created_at", 1).to_list(500)
    await db.messaggi.update_many(
        {"risposta_id": risposta_id, "sender_id": {"$ne": user["id"]}, "letto": False},
        {"$set": {"letto": True}},
    )
    return [clean_doc(d) for d in docs]


@router.get("/chat/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    if user["role"] == "privato":
        req_ids = [str(r["_id"]) async for r in db.richieste.find({"client_id": user["id"]}, {"_id": 1})]
        risposte = await db.risposte.find({"richiesta_id": {"$in": req_ids}}, {"_id": 1}).to_list(500)
    elif user["role"] == "azienda":
        az_ids = [str(a["_id"]) async for a in db.aziende.find({"owner_id": user["id"]}, {"_id": 1})]
        risposte = await db.risposte.find({"azienda_id": {"$in": az_ids}}, {"_id": 1}).to_list(500)
    else:
        return {"total": 0, "per_risposta": {}}
    ids = [str(r["_id"]) for r in risposte]
    if not ids:
        return {"total": 0, "per_risposta": {}}
    per, total = {}, 0
    async for m in db.messaggi.find({"risposta_id": {"$in": ids},
                                     "sender_id": {"$ne": user["id"]},
                                     "letto": False}):
        per[m["risposta_id"]] = per.get(m["risposta_id"], 0) + 1
        total += 1
    return {"total": total, "per_risposta": per}


@router.post("/risposte/{risposta_id}/messaggi")
async def invia_messaggio(risposta_id: str, inp: MessaggioIn, user: dict = Depends(get_current_user)):
    risposta, req, ruolo = await _context_for(risposta_id, user)
    doc = {
        "risposta_id": risposta_id, "sender_id": user["id"], "sender_role": ruolo,
        "sender_name": user["name"], "testo": inp.testo.strip(),
        "letto": False, "created_at": now(),
    }
    res = await db.messaggi.insert_one(doc)
    out = clean_doc(doc)
    out["id"] = str(res.inserted_id)

    if ruolo == "privato":
        azienda = await db.aziende.find_one({"_id": ObjectId(risposta["azienda_id"])})
        if azienda:
            await notify(azienda["owner_id"], "Nuovo messaggio dal cliente",
                         f"{user['name']} ha scritto per: {req.get('titolo', '')}",
                         link="/dashboard/azienda")
    else:
        await notify(req["client_id"], "Nuovo messaggio dall'azienda",
                     f"{user['name']} ha risposto per: {req.get('titolo', '')}",
                     link="/dashboard")
    return out
