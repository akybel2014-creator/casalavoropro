import asyncio
from datetime import timedelta

from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

from bson import ObjectId  # noqa: E402
from core import db, now  # noqa: E402
import routes_cron  # noqa: E402


async def _mk_azienda(email, days_left):
    u = await db.users.insert_one({"email": email, "name": "Tester", "role": "azienda", "created_at": now()})
    uid = str(u.inserted_id)
    a = await db.aziende.insert_one({
        "owner_id": uid, "nome": "CronTest Srl", "categorie": ["Idraulica"], "zone": ["Milano"],
        "plan": "pro", "subscription_status": "active_trial", "trial_used": True,
        "trial_ends_at": now() + timedelta(days=days_left), "created_at": now(),
    })
    return uid, a.inserted_id


async def main():
    # --- Test EXPIRE: trial scaduto (-1 giorno) ---
    uid1, aid1 = await _mk_azienda("cronexp@example.com", -1)
    await routes_cron._run_offer_expire()
    a1 = await db.aziende.find_one({"_id": aid1})
    assert a1["plan"] == "free" and a1["subscription_status"] == "trial_expired", f"EXPIRE FAIL: {a1}"
    print("EXPIRE OK -> plan=%s status=%s" % (a1["plan"], a1["subscription_status"]))

    # Azienda ancora valida (futuro) non deve essere toccata
    uid2, aid2 = await _mk_azienda("cronvalid@example.com", 30)
    await routes_cron._run_offer_expire()
    a2 = await db.aziende.find_one({"_id": aid2})
    assert a2["subscription_status"] == "active_trial", f"EXPIRE SHOULD SKIP: {a2}"
    print("EXPIRE SKIP OK (valida intatta)")

    # --- Test REMINDER: 3 giorni rimanenti, email deliverable ---
    uid3, aid3 = await _mk_azienda("deliverable-placeholder@example.com", 3)
    await db.users.update_one({"_id": ObjectId(uid3)}, {"$set": {"email": "delivered@resend.dev"}})
    await routes_cron._run_offer_reminder()
    a3 = await db.aziende.find_one({"_id": aid3})
    assert 7 in a3.get("offerta_reminders_sent", []), f"REMINDER FAIL: {a3}"
    print("REMINDER OK -> sent=%s" % a3.get("offerta_reminders_sent"))

    # Idempotenza: secondo giro non deve ri-aggiungere/duplicare
    await routes_cron._run_offer_reminder()
    a3b = await db.aziende.find_one({"_id": aid3})
    assert a3b.get("offerta_reminders_sent") == a3.get("offerta_reminders_sent"), "REMINDER NOT IDEMPOTENT"
    print("REMINDER IDEMPOTENT OK")

    # cleanup
    for uid in (uid1, uid2, uid3):
        await db.users.delete_one({"_id": ObjectId(uid)})
    for aid in (aid1, aid2, aid3):
        await db.aziende.delete_one({"_id": aid})
    print("CLEANUP OK")
    print("ALL CRON TESTS PASSED")


if __name__ == "__main__":
    asyncio.run(main())
