"""Migrazione iniziale: assegna `ruolo` e crediti agli utenti gia presenti nel database.

Logica (vedi credits.py):
  - privato            -> ruolo=privato, bonus_credits=0
  - azienda PRO attiva -> ruolo=azienda_abbonata, bonus_credits=5  (salvaguarda i PRO Founders)
  - azienda senza PRO  -> ruolo=azienda_pay_as_you_go, bonus_credits=0
  - admin              -> lasciato invariato (accesso libero gestito a runtime)

purchased_credits viene inizializzato a 0 solo se il campo non esiste gia (idempotente,
non azzera eventuali crediti acquistati). Rieseguibile in sicurezza.

Uso: cd /app/backend && set -a && source .env && set +a && python scripts/migrate_ruoli_crediti.py
"""
import os
import sys
import asyncio

sys.path.insert(0, "/app/backend")

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from credits import ruolo_from_azienda, MONTHLY_BONUS

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    stats = {"privato": 0, "azienda_abbonata": 0, "azienda_pay_as_you_go": 0, "admin": 0}

    async for u in db.users.find({}, {"role": 1}):
        uid = u["_id"]
        role = u.get("role")
        if role == "admin":
            stats["admin"] += 1
            continue
        if role == "privato":
            ruolo, bonus = "privato", 0
        else:
            az = await db.aziende.find_one({"owner_id": str(uid)},
                                           {"plan": 1, "subscription_status": 1, "trial_ends_at": 1})
            ruolo = ruolo_from_azienda(az)
            bonus = MONTHLY_BONUS if ruolo == "azienda_abbonata" else 0

        await db.users.update_one({"_id": uid}, {"$set": {"ruolo": ruolo, "bonus_credits": bonus}})
        # purchased_credits solo se mancante (non sovrascrive acquisti esistenti)
        await db.users.update_one(
            {"_id": uid, "purchased_credits": {"$exists": False}},
            {"$set": {"purchased_credits": 0}})
        stats[ruolo] += 1

    print("Migrazione completata:")
    for k, v in stats.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    asyncio.run(main())
