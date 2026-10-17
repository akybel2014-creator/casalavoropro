import re
import logging
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core import db, now, clean_doc, require_roles, notify
from credits import RUOLI
from emailer import send_verification_result

logger = logging.getLogger(__name__)
router = APIRouter()

SUB_MONTHLY_CENTS = 399
SUB_YEARLY_CENTS = 3999


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Utente non trovato")


class VerificaIn(BaseModel):
    azione: str  # verificata | rifiutata


class CreditsIn(BaseModel):
    bonus_credits: int | None = None
    purchased_credits: int | None = None


class RoleIn(BaseModel):
    role: str | None = None
    ruolo: str | None = None


class SuspendIn(BaseModel):
    suspended: bool


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


@router.get("/admin/metrics")
async def admin_metrics(user: dict = Depends(require_roles("admin"))):
    """Metriche di business: MRR stimato, incasso pacchetti crediti, utenti per ruolo."""
    agg = await db.payment_transactions.aggregate([
        {"$match": {"kind": "crediti", "payment_status": "paid"}},
        {"$group": {"_id": None, "tot": {"$sum": "$amount"}}},
    ]).to_list(1)
    credit_rev_cents = int((agg[0]["tot"] if agg else 0) or 0)

    mrr_cents = 0
    active_subs = 0
    async for az in db.aziende.find({"subscription_status": "active"}, {"owner_id": 1}):
        oid = az.get("owner_id")
        if not oid:
            continue
        active_subs += 1
        tx = await db.payment_transactions.find_one(
            {"user_id": oid, "payment_status": "paid", "lookup_key": {"$exists": True}},
            sort=[("created_at", -1)])
        if tx and tx.get("lookup_key") == "pro_yearly":
            mrr_cents += round(SUB_YEARLY_CENTS / 12)
        else:
            mrr_cents += SUB_MONTHLY_CENTS

    privati = await db.users.count_documents({"role": "privato"})
    abbonate = await db.users.count_documents({"ruolo": "azienda_abbonata"})
    payg = await db.users.count_documents({"ruolo": "azienda_pay_as_you_go"})
    aziende_tot = await db.users.count_documents({"role": "azienda"})
    utenti_tot = await db.users.count_documents({})
    return {
        "mrr_cents": mrr_cents, "mrr_eur": round(mrr_cents / 100, 2),
        "credit_revenue_cents": credit_rev_cents, "credit_revenue_eur": round(credit_rev_cents / 100, 2),
        "active_subscriptions": active_subs,
        "counts": {
            "privati": privati, "aziende_abbonate": abbonate,
            "aziende_pay_as_you_go": payg, "aziende_totali": aziende_tot, "totale": utenti_tot,
        },
    }


@router.get("/admin/users")
async def admin_users(q: str = "", user: dict = Depends(require_roles("admin"))):
    """Ricerca utenti/artigiani per email o nome (max 100)."""
    query = {}
    if q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query = {"$or": [{"email": rx}, {"name": rx}]}
    docs = await db.users.find(query).sort("created_at", -1).to_list(100)
    out = []
    for d in docs:
        item = clean_doc(d)
        az = await db.aziende.find_one({"owner_id": item["id"]},
                                       {"nome": 1, "plan": 1, "subscription_status": 1})
        item["azienda_nome"] = (az or {}).get("nome")
        item["plan"] = (az or {}).get("plan")
        item["subscription_status"] = (az or {}).get("subscription_status")
        item["bonus_credits"] = int(d.get("bonus_credits", 0) or 0)
        item["purchased_credits"] = int(d.get("purchased_credits", 0) or 0)
        item["suspended"] = bool(d.get("suspended", False))
        out.append(item)
    return out


@router.patch("/admin/users/{user_id}/credits")
async def admin_set_credits(user_id: str, inp: CreditsIn, user: dict = Depends(require_roles("admin"))):
    """Imposta manualmente il saldo crediti (ricarica/rimborso manuale)."""
    oid = _oid(user_id)
    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    set_fields = {}
    if inp.bonus_credits is not None:
        set_fields["bonus_credits"] = max(0, int(inp.bonus_credits))
    if inp.purchased_credits is not None:
        set_fields["purchased_credits"] = max(0, int(inp.purchased_credits))
    if not set_fields:
        raise HTTPException(status_code=400, detail="Nessun valore da aggiornare")
    await db.users.update_one({"_id": oid}, {"$set": set_fields})
    await db.credit_transactions.insert_one({
        "user_id": user_id, "action": "admin_adjust", "delta": 0,
        "meta": {"by": user.get("email"), **set_fields}, "created_at": now(),
    })
    u = await db.users.find_one({"_id": oid}, {"bonus_credits": 1, "purchased_credits": 1})
    return {"ok": True, "bonus_credits": int(u.get("bonus_credits", 0) or 0),
            "purchased_credits": int(u.get("purchased_credits", 0) or 0)}


@router.patch("/admin/users/{user_id}/role")
async def admin_set_role(user_id: str, inp: RoleIn, user: dict = Depends(require_roles("admin"))):
    """Modifica il ruolo (role) e/o il ruolo crediti (ruolo) di un utente."""
    oid = _oid(user_id)
    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    set_fields = {}
    if inp.role is not None:
        if inp.role not in ("privato", "azienda", "admin"):
            raise HTTPException(status_code=400, detail="Ruolo non valido")
        set_fields["role"] = inp.role
    if inp.ruolo is not None:
        if inp.ruolo not in RUOLI:
            raise HTTPException(status_code=400, detail="Ruolo crediti non valido")
        set_fields["ruolo"] = inp.ruolo
    if not set_fields:
        raise HTTPException(status_code=400, detail="Nessun valore da aggiornare")
    await db.users.update_one({"_id": oid}, {"$set": set_fields})
    return {"ok": True, **set_fields}


@router.patch("/admin/users/{user_id}/suspend")
async def admin_suspend(user_id: str, inp: SuspendIn, user: dict = Depends(require_roles("admin"))):
    """Sospende o riattiva un account (blocco per violazioni)."""
    oid = _oid(user_id)
    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Non puoi sospendere un amministratore")
    await db.users.update_one({"_id": oid}, {"$set": {"suspended": bool(inp.suspended)}})
    return {"ok": True, "suspended": bool(inp.suspended)}
