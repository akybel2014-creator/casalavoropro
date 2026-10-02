import logging
from core import db, now, hash_password

logger = logging.getLogger(__name__)

DEMO_AZIENDE = [
    {"email": "info@lampioniidraulica.it", "nome": "Lampioni Idraulica",
     "categorie": ["Idraulica", "Termoidraulica"], "zone": ["Torino", "Provincia di Torino"],
     "piva": "IT01234567890", "durc_number": "DURC-TOR-2211",
     "descrizione": "Interventi idraulici urgenti e programmati, riqualificazione impianti e "
                    "allacci. Squadra tecnica con oltre 20 anni di esperienza sui cantieri residenziali.",
     "telefono": "+39 011 2345678", "verified": True, "plan": "pro", "rating": 4.9, "recensioni": 87},
    {"email": "info@caloreeclima.it", "nome": "Calore & Clima Srl",
     "categorie": ["Termoidraulica", "Idraulica"], "zone": ["Milano", "Provincia di Milano"],
     "piva": "IT09876543210", "durc_number": "DURC-MIL-4477",
     "descrizione": "Installazione caldaie, climatizzazione e manutenzione impianti termici. "
                    "Centro assistenza autorizzato con intervento entro 24 ore.",
     "telefono": "+39 02 8765432", "verified": True, "plan": "pro", "rating": 4.8, "recensioni": 64},
    {"email": "info@voltinfrastructure.it", "nome": "Volt Infrastructure",
     "categorie": ["Elettricita"], "zone": ["Milano", "Monza"],
     "piva": "IT05566778899", "durc_number": "DURC-MIL-8123",
     "descrizione": "Impianti elettrici civili e terziario, colonnine ricarica auto elettriche, "
                    "consulenza energetica e messe a norma.",
     "telefono": "+39 02 3456781", "verified": True, "plan": "free", "rating": 4.7, "recensioni": 41},
    {"email": "info@edilnuovacostruzioni.it", "nome": "EdilNuova Costruzioni",
     "categorie": ["Edilizia", "Pavimenti"], "zone": ["Roma", "Provincia di Roma"],
     "piva": "IT04455667788", "durc_number": "DURC-ROM-9054",
     "descrizione": "Ristrutturazioni complete chiavi in mano, rinnovamento di appartamenti e "
                    "completamenti. Direzione cantiere interna con rendering di progetto.",
     "telefono": "+39 06 4567890", "verified": True, "plan": "pro", "rating": 4.9, "recensioni": 132},
    {"email": "info@colorartimbiancatura.it", "nome": "ColorArt Imbiancatura",
     "categorie": ["Imbiancatura"], "zone": ["Firenze", "Prato"],
     "piva": "IT02233445566", "durc_number": "DURC-FIR-3391",
     "descrizione": "Pittura decorativa, microcemento e tinteggiature. Partner di marchi "
                    "internazionali di pittura per finiture premium.",
     "telefono": "+39 055 123456", "verified": False, "plan": "free", "rating": 4.6, "recensioni": 18},
    {"email": "info@verdemano.it", "nome": "VerdeMano Giardini",
     "categorie": ["Giardinaggio"], "zone": ["Bologna", "Provincia di Bologna"],
     "piva": "IT01122334455", "durc_number": "DURC-BLO-6620",
     "descrizione": "Progettazione e manutenzione giardini, irrigazione automatica, potature in "
                    "quota e allestimenti verde per condomini e villette.",
     "telefono": "+39 051 987654", "verified": True, "plan": "free", "rating": 4.8, "recensioni": 55},
    {"email": "info@pavimentitoscana.it", "nome": "Pavimenti Toscana",
     "categorie": ["Pavimenti", "Edilizia"], "zone": ["Firenze", "Siena"],
     "piva": "IT07788990011", "durc_number": "DURC-FIR-7781",
     "descrizione": "Posa di gres porcellanato, parquet e resine. Rimozione e rilievo umidita con "
                    "garanzia decennale sulle opere.",
     "telefono": "+39 055 445566", "verified": False, "plan": "free", "rating": 4.5, "recensioni": 12},
    {"email": "info@multiserviceitalia.it", "nome": "MultiService Italia",
     "categorie": ["Altri Servizi", "Edilizia"], "zone": ["Napoli", "Provincia di Napoli"],
     "piva": "IT06677889900", "durc_number": "DURC-NAP-1102",
     "descrizione": "Servizi multi-tecnici per la casa: traslochi, smaltimenti, interventi "
                    "manutentivi minori e piccola edilizia con team dedicato.",
     "telefono": "+39 081 765432", "verified": True, "plan": "free", "rating": 4.4, "recensioni": 29},
]

DEMO_PASSWORD = "Demo2026!"


async def seed_demo_data():
    if await db.aziende.count_documents({}) > 0:
        return
    logger.info("Seeding demo marketplace data...")

    for a in DEMO_AZIENDE:
        if await db.users.find_one({"email": a["email"]}):
            continue
        ures = await db.users.insert_one({
            "email": a["email"], "password_hash": hash_password(DEMO_PASSWORD),
            "name": a["nome"], "role": "azienda", "created_at": now(),
        })
        await db.aziende.insert_one({
            "owner_id": str(ures.inserted_id), "nome": a["nome"],
            "categorie": a["categorie"], "zone": a["zone"],
            "piva": a["piva"], "durc_number": a["durc_number"],
            "descrizione": a["descrizione"], "telefono": a["telefono"], "sito": "",
            "docs": [], "verified": a["verified"],
            "verification_status": "verificata" if a["verified"] else "in_attesa",
            "plan": a["plan"], "subscription_status": "active" if a["plan"] == "pro" else "none",
            "rating": a["rating"], "recensioni": a["recensioni"], "created_at": now(),
        })

    if not await db.users.find_one({"email": "mario.rossi@example.com"}):
        ures = await db.users.insert_one({
            "email": "mario.rossi@example.com", "password_hash": hash_password(DEMO_PASSWORD),
            "name": "Mario Rossi", "role": "privato", "created_at": now(),
        })
        client_id = str(ures.inserted_id)

        r1 = await db.richieste.insert_one({
            "client_id": client_id, "client_name": "Mario Rossi",
            "titolo": "Sostituzione caldaia in appartamento",
            "categoria": "Termoidraulica", "zona": "Milano",
            "budget": "2.000 - 3.000 EUR",
            "descrizione": "Caldaia da 24 kW da sostituire in appartamento di 90 mq, "
                           "con manutenzione straordinaria dei radiatori inclusa nel lavoro.",
            "stato": "in_lavorazione", "risposte_count": 1, "created_at": now(),
        })
        calore = await db.aziende.find_one({"nome": "Calore & Clima Srl"})
        if calore:
            await db.risposte.insert_one({
                "richiesta_id": str(r1.inserted_id), "azienda_id": str(calore["_id"]),
                "azienda_nome": calore["nome"], "azienda_verified": True,
                "prezzo": 2450.0, "durata_giorni": 3,
                "messaggio": "Buongiorno Mario, includiamo caldaia a condensazione 24 kW, "
                             "smaltimento della vecchia unita e collaudo. Intervento in 3 giorni.",
                "stato": "inviata", "created_at": now(),
            })

        await db.richieste.insert_one({
            "client_id": client_id, "client_name": "Mario Rossi",
            "titolo": "Allaccio idrico per lavanderia",
            "categoria": "Idraulica", "zona": "Torino",
            "budget": "300 - 600 EUR",
            "descrizione": "Serve un nuovo allaccio idraulico con scarico per una lavanderia "
                           "sotto scala, percorrenza tubi circa 6 metri.",
            "stato": "aperta", "risposte_count": 0, "created_at": now(),
        })

    logger.info("Demo data seeded: %s aziende", len(DEMO_AZIENDE))


EMERGENZE_BACKFILL = {
    "Lampioni Idraulica": (True, True, True, "+39 335 111 2233"),
    "Calore & Clima Srl": (True, True, False, "+39 335 222 3344"),
    "Volt Infrastructure": (True, False, True, "+39 335 333 4455"),
    "EdilNuova Costruzioni": (True, True, True, "+39 335 444 5566"),
    "ColorArt Imbiancatura": (False, False, False, ""),
    "VerdeMano Giardini": (False, True, False, ""),
    "Pavimenti Toscana": (False, False, False, ""),
    "MultiService Italia": (True, True, False, "+39 335 777 8899"),
}


async def backfill_emergenze():
    """Idempotent: adds emergency availability flags to companies that don't have them yet."""
    for nome, (em, wk, nt, tel) in EMERGENZE_BACKFILL.items():
        await db.aziende.update_one(
            {"nome": nome, "emergenze": {"$exists": False}},
            {"$set": {"emergenze": em, "emergenze_weekend": wk,
                      "emergenze_notturno": nt, "emergenze_telefono": tel}},
        )
