"""Gating abbonamento PRO di CasaLavoroPRO.

Modello SaaS puro (nessun credito/wallet). Le funzioni gestionali avanzate
(cantieri/interventi, annunci noleggio e usato, offerte di lavoro) sono riservate
alle aziende con abbonamento PRO attivo, incluso il periodo di prova gratuito di
14 giorni gestito da Stripe (subscription_status = "trialing").
"""
from datetime import timezone

from fastapi import Depends, HTTPException

from core import db, now, get_current_user, azienda_for_user, require_roles  # noqa: F401

PRO_UPSELL = ("Funzione riservata al piano PRO. Attiva CasaLavoroPRO con 14 giorni di prova "
              "gratuita per sbloccare cantieri, annunci e offerte di lavoro.")

# Stati di abbonamento considerati PRO attivo ("active_trial" resta per compatibilita legacy).
PRO_ACTIVE_STATES = ("active", "trialing", "active_trial")
TRIAL_STATES = ("trialing", "active_trial")


def azienda_pro_active(az: dict | None) -> bool:
    """True se l'azienda ha un abbonamento PRO attivo (o in prova non scaduta)."""
    if not az or az.get("plan") != "pro":
        return False
    sub = az.get("subscription_status")
    if sub not in PRO_ACTIVE_STATES:
        return False
    if sub in TRIAL_STATES:
        te = az.get("trial_ends_at")
        if te is not None:
            if te.tzinfo is None:
                te = te.replace(tzinfo=timezone.utc)
            if now() > te:
                return False
    return True


async def is_pro_active(user: dict) -> bool:
    """True per admin o aziende con PRO attivo."""
    if user.get("role") == "admin":
        return True
    az = await azienda_for_user(user["id"])
    return azienda_pro_active(az)


async def require_pro_azienda(user: dict = Depends(require_roles("azienda"))) -> dict:
    """Dependency: richiede ruolo azienda + abbonamento PRO attivo, altrimenti 402 (upsell)."""
    az = await azienda_for_user(user["id"])
    if not azienda_pro_active(az):
        raise HTTPException(status_code=402, detail=PRO_UPSELL)
    return user


async def pro_status(user: dict) -> dict:
    """Stato abbonamento dell'utente corrente (per il frontend)."""
    if user.get("role") != "azienda":
        return {"plan": None, "pro_active": user.get("role") == "admin",
                "subscription_status": None, "trial": False, "trial_days_left": 0,
                "trial_ends_at": None}
    az = await azienda_for_user(user["id"]) or {}
    sub = az.get("subscription_status")
    active = azienda_pro_active(az)
    trial_days_left = 0
    te = az.get("trial_ends_at")
    if sub in TRIAL_STATES and te is not None:
        if te.tzinfo is None:
            te = te.replace(tzinfo=timezone.utc)
        trial_days_left = max(0, (te - now()).days)
    return {
        "plan": az.get("plan", "free"),
        "pro_active": active,
        "subscription_status": sub,
        "trial": active and sub in TRIAL_STATES,
        "trial_days_left": trial_days_left,
        "trial_ends_at": te.isoformat() if te else None,
    }
