"""Sistema Wallet a Crediti di CasaLavoroPRO.

Ruoli (campo utente `ruolo`):
  - "privato": naviga gratis, crediti sempre 0, funzioni gestionali nascoste/bloccate.
  - "azienda_abbonata": PRO attivo (incl. trial Founders). +5 bonus_credits/mese (saldo
    generico), gestionali e annunci standard gratis. Premium pagato dai crediti.
  - "azienda_pay_as_you_go": nessun abbonamento. 0 bonus, gestionali bloccate (403 upsell),
    servizi speciali solo con purchased_credits > 0.

Saldo totale = bonus_credits + purchased_credits. In consumo si scalano PRIMA i bonus,
poi gli acquistati.
"""
import logging
from datetime import timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core import db, now, get_current_user, azienda_for_user

logger = logging.getLogger(__name__)
router = APIRouter()

RUOLI = ("privato", "azienda_abbonata", "azienda_pay_as_you_go")

MONTHLY_BONUS = 5

# Costo fisso (in crediti) delle azioni premium.
CREDIT_COSTS = {
    "bolletta_extra": 1,       # Lettura bolletta oltre i bonus mensili
    "annuncio_standard": 1,    # Pubblicazione annuncio lavoro standard
    "annuncio_urgente": 5,     # Annuncio lavoro "In Evidenza / Urgente"
    "sblocco_contatto": 2,     # Sblocco contatto operaio o macchinario a noleggio
}

# Pacchetti crediti acquistabili su Stripe.
PACKAGES = {
    "prod_entry_15": {"crediti": 15, "prezzo_cent": 1499, "nome": "Entry"},
    "prod_growth_50": {"crediti": 50, "prezzo_cent": 3999, "nome": "Growth"},
    "prod_enterprise_120": {"crediti": 120, "prezzo_cent": 7999, "nome": "Enterprise"},
}


def ruolo_from_azienda(az: dict | None) -> str:
    """Deriva il ruolo crediti dallo stato abbonamento dell'azienda."""
    if not az:
        return "azienda_pay_as_you_go"
    plan = az.get("plan")
    sub = az.get("subscription_status")
    trial_end = az.get("trial_ends_at")
    if trial_end is not None and trial_end.tzinfo is None:
        trial_end = trial_end.replace(tzinfo=timezone.utc)
    pro_active = plan == "pro" and sub in ("active", "active_trial", "trialing")
    if pro_active:
        if sub in ("active_trial", "trialing") and trial_end and now() > trial_end:
            return "azienda_pay_as_you_go"
        return "azienda_abbonata"
    return "azienda_pay_as_you_go"


async def effective_ruolo(user: dict) -> str:
    """Ruolo crediti effettivo dell'utente (admin => accesso libero senza addebiti)."""
    if user.get("role") == "admin":
        return "admin"
    r = user.get("ruolo")
    if r in RUOLI:
        return r
    if user.get("role") == "privato":
        return "privato"
    az = await db.aziende.find_one({"owner_id": user["id"]},
                                   {"plan": 1, "subscription_status": 1, "trial_ends_at": 1})
    return ruolo_from_azienda(az)


def credit_policy(ruolo: str, action: str):
    """Ritorna: 0 (gratis), "blocked" (upsell 403), oppure il costo in crediti (int)."""
    if ruolo == "admin":
        return 0
    cost = CREDIT_COSTS.get(action, 0)
    if action == "gestionali":
        return 0 if ruolo == "azienda_abbonata" else "blocked"
    if action == "annuncio_standard":
        return 0 if ruolo == "azienda_abbonata" else CREDIT_COSTS["annuncio_standard"]
    if action == "analisi_bolletta":
        return 0 if ruolo == "privato" else CREDIT_COSTS["bolletta_extra"]
    # premium (annuncio_urgente, sblocco_contatto, ...) => sempre a pagamento
    return cost


async def _deduct(user_id: str, cost: int) -> dict | None:
    """Scala `cost` crediti (prima i bonus, poi gli acquistati) in modo atomico.
    Ritorna il dettaglio dello scalo, o None se saldo insufficiente."""
    u = await db.users.find_one({"_id": ObjectId(user_id)},
                                {"bonus_credits": 1, "purchased_credits": 1})
    bonus = int(u.get("bonus_credits", 0) or 0)
    purch = int(u.get("purchased_credits", 0) or 0)
    if bonus + purch < cost:
        return None
    from_bonus = min(bonus, cost)
    from_purch = cost - from_bonus
    res = await db.users.update_one(
        {"_id": ObjectId(user_id),
         "bonus_credits": {"$gte": from_bonus}, "purchased_credits": {"$gte": from_purch}},
        {"$inc": {"bonus_credits": -from_bonus, "purchased_credits": -from_purch}})
    if res.modified_count != 1:
        return None
    return {"from_bonus": from_bonus, "from_purchased": from_purch, "total": cost}


async def _log_tx(user_id: str, action: str, delta: int, meta: dict | None = None):
    await db.credit_transactions.insert_one({
        "user_id": user_id, "action": action, "delta": delta,
        "meta": meta or {}, "created_at": now(),
    })


async def charge(user: dict, action: str, meta: dict | None = None) -> dict:
    """Applica la policy crediti per l'azione. Solleva 403 (upsell) o 402 (saldo esaurito).
    Ritorna {charged, from_bonus, from_purchased, ruolo}."""
    ruolo = await effective_ruolo(user)
    policy = credit_policy(ruolo, action)
    if policy == "blocked":
        raise HTTPException(status_code=403,
                            detail="Funzione riservata al piano PRO. Passa a CasaLavoroPRO per sbloccare fatture e cantieri.")
    cost = int(policy)
    if cost <= 0:
        return {"charged": 0, "from_bonus": 0, "from_purchased": 0, "ruolo": ruolo}
    detail = await _deduct(user["id"], cost)
    if detail is None:
        raise HTTPException(status_code=402, detail="Crediti esauriti. Ricarica il Wallet")
    await _log_tx(user["id"], action, -cost, meta)
    return {"charged": cost, **{k: detail[k] for k in ("from_bonus", "from_purchased")}, "ruolo": ruolo}


def require_credits(action: str):
    """Dependency FastAPI: addebita (se dovuto) il costo fisso dell'azione prima dell'endpoint."""
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        await charge(user, action)
        return user
    return dep


async def grant_purchased(user_id: str, crediti: int, meta: dict | None = None):
    """Accredita crediti acquistati (es. pagamento Stripe andato a buon fine). Idempotente a monte."""
    await db.users.update_one({"_id": ObjectId(user_id)},
                              {"$inc": {"purchased_credits": int(crediti)}})
    await _log_tx(user_id, "ricarica_stripe", int(crediti), meta)


async def init_user_credits(user_id: str, role: str, azienda: dict | None = None):
    """Imposta ruolo e crediti iniziali alla registrazione."""
    if role == "privato":
        ruolo, bonus = "privato", 0
    else:
        ruolo = ruolo_from_azienda(azienda)
        bonus = MONTHLY_BONUS if ruolo == "azienda_abbonata" else 0
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"ruolo": ruolo, "bonus_credits": bonus, "purchased_credits": 0,
                  "bonus_refreshed_at": now()}})
    return {"ruolo": ruolo, "bonus_credits": bonus}


async def refresh_bonus_for_all() -> dict:
    """Ricalcola il ruolo di tutte le aziende e ricarica i 5 bonus mensili agli abbonati.
    Usato dal cron mensile. Idempotente nell'arco del mese."""
    aggiornate = bonus_dati = declassate = 0
    async for az in db.aziende.find({}, {"owner_id": 1, "plan": 1, "subscription_status": 1, "trial_ends_at": 1}):
        uid = az.get("owner_id")
        if not uid:
            continue
        ruolo = ruolo_from_azienda(az)
        set_fields = {"ruolo": ruolo}
        if ruolo == "azienda_abbonata":
            set_fields.update({"bonus_credits": MONTHLY_BONUS, "bonus_refreshed_at": now()})
            bonus_dati += 1
        else:
            set_fields["bonus_credits"] = 0
            declassate += 1
        try:
            await db.users.update_one({"_id": ObjectId(uid)}, {"$set": set_fields})
            aggiornate += 1
        except Exception:
            logger.exception("refresh bonus failed for %s", uid)
    return {"aziende_aggiornate": aggiornate, "bonus_ricaricati": bonus_dati, "pay_as_you_go": declassate}


# ----------------------------- Endpoints -----------------------------

@router.get("/crediti/wallet")
async def wallet(user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"_id": ObjectId(user["id"])},
                                {"bonus_credits": 1, "purchased_credits": 1, "ruolo": 1})
    bonus = int(u.get("bonus_credits", 0) or 0)
    purch = int(u.get("purchased_credits", 0) or 0)
    ruolo = await effective_ruolo(user)
    return {
        "ruolo": ruolo,
        "bonus_credits": bonus,
        "purchased_credits": purch,
        "saldo_crediti": bonus + purch,
        "gestionali_sbloccate": ruolo in ("azienda_abbonata", "admin"),
    }


@router.get("/crediti/costi")
async def costi():
    return {
        "costi": CREDIT_COSTS,
        "pacchetti": [{"id": k, **v} for k, v in PACKAGES.items()],
        "bonus_mensile": MONTHLY_BONUS,
    }


@router.get("/crediti/movimenti")
async def movimenti(user: dict = Depends(get_current_user)):
    docs = await db.credit_transactions.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [{"action": d.get("action"), "delta": d.get("delta"),
             "meta": d.get("meta", {}),
             "created_at": d["created_at"].isoformat() if d.get("created_at") else None}
            for d in docs]


class SbloccoIn(BaseModel):
    tipo: str          # "operaio" | "macchinario"
    target_id: str     # id offerta_lavoro (operaio) o annuncio (macchinario)


@router.post("/crediti/sblocca-contatto")
async def sblocca_contatto(inp: SbloccoIn, user: dict = Depends(get_current_user)):
    if inp.tipo not in ("operaio", "macchinario"):
        raise HTTPException(status_code=400, detail="Tipo non valido")

    # Riaccesso gratuito se gia sbloccato in precedenza.
    already = await db.contatti_sbloccati.find_one(
        {"user_id": user["id"], "tipo": inp.tipo, "target_id": inp.target_id})

    contatto = await _fetch_contatto(inp.tipo, inp.target_id)
    if contatto is None:
        raise HTTPException(status_code=404, detail="Elemento non trovato")

    if already:
        return {"ok": True, "gia_sbloccato": True, "charged": 0, "contatto": contatto}

    res = await charge(user, "sblocco_contatto", meta={"tipo": inp.tipo, "target_id": inp.target_id})
    await db.contatti_sbloccati.insert_one(
        {"user_id": user["id"], "tipo": inp.tipo, "target_id": inp.target_id, "created_at": now()})
    return {"ok": True, "gia_sbloccato": False, "charged": res["charged"], "contatto": contatto}


async def _fetch_contatto(tipo: str, target_id: str) -> dict | None:
    try:
        oid = ObjectId(target_id)
    except Exception:
        return None
    if tipo == "operaio":
        o = await db.offerte_lavoro.find_one({"_id": oid})
        if not o:
            return None
        return {"email": o.get("contatto_email", ""), "telefono": o.get("contatto_telefono", ""),
                "azienda": o.get("azienda_nome", "")}
    a = await db.annunci.find_one({"_id": oid})
    if not a:
        return None
    az = await db.aziende.find_one({"_id": ObjectId(a["azienda_id"])}) if a.get("azienda_id") else None
    return {"telefono": (az or {}).get("telefono", ""), "azienda": (az or {}).get("nome", ""),
            "email": (az or {}).get("email", "")}
