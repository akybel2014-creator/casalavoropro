"""Test della nuova logica Analisi Energetica: addebito al 'Risparmia', 402 a saldo 0, gratis privato.
Inserisce i lead direttamente nel DB per evitare chiamate Gemini (già testate altrove)."""
import os
import sys
import uuid
import asyncio

import httpx
from bson import ObjectId

sys.path.insert(0, "/app/backend")


def _base():
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().strip('"') + "/api"
    return "http://localhost:8001/api"


BASE = _base()


async def _mk_lead(db, user_id):
    r = await db.leads.insert_one({
        "user_id": user_id, "tipo": "bolletta", "stato": "lead_in_attesa",
        "filename": "b.pdf", "dati": {"fornitore": "ENEL", "consumo_annuo": 2700,
                                      "unita_consumo": "kWh", "risparmio_stimato_annuo": 90},
        "inviato_broker": False,
    })
    return str(r.inserted_id)


async def main():
    from core import db
    az_email = f"an_az_{uuid.uuid4().hex[:8]}@test.it"
    pv_email = f"an_pv_{uuid.uuid4().hex[:8]}@test.it"

    async with httpx.AsyncClient(base_url=BASE, timeout=30) as cx:
        # ---- AZIENDA (abbonata, 5 bonus) ----
        r = await cx.post("/auth/register", json={
            "name": "AZ", "email": az_email, "password": "password123", "ruolo": "azienda",
            "azienda": {"nome": "AZ SRL", "categorie": ["Edile"], "zone": ["Roma"]}})
        az_uid = r.json()["user"]["id"]

        # Upload gratuito -> wallet invariato (5)
        w = (await cx.get("/crediti/wallet")).json()
        assert w["saldo_crediti"] == 5, w
        print("OK upload non addebita (saldo resta 5)")

        # Risparmia -> scala 1 credito (bonus prima)
        lid = await _mk_lead(db, az_uid)
        r = await cx.post(f"/lead/{lid}/risparmia")
        assert r.status_code == 200 and r.json().get("charged") == 1, r.text
        w = (await cx.get("/crediti/wallet")).json()
        assert w["bonus_credits"] == 4 and w["saldo_crediti"] == 4, w
        print("OK Risparmia azienda: -1 credito dai bonus (bonus 5->4)")

        # Saldo 0 -> 402 + blocco
        await db.users.update_one({"_id": ObjectId(az_uid)},
                                  {"$set": {"bonus_credits": 0, "purchased_credits": 0}})
        lid2 = await _mk_lead(db, az_uid)
        r = await cx.post(f"/lead/{lid2}/risparmia")
        assert r.status_code == 402, f"atteso 402, {r.status_code} {r.text}"
        print("OK saldo 0 -> HTTP 402 (pop-up ricarica)")

    async with httpx.AsyncClient(base_url=BASE, timeout=30) as cx2:
        # ---- PRIVATO (sempre gratis) ----
        r = await cx2.post("/auth/register", json={
            "name": "PV", "email": pv_email, "password": "password123", "ruolo": "privato"})
        pv_uid = r.json()["user"]["id"]
        lid3 = await _mk_lead(db, pv_uid)
        r = await cx2.post(f"/lead/{lid3}/risparmia")
        assert r.status_code == 200 and r.json().get("charged") == 0, r.text
        print("OK Risparmia privato: invio gratuito (0 crediti)")

    print("\nTUTTI I TEST NUOVA LOGICA ANALISI PASSATI")


if __name__ == "__main__":
    asyncio.run(main())
