"""Test: accredito crediti via _on_paid (webhook Stripe) + pipeline AI Gemini (bolletta + macchinario)."""
import os
import sys
import io
import uuid
import asyncio

import httpx
from bson import ObjectId
from PIL import Image, ImageDraw

sys.path.insert(0, "/app/backend")


def _base():
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().strip('"') + "/api"
    return "http://localhost:8001/api"


BASE = _base()


async def test_webhook_grant():
    from core import db
    from routes_billing import _on_paid, payment_transactions
    uid = str((await db.users.insert_one({"name": "Payg", "role": "azienda", "ruolo": "azienda_pay_as_you_go",
                                          "bonus_credits": 0, "purchased_credits": 0}))).__str__()
    # fix: inserted_id
    u = await db.users.find_one({"name": "Payg", "ruolo": "azienda_pay_as_you_go"}, sort=[("_id", -1)])
    uid = str(u["_id"])
    sid = f"cs_test_{uuid.uuid4().hex}"
    await payment_transactions.insert_one({"session_id": sid, "user_id": uid, "kind": "crediti",
                                           "package_id": "prod_growth_50", "crediti": 50,
                                           "payment_status": "paid", "credits_granted": False})
    rec = await payment_transactions.find_one({"session_id": sid})
    await _on_paid(rec)
    u2 = await db.users.find_one({"_id": ObjectId(uid)})
    assert u2.get("purchased_credits") == 50, f"atteso 50, trovato {u2.get('purchased_credits')}"
    # idempotenza
    rec = await payment_transactions.find_one({"session_id": sid})
    await _on_paid(rec)
    u3 = await db.users.find_one({"_id": ObjectId(uid)})
    assert u3.get("purchased_credits") == 50, "accredito NON idempotente"
    await db.users.delete_one({"_id": ObjectId(uid)})
    await payment_transactions.delete_one({"session_id": sid})
    print("OK webhook Stripe: +50 purchased_credits, idempotente")


def _fake_bill_pdf() -> bytes:
    img = Image.new("RGB", (900, 1200), "white")
    d = ImageDraw.Draw(img)
    testo = ["ENEL ENERGIA - Bolletta Luce", "Cliente: Mario Rossi",
             "Consumo annuo: 2700 kWh", "Prezzo energia: 0,135 EUR/kWh",
             "Spesa totale anno: 780,00 EUR", "Mercato libero"]
    for i, t in enumerate(testo):
        d.text((50, 80 + i * 60), t, fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PDF")
    return buf.getvalue()


def _fake_tool_image() -> bytes:
    img = Image.new("RGB", (800, 600), (210, 180, 60))
    d = ImageDraw.Draw(img)
    d.rectangle([200, 150, 600, 450], fill=(255, 193, 7), outline=(60, 60, 60), width=8)
    d.rectangle([350, 60, 450, 150], fill=(60, 60, 60))
    d.text((250, 500), "Mini escavatore", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


async def test_ai():
    email = f"aitest_{uuid.uuid4().hex[:8]}@test.it"
    async with httpx.AsyncClient(base_url=BASE, timeout=120) as cx:
        await cx.post("/auth/register", json={
            "name": "AI Azienda", "email": email, "password": "password123",
            "ruolo": "azienda", "azienda": {"nome": "AI SRL", "categorie": ["Edile"], "zone": ["Roma"]}})

        # Bolletta (PDF) -> Gemini 3.1 Pro structured JSON
        r = await cx.post("/analizza-bolletta",
                          files={"file": ("bolletta.pdf", _fake_bill_pdf(), "application/pdf")})
        assert r.status_code == 200, f"bolletta: {r.status_code} {r.text}"
        dati = r.json()["lead"]["dati"]
        assert isinstance(dati, dict) and "fornitore" in dati, dati
        print(f"OK analizza-bolletta: fornitore={dati.get('fornitore')} consumo={dati.get('consumo_annuo')} "
              f"risparmio={dati.get('risparmio_stimato_annuo')}")

        # Lead salvato e invio al broker (simulato)
        leads = (await cx.get("/lead/mine")).json()
        assert leads and leads[0]["stato"] == "lead_in_attesa", leads
        lid = leads[0]["id"]
        r = await cx.post(f"/lead/{lid}/risparmia")
        assert r.status_code == 200 and r.json().get("simulato") is True, r.text
        print("OK lead salvato come 'lead_in_attesa' + invio broker simulato")

        # Macchinario (immagine) -> Gemini Flash structured JSON
        r = await cx.post("/analizza-macchinario",
                          files={"file": ("tool.jpg", _fake_tool_image(), "image/jpeg")})
        assert r.status_code == 200, f"macchinario: {r.status_code} {r.text}"
        sug = r.json()["suggerimenti"]
        assert "titolo_suggerito" in sug and "categoria" in sug, sug
        print(f"OK analizza-macchinario: titolo='{sug.get('titolo_suggerito')}' categoria='{sug.get('categoria')}'")


async def main():
    await test_webhook_grant()
    await test_ai()
    print("\nTUTTI I TEST WEBHOOK + AI PASSATI")


if __name__ == "__main__":
    asyncio.run(main())
