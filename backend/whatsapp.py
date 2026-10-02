import os
import logging
import httpx

logger = logging.getLogger(__name__)

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").rstrip("/")


def whatsapp_configured() -> bool:
    return bool(TWILIO_SID and TWILIO_TOKEN and TWILIO_FROM)


async def send_whatsapp_alert(to_phone: str, azienda_nome: str, titolo: str, zona: str) -> bool:
    """WhatsApp alert to a company for an urgent request. No-op (False) if Twilio is not configured."""
    if not whatsapp_configured():
        logger.info("WhatsApp skipped (Twilio non configurato): destinatario %s", to_phone)
        return False
    if not to_phone or not to_phone.startswith("+"):
        logger.info("WhatsApp skipped (numero non E.164): %s", to_phone)
        return False
    text = (
        "CasaLavoriPRO - Richiesta URGENTE\n"
        f"{azienda_nome}, un cliente cerca: {titolo} ({zona}).\n"
        f"Apri il pannello per inviare il tuo preventivo: {FRONTEND_URL}/dashboard/azienda"
    )
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json",
                auth=(TWILIO_SID, TWILIO_TOKEN),
                data={
                    "From": f"whatsapp:{TWILIO_FROM}",
                    "To": f"whatsapp:{to_phone}",
                    "Body": text,
                },
            )
        if resp.status_code >= 400:
            logger.error("WhatsApp send failed: %s %s", resp.status_code, resp.text)
            return False
        return True
    except Exception:
        logger.exception("WhatsApp send error")
        return False
