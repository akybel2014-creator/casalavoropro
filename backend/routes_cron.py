import os
import hmac
import logging
from datetime import timezone, timedelta, datetime

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from bson import ObjectId

from core import db, now
from emailer import send_offer_reminder, send_reactivation_email, send_noleggio_event, send_intervento_reminder

logger = logging.getLogger(__name__)

# Fallback legacy per trial_ends_at mancanti su vecchie aziende dell'Offerta Fondatori.
LAUNCH_TRIAL_END = datetime(2026, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
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


async def _run_offer_reactivation():
    """Email una tantum alle aziende con prova scaduta: invito a riattivare il PRO con link al checkout."""
    sent_count = 0
    cursor = db.aziende.find({"subscription_status": "trial_expired", "reactivation_email_sent": {"$ne": True}})
    async for az in cursor:
        try:
            owner = await db.users.find_one({"_id": ObjectId(az["owner_id"])})
        except Exception:
            owner = None
        if not owner or not owner.get("email"):
            continue
        try:
            cats = az.get("categorie") or []
            leads = await db.richieste.count_documents({"categoria": {"$in": cats}}) if cats else 0
            await send_reactivation_email(owner["email"], owner.get("name", "") or az.get("nome", ""), leads)
            await db.aziende.update_one({"_id": az["_id"]}, {"$set": {"reactivation_email_sent": True}})
            sent_count += 1
        except Exception:
            logger.exception("reactivation email failed for azienda %s", az.get("_id"))
    logger.info("offer-reactivation: inviate %s email di riattivazione", sent_count)


async def _run_noleggio_reminder():
    """Promemoria 1 giorno prima della consegna per le prenotazioni confermate (a cliente e azienda)."""
    domani = (now().date() + timedelta(days=1)).isoformat()
    sent_count = 0
    cursor = db.prenotazioni.find({
        "stato": "confermata",
        "dal": domani,
        "reminder_consegna_sent": {"$ne": True},
    })
    async for p in cursor:
        try:
            for uid, ruolo in ((p.get("client_id"), "privato"), (p.get("owner_id"), "azienda")):
                if not uid:
                    continue
                u = await db.users.find_one({"_id": ObjectId(uid)}, {"email": 1})
                if u and u.get("email"):
                    await send_noleggio_event(u["email"], ruolo, "promemoria_consegna", p)
            await db.prenotazioni.update_one({"_id": p["_id"]}, {"$set": {"reminder_consegna_sent": True}})
            sent_count += 1
        except Exception:
            logger.exception("noleggio reminder email failed for prenotazione %s", p.get("_id"))
    logger.info("noleggio-reminder: inviati %s promemoria di consegna", sent_count)


async def _run_intervento_reminder():
    """Promemoria email il giorno prima della data di un intervento pianificato (all'azienda)."""
    domani = (now().date() + timedelta(days=1)).isoformat()
    sent_count = 0
    cursor = db.interventi.find({
        "data": domani,
        "stato": "pianificato",
        "reminder_sent": {"$ne": True},
    })
    async for it in cursor:
        try:
            owner = await db.users.find_one({"_id": ObjectId(it["user_id"])}, {"email": 1, "name": 1})
            if owner and owner.get("email"):
                await send_intervento_reminder(owner["email"], owner.get("name", ""), it)
            await db.interventi.update_one({"_id": it["_id"]}, {"$set": {"reminder_sent": True}})
            sent_count += 1
        except Exception:
            logger.exception("intervento reminder email failed for %s", it.get("_id"))
    logger.info("intervento-reminder: inviati %s promemoria cantiere", sent_count)


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


@router.post("/cron/offer-reactivation")
async def cron_offer_reactivation(background: BackgroundTasks, authorization: str | None = Header(default=None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    _check_auth(authorization)
    background.add_task(_run_offer_reactivation)
    return {"ok": True, "queued": "offer-reactivation"}


@router.post("/cron/noleggio-reminder")
async def cron_noleggio_reminder(background: BackgroundTasks, authorization: str | None = Header(default=None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    _check_auth(authorization)
    background.add_task(_run_noleggio_reminder)
    # Promemoria interventi/cantieri: piggyback sullo stesso cron giornaliero (limite di 5 cron).
    background.add_task(_run_intervento_reminder)
    return {"ok": True, "queued": ["noleggio-reminder", "intervento-reminder"]}


@router.post("/cron/intervento-reminder")
async def cron_intervento_reminder(background: BackgroundTasks, authorization: str | None = Header(default=None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    _check_auth(authorization)
    background.add_task(_run_intervento_reminder)
    return {"ok": True, "queued": "intervento-reminder"}
