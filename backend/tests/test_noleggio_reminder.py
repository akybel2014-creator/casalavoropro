"""Test del promemoria consegna noleggio (cron noleggio-reminder)."""
import os
import asyncio
from datetime import date, timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


async def _run():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    domani = (date.today() + timedelta(days=1)).isoformat()
    dopodomani = (date.today() + timedelta(days=2)).isoformat()

    # Utenti fittizi
    cid = (await db.users.insert_one({"name": "Cliente Test", "email": "rem_cli@test.it", "role": "privato"})).inserted_id
    oid = (await db.users.insert_one({"name": "Azienda Test", "email": "rem_az@test.it", "role": "azienda"})).inserted_id

    base = {
        "annuncio_titolo": "Betoniera Test", "azienda_nome": "Edil Test",
        "client_id": str(cid), "client_name": "Cliente Test", "owner_id": str(oid),
        "giorni": 2, "totale": 100.0, "al": dopodomani,
    }
    # 1) confermata, dal=domani -> deve ricevere promemoria
    p1 = (await db.prenotazioni.insert_one({**base, "stato": "confermata", "dal": domani})).inserted_id
    # 2) confermata, dal=dopodomani -> NON deve ricevere
    p2 = (await db.prenotazioni.insert_one({**base, "stato": "confermata", "dal": dopodomani})).inserted_id
    # 3) richiesta (non confermata), dal=domani -> NON deve ricevere
    p3 = (await db.prenotazioni.insert_one({**base, "stato": "richiesta", "dal": domani})).inserted_id

    # Esegui la logica cron direttamente
    import sys
    sys.path.insert(0, "/app/backend")
    from routes_cron import _run_noleggio_reminder
    await _run_noleggio_reminder()

    d1 = await db.prenotazioni.find_one({"_id": p1})
    d2 = await db.prenotazioni.find_one({"_id": p2})
    d3 = await db.prenotazioni.find_one({"_id": p3})

    assert d1.get("reminder_consegna_sent") is True, "p1 (confermata, domani) doveva ricevere il promemoria"
    assert d2.get("reminder_consegna_sent") is not True, "p2 (dopodomani) NON doveva ricevere"
    assert d3.get("reminder_consegna_sent") is not True, "p3 (richiesta) NON doveva ricevere"

    # Idempotenza: seconda esecuzione non invia di nuovo (nessun crash)
    await _run_noleggio_reminder()

    # cleanup
    await db.prenotazioni.delete_many({"_id": {"$in": [p1, p2, p3]}})
    await db.users.delete_many({"_id": {"$in": [cid, oid]}})
    print("OK: promemoria consegna noleggio funziona correttamente")


if __name__ == "__main__":
    asyncio.run(_run())
