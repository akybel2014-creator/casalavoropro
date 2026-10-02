import os
import logging
import stripe
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, require_roles

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

PLANS = [
    {"id": "free", "nome": "Base", "prezzo": "Gratis",
     "features": ["Profilo azienda nella directory", "Ricevi richieste della tua categoria",
                  "Invia fino a 2 preventivi al mese"]},
    {"id": "pro", "nome": "Pro", "lookup_key": "pro_monthly", "prezzo": "29 EUR/mese",
     "prezzo_annuo": "290 EUR/anno", "lookup_key_annuo": "pro_yearly",
     "features": ["Badge PRO e posizionamento in evidenza", "Preventivi illimitati",
                  "Richieste di tutte le categorie della tua zona",
                  "Priorita nelle ricerche dei privati"]},
]


async def _activate_pro(user_id: str):
    if not user_id:
        return
    await db.aziende.update_one({"owner_id": user_id},
                                {"$set": {"plan": "pro", "subscription_status": "active"}})


@router.get("/billing/plans")
async def list_plans():
    return {"plans": PLANS}


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
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": req.quantity}],
        mode="subscription" if price.recurring else "payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        metadata={"user_id": user["id"], "lookup_key": req.lookup_key},
    )
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

    payment_transactions.insert_one({
        "session_id": session.id, "user_id": user["id"], "lookup_key": req.lookup_key,
        "amount": (price.unit_amount or 0) * req.quantity, "currency": price.currency,
        "status": "initiated", "payment_status": "pending", "created_at": now(),
        "updated_at": now(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


@router.get("/payments/status/{session_id}")
async def get_status(session_id: str):
    record = payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transazione non trovata")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "stripe_subscription_id": s.subscription,
                              "stripe_payment_intent_id": s.payment_intent,
                              "updated_at": now()}})
                record = payment_transactions.find_one({"session_id": session_id})
                if record and record.get("payment_status") == "paid":
                    await _activate_pro(record.get("user_id"))
        except Exception:
            pass
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"]}


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
        res = payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"),
                      "stripe_subscription_id": obj.get("subscription"),
                      "stripe_payment_intent_id": obj.get("payment_intent"),
                      "updated_at": now()}})
        if res.modified_count:
            rec = payment_transactions.find_one({"session_id": obj["id"]})
            if rec:
                await _activate_pro(rec.get("user_id"))
    elif t == "checkout.session.async_payment_succeeded":
        payment_transactions.update_one({"session_id": obj["id"]},
                                        {"$set": {"payment_status": "paid", "updated_at": now()}})
    elif t == "checkout.session.async_payment_failed":
        payment_transactions.update_one({"session_id": obj["id"]},
                                        {"$set": {"status": "failed", "payment_status": "failed",
                                                  "updated_at": now()}})
    elif t == "checkout.session.expired":
        payment_transactions.update_one({"session_id": obj["id"]},
                                        {"$set": {"status": "expired", "payment_status": "expired",
                                                  "updated_at": now()}})
    elif t == "charge.refunded":
        payment_transactions.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
                                        {"$set": {"status": "refunded", "payment_status": "refunded",
                                                  "updated_at": now()}})
    return {"status": "ok"}
