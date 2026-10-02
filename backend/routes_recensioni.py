import logging
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, notify

logger = logging.getLogger(__name__)
router = APIRouter()


class RecensioneIn(BaseModel):
    voto: int = Field(ge=1, le=5)
    commento: str = Field(min_length=5, max_length=1000)


async def _recompute_rating(azienda_id: str):
    agg = await db.recensioni.aggregate([
        {"$match": {"azienda_id": azienda_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$voto"}, "n": {"$sum": 1}}},
    ]).to_list(1)
    if agg:
        await db.aziende.update_one({"_id": ObjectId(azienda_id)},
                                    {"$set": {"rating": round(agg[0]["avg"], 1), "recensioni": agg[0]["n"]}})


@router.post("/risposte/{risposta_id}/recensione")
async def crea_recensione(risposta_id: str, inp: RecensioneIn,
                          user: dict = Depends(require_roles("privato"))):
    try:
        rid_oid = ObjectId(risposta_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    risposta = await db.risposte.find_one({"_id": rid_oid})
    if not risposta:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    req = await db.richieste.find_one({"_id": ObjectId(risposta["richiesta_id"])})
    if not req or req["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    if req.get("stato") != "chiusa" or risposta.get("stato") != "accettata":
        raise HTTPException(status_code=400, detail="Puoi recensire solo dopo aver accettato un preventivo")
    if await db.recensioni.find_one({"richiesta_id": risposta["richiesta_id"]}):
        raise HTTPException(status_code=400, detail="Hai gia recensito questo lavoro")

    doc = {
        "richiesta_id": risposta["richiesta_id"], "azienda_id": risposta["azienda_id"],
        "client_id": user["id"], "client_name": user["name"],
        "voto": inp.voto, "commento": inp.commento.strip(), "created_at": now(),
    }
    res = await db.recensioni.insert_one(doc)
    await _recompute_rating(risposta["azienda_id"])

    azienda = await db.aziende.find_one({"_id": ObjectId(risposta["azienda_id"])})
    if azienda:
        await notify(azienda["owner_id"], "Nuova recensione ricevuta",
                     f"{user['name']} ha lasciato una recensione ({inp.voto}/5) per: {req.get('titolo', '')}",
                     link="/dashboard/azienda")
    out = clean_doc(doc)
    out["id"] = str(res.inserted_id)
    return out


@router.get("/aziende/{azienda_id}/recensioni")
async def lista_recensioni(azienda_id: str):
    try:
        oid = ObjectId(azienda_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    docs = await db.recensioni.find({"azienda_id": str(oid)}) \
        .sort("created_at", -1).to_list(50)
    return [clean_doc(d) for d in docs]
