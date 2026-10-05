import os
import hmac
import logging
from datetime import timezone

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from bson import ObjectId

from core import db, now
from routes_auth import LAUNCH_TRIAL_END
from emailer import send_offer_reminder

logger = logging.getLogger(__name__)
router = APIRouter()

WEBHOOK_CRON_SECRET = os.environ["WEBHOOK_CRON_SECRET"]

# Milestones (giorni rimanenti) in cui inviare il promemoria dell'Offerta Lancio Fondatori.
REMINDER_MILESTONES = (7, 1)


def _check_auth(authorization: str | None):
    expected = f"Bearer {WEBHOOK_CRON_SECRET}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="unauthorized")


def _as_utc(dt):
    if dt is None:
        return LAUNCH_TRIAL_END
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def _run_offer_reminder():
    """Invia il promemoria alle aziende ancora in prova a 7 e 1 giorni dalla scadenza."""
    today = now().date()
    sent_count = 0
    cursor = db.aziende.find({"subscription_status": "active_trial"})
    async for az in cursor:
        tend = _as_utc(az.get("trial_ends_at"))
        days_left = (tend.date() - today).days
        if days_left < 1:
            continue
        already = set(az.get("offerta_reminders_sent", []))
        milestone = None
        if days_left <= 1 and 1 not in already:
            milestone = 1
        elif days_left <= 7 and 7 not in already:
            milestone = 7
        if milestone is None:
            continue
        try:
            owner = await db.users.find_one({"_id": ObjectId(az["owner_id"])})
        except Exception:
            owner = None
        if not owner or not owner.get("email"):
            continue
        try:
            leads = 0
            cats = az.get("categorie") or []
            if cats:
                leads = await db.richieste.count_documents({"categoria": {"$in": cats}})
            preventivi = await db.risposte.count_documents({"azienda_id": str(az["_id"])})
            await send_offer_reminder(owner["email"], owner.get("name", "") or az.get("nome", ""), days_left, leads, preventivi)
            # Se inviamo il promemoria a 1 giorno, segniamo anche quello a 7 come superato.
            new_sent = sorted(already | ({1, 7} if milestone == 1 else {7}))
            await db.aziende.update_one({"_id": az["_id"]}, {"$set": {"offerta_reminders_sent": new_sent}})
            sent_count += 1
        except Exception:
            logger.exception("offer reminder email failed for azienda %s", az.get("_id"))
    logger.info("offer-reminder: inviati %s promemoria", sent_count)


async def _run_offer_expire():
    """Dopo la scadenza, converte le aziende in prova: PRO bloccato, piani a pagamento riattivati."""
    tnow = now()
    res = await db.aziende.update_many(
        {"subscription_status": "active_trial", "trial_ends_at": {"$lt": tnow}},
        {"$set": {"plan": "free", "subscription_status": "trial_expired", "updated_at": tnow}},
    )
    logger.info("offer-expire: convertite %s aziende con prova scaduta", res.modified_count)


@router.post("/cron/offer-reminder")
async def cron_offer_reminder(background: BackgroundTasks, authorization: str | None = Header(default=None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    _check_auth(authorization)
    background.add_task(_run_offer_reminder)
    return {"ok": True, "queued": "offer-reminder"}


@router.post("/cron/offer-expire")
async def cron_offer_expire(background: BackgroundTasks, authorization: str | None = Header(default=None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    _check_auth(authorization)
    background.add_task(_run_offer_expire)
    return {"ok": True, "queued": "offer-expire"}
