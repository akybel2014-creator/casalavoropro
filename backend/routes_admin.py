import logging
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core import db, now, clean_doc, require_roles, notify
from emailer import send_verification_result

logger = logging.getLogger(__name__)
router = APIRouter()


class VerificaIn(BaseModel):
    azione: str  # verificata | rifiutata


@router.get("/admin/aziende")
async def admin_list_aziende(user: dict = Depends(require_roles("admin"))):
    docs = await db.aziende.find({}).sort("created_at", -1).to_list(300)
    out = []
    for d in docs:
        item = clean_doc(d)
        owner = None
        if d.get("owner_id"):
            try:
                owner = await db.users.find_one({"_id": ObjectId(d["owner_id"])})
            except Exception:
                owner = None
        item["owner_email"] = owner.get("email", "") if owner else ""
        out.append(item)
    return out


@router.post("/admin/aziende/{azienda_id}/verifica")
async def admin_verifica_azienda(azienda_id: str, inp: VerificaIn,
                                 user: dict = Depends(require_roles("admin"))):
    try:
        oid = ObjectId(azienda_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    azienda = await db.aziende.find_one({"_id": oid})
    if not azienda:
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    if inp.azione not in ("verificata", "rifiutata"):
        raise HTTPException(status_code=400, detail="Azione non valida")

    verificata = inp.azione == "verificata"
    await db.aziende.update_one({"_id": oid},
                                {"$set": {"verification_status": inp.azione,
                                          "verified": verificata,
                                          "verified_at": now() if verificata else None}})
    await notify(azienda["owner_id"],
                 "Azienda verificata" if verificata else "Verifica non superata",
                 (f"Complimenti: {azienda.get('nome', '')} e ora un'Azienda Verificata PRO."
                  if verificata else
                  f"La verifica di {azienda.get('nome', '')} non e stata superata. "
                  f"Controlla i documenti e riprova."),
                 link="/dashboard/azienda")
    owner = await db.users.find_one({"_id": ObjectId(azienda["owner_id"])})
    if owner:
        try:
            await send_verification_result(owner["email"], azienda.get("nome", ""), verificata)
        except Exception:
            logger.exception("verification email failed")
    return {"ok": True, "verification_status": inp.azione}


@router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_roles("admin"))):
    return {
        "utenti": await db.users.count_documents({}),
        "aziende": await db.aziende.count_documents({}),
        "aziende_verificate": await db.aziende.count_documents({"verified": True}),
        "richieste": await db.richieste.count_documents({}),
        "risposte": await db.risposte.count_documents({}),
        "abbonamenti_pro": await db.aziende.count_documents({"plan": "pro"}),
    }
