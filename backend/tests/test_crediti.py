"""Test end-to-end del sistema Wallet a Crediti (registrazione, wallet, consumo, 402)."""
import os
import sys
import uuid
import asyncio

import httpx

sys.path.insert(0, "/app/backend")


def _base():
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                return line.split("=", 1)[1].strip().strip('"') + "/api"
    return "http://localhost:8001/api"


BASE = _base()


async def main():
    email = f"credtest_{uuid.uuid4().hex[:8]}@test.it"
    async with httpx.AsyncClient(base_url=BASE, timeout=30) as cx:
        # 1) Registrazione azienda -> azienda_abbonata + 5 bonus
        r = await cx.post("/auth/register", json={
            "name": "Azienda Credit Test", "email": email, "password": "password123",
            "ruolo": "azienda", "azienda": {"nome": "Credit SRL", "categorie": ["Idraulico"], "zone": ["Milano"]},
        })
        assert r.status_code == 200, f"register: {r.status_code} {r.text}"
        user = r.json()["user"]
        assert user.get("ruolo") == "azienda_abbonata", f"ruolo errato: {user.get('ruolo')}"
        assert user.get("bonus_credits") == 5, f"bonus errato: {user.get('bonus_credits')}"
        print("OK registrazione: ruolo=azienda_abbonata, bonus=5")

        # 2) Wallet
        r = await cx.get("/crediti/wallet")
        w = r.json()
        assert w["saldo_crediti"] == 5 and w["gestionali_sbloccate"] is True, w
        print(f"OK wallet: saldo={w['saldo_crediti']}, gestionali sbloccate")

        # 3) Offerta STANDARD -> gratis per abbonata (charged 0)
        base_off = {"descrizione": "Cerchiamo idraulico esperto zona Milano",
                    "zona": "Milano", "tipo_contratto": "Full-time"}
        r = await cx.post("/offerte-lavoro", json={"titolo": "Idraulico Standard", **base_off})
        assert r.status_code == 200, f"offerta std: {r.status_code} {r.text}"
        assert r.json().get("crediti_addebitati") == 0, r.json()
        print("OK offerta standard gratis per abbonata (0 crediti)")

        # 4) Offerta IN EVIDENZA -> 5 crediti -> saldo 0
        r = await cx.post("/offerte-lavoro", json={"titolo": "Idraulico URGENTE", "in_evidenza": True, **base_off})
        assert r.status_code == 200 and r.json().get("crediti_addebitati") == 5, r.text
        w = (await cx.get("/crediti/wallet")).json()
        assert w["saldo_crediti"] == 0, w
        print("OK offerta in evidenza: addebitati 5 crediti, saldo=0")

        # 5) Altra offerta in evidenza con saldo 0 -> 402
        r = await cx.post("/offerte-lavoro", json={"titolo": "Altro URGENTE", "in_evidenza": True, **base_off})
        assert r.status_code == 402, f"atteso 402, ricevuto {r.status_code} {r.text}"
        assert "Ricarica" in r.json().get("detail", ""), r.json()
        print("OK saldo esaurito -> HTTP 402 'Ricarica il Wallet'")

        # 6) Stripe checkout pacchetto crediti -> URL
        r = await cx.post("/stripe/create-checkout-session",
                          json={"package_id": "prod_growth_50", "origin_url": "https://example.com"})
        assert r.status_code == 200 and r.json().get("checkout_url", "").startswith("https://"), r.text
        print("OK Stripe create-checkout-session (Growth 50) -> checkout_url generato")

    print("\nTUTTI I TEST CREDITI PASSATI")


if __name__ == "__main__":
    asyncio.run(main())
