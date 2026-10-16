import os
import logging
import stripe
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, require_roles
from core import get_current_user
from credits import PACKAGES, grant_purchased

logger = logging.getLogger(__name__)
router = APIRouter()

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
TAX_MODE = os.environ.get("STRIPE_TAX_MODE", "full")

try:
    from stripe.error import InvalidRequestError, SignatureVerificationError
except ImportError:
    from stripe import InvalidRequestError, SignatureVerificationError

payment_transactions = db["payment_transactions"]

TRIAL_DAYS = 14


async def trial_eligible(user_id: str) -> bool:
    """New companies only: never had an active/paid PRO and never used the trial."""
    az = await db.aziende.find_one({"owner_id": user_id}, {"trial_used": 1, "subscription_status": 1, "plan": 1})
    if not az or az.get("trial_used") or az.get("plan") == "pro" or az.get("subscription_status") == "active":
        return False
    paid = await payment_transactions.find_one({"user_id": user_id, "payment_status": "paid", "kind": {"$ne": "caparra"}})
    return paid is None


PLANS = [
    {"id": "free", "nome": "Base", "prezzo": "Gratis",
     "features": ["Profilo azienda nella directory", "Ricevi richieste della tua categoria",
                  "Invia fino a 2 preventivi al mese"]},
    {"id": "pro", "nome": "Pro", "lookup_key": "pro_monthly", "prezzo": "3,99 EUR/mese",
     "prezzo_annuo": "39,99 EUR/anno", "lookup_key_annuo": "pro_yearly",
     "features": ["Badge PRO e posizionamento in evidenza", "Preventivi illimitati",
                  "Richieste di tutte le categorie della tua zona",
                  "Priorita nelle ricerche dei privati"]},
]


async def _activate_pro(user_id: str, trial_days: int = 0):
    if not user_id:
        return
    updates = {"plan": "pro", "subscription_status": "active"}
    if trial_days:
        from datetime import timedelta
        updates.update({"trial_used": True, "subscription_status": "trialing",
                        "trial_ends_at": now() + timedelta(days=trial_days)})
    await db.aziende.update_one({"owner_id": user_id}, {"$set": updates})


async def _on_paid(record: dict):
    if not record:
        return
    if record.get("kind") == "caparra":
        from routes_prenotazioni import segna_caparra_pagata
        await segna_caparra_pagata(record["prenotazione_id"], record.get("stripe_payment_intent_id"))
    elif record.get("kind") == "crediti":
        if not record.get("credits_granted"):
            await grant_purchased(record.get("user_id"), int(record.get("crediti", 0)),
                                  meta={"package_id": record.get("package_id"), "session_id": record.get("session_id")})
            await payment_transactions.update_one({"session_id": record["session_id"]},
                                                  {"$set": {"credits_granted": True}})
    else:
        await _activate_pro(record.get("user_id"), record.get("trial_days", 0))


def _create_session(**kwargs):
    if TAX_MODE == "full":
        try:
            return stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
        except Exception as e:
            msg = (getattr(e, "user_message", "") or str(e)).lower()
            if "managed payments" in msg or "ineligible" in msg:
                return stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True},
                                                      billing_address_collection="required")
            raise
    if TAX_MODE == "calc_only":
        return stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True},
                                              billing_address_collection="required")
    return stripe.checkout.Session.create(**kwargs)


async def rimborsa_caparra(prenotazione: dict) -> dict:
    """Refunds the paid deposit of a booking through Stripe. Returns the refund dict."""
    pi = prenotazione.get("caparra_payment_intent")
    if not pi:
        rec = await payment_transactions.find_one({"kind": "caparra", "prenotazione_id": str(prenotazione["_id"]),
                                                   "payment_status": "paid"})
        pi = rec.get("stripe_payment_intent_id") if rec else None
    if not pi:
        raise HTTPException(status_code=400, detail="Pagamento della caparra non trovato: impossibile rimborsare automaticamente")
    try:
        refund = stripe.Refund.create(payment_intent=pi, metadata={"prenotazione_id": str(prenotazione["_id"])})
    except Exception as e:
        logger.exception("refund failed")
        raise HTTPException(status_code=502, detail=f"Rimborso Stripe non riuscito: {getattr(e, 'user_message', '') or str(e)}")
    await payment_transactions.update_one({"stripe_payment_intent_id": pi},
                                          {"$set": {"status": "refunded", "payment_status": "refunded",
                                                    "stripe_refund_id": refund.id, "updated_at": now()}})
    return {"id": refund.id, "status": refund.status}


async def create_caparra_session(prenotazione: dict, importo: float, user_id: str, origin_url: str):
    pid = str(prenotazione["_id"])
    session = _create_session(
        line_items=[{"quantity": 1, "price_data": {
            "currency": "eur", "unit_amount": int(round(importo * 100)),
            "product_data": {"name": f"Caparra noleggio: {prenotazione.get('annuncio_titolo', '')}",
                             "description": f"Periodo {prenotazione['dal']} - {prenotazione['al']} · {prenotazione.get('azienda_nome', '')}",
                             "tax_code": "txcd_20030000"},
        }}],
        mode="payment",
        success_url=f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&tipo=caparra",
        cancel_url=f"{origin_url}/dashboard",
        metadata={"user_id": user_id, "kind": "caparra", "prenotazione_id": pid},
    )
    await payment_transactions.insert_one({
        "session_id": session.id, "user_id": user_id, "kind": "caparra", "prenotazione_id": pid,
        "amount": int(round(importo * 100)), "currency": "eur",
        "status": "initiated", "payment_status": "pending", "created_at": now(), "updated_at": now(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


@router.get("/billing/plans")
async def list_plans():
    return {"plans": PLANS}


class CreditCheckoutIn(BaseModel):
    package_id: str
    origin_url: str


@router.post("/stripe/create-checkout-session")
async def create_credit_checkout(req: CreditCheckoutIn, user: dict = Depends(get_current_user)):
    pkg = PACKAGES.get(req.package_id)
    if not pkg:
        raise HTTPException(status_code=400, detail="Pacchetto crediti non valido")
    session = _create_session(
        line_items=[{"quantity": 1, "price_data": {
            "currency": "eur", "unit_amount": pkg["prezzo_cent"],
            "product_data": {"name": f"Pacchetto {pkg['nome']}: {pkg['crediti']} crediti CasaLavoroPRO",
                             "description": f"Ricarica wallet - {pkg['crediti']} crediti",
                             "tax_code": "txcd_10000000"},
        }}],
        mode="payment",
        success_url=f"{req.origin_url}/dashboard?crediti=ok&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/dashboard?crediti=annullato",
        metadata={"user_id": user["id"], "kind": "crediti",
                  "package_id": req.package_id, "crediti": str(pkg["crediti"])},
    )
    await payment_transactions.insert_one({
        "session_id": session.id, "user_id": user["id"], "kind": "crediti",
        "package_id": req.package_id, "crediti": pkg["crediti"],
        "amount": pkg["prezzo_cent"], "currency": "eur",
        "status": "initiated", "payment_status": "pending",
        "credits_granted": False, "created_at": now(), "updated_at": now(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


class CheckoutRequest(BaseModel):
    lookup_key: str
    quantity: int = Field(1, ge=1, le=100)
    origin_url: str


@router.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest, user: dict = Depends(require_roles("azienda"))):
    prices = stripe.Price.list(lookup_keys=[req.lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(status_code=500, detail=f"Prezzo non trovato: {req.lookup_key}")
    price = prices[0]
    trial_days = TRIAL_DAYS if (price.recurring and await trial_eligible(user["id"])) else 0
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": req.quantity}],
        mode="subscription" if price.recurring else "payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        metadata={"user_id": user["id"], "lookup_key": req.lookup_key, "trial_days": str(trial_days)},
    )
    if trial_days:
        kwargs["subscription_data"] = {"trial_period_days": trial_days}
        kwargs["payment_method_collection"] = "always"
    if TAX_MODE == "full":
        try:
            session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
        except InvalidRequestError as e:
            msg = (getattr(e, "user_message", "") or str(e)).lower()
            if "managed payments" in msg or "ineligible" in msg:
                session = stripe.checkout.Session.create(
                    **kwargs, automatic_tax={"enabled": True},
                    billing_address_collection="required")
            else:
                raise
        except Exception as e:
            msg = str(e).lower()
            if "managed payments" in msg or "ineligible" in msg:
                session = stripe.checkout.Session.create(
                    **kwargs, automatic_tax={"enabled": True},
                    billing_address_collection="required")
            else:
                raise
    elif TAX_MODE == "calc_only":
        session = stripe.checkout.Session.create(
            **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required")
    else:
        session = stripe.checkout.Session.create(**kwargs)

    await payment_transactions.insert_one({
        "session_id": session.id, "user_id": user["id"], "lookup_key": req.lookup_key, "trial_days": trial_days,
        "amount": (price.unit_amount or 0) * req.quantity, "currency": price.currency,
        "status": "initiated", "payment_status": "pending", "created_at": now(),
        "updated_at": now(),
    })
    return {"checkout_url": session.url, "session_id": session.id, "trial_days": trial_days}


@router.get("/billing/trial")
async def my_trial(user: dict = Depends(require_roles("azienda"))):
    return {"eligible": await trial_eligible(user["id"]), "days": TRIAL_DAYS}


@router.get("/payments/status/{session_id}")
async def get_status(session_id: str):
    record = await payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status in ("paid", "no_payment_required") or s.status == "complete":
                await payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "stripe_subscription_id": s.subscription,
                              "stripe_payment_intent_id": s.payment_intent,
                              "updated_at": now()}})
                record = await payment_transactions.find_one({"session_id": session_id})
                if record and record.get("payment_status") == "paid":
                    await _on_paid(record)
        except Exception:
            pass
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"], "kind": record.get("kind", "abbonamento")}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    obj, t = event["data"]["object"], event["type"]

    if t == "checkout.session.completed":
        res = await payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": "paid",
                      "stripe_subscription_id": obj.get("subscription"),
                      "stripe_payment_intent_id": obj.get("payment_intent"),
                      "updated_at": now()}})
        if res.modified_count:
            rec = await payment_transactions.find_one({"session_id": obj["id"]})
            await _on_paid(rec)
    elif t == "checkout.session.async_payment_succeeded":
        await payment_transactions.update_one({"session_id": obj["id"]},
                                        {"$set": {"payment_status": "paid", "updated_at": now()}})
    elif t == "checkout.session.async_payment_failed":
        await payment_transactions.update_one({"session_id": obj["id"]},
                                        {"$set": {"status": "failed", "payment_status": "failed",
                                                  "updated_at": now()}})
    elif t == "checkout.session.expired":
        await payment_transactions.update_one({"session_id": obj["id"]},
                                        {"$set": {"status": "expired", "payment_status": "expired",
                                                  "updated_at": now()}})
    elif t == "charge.refunded":
        await payment_transactions.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
                                        {"$set": {"status": "refunded", "payment_status": "refunded",
                                                  "updated_at": now()}})
    return {"status": "ok"}
