import logging
from core import db, now, hash_password

logger = logging.getLogger(__name__)

DEMO_AZIENDE = [
    {"email": "info@lampioniidraulica.it", "nome": "Lampioni Idraulica",
     "categorie": ["Idraulica", "Termoidraulica"], "zone": ["Torino", "Provincia di Torino"],
     "piva": "IT01234567890", "durc_number": "DURC-TOR-2211",
     "descrizione": "Interventi idraulici urgenti e programmati, riqualificazione impianti e "
                    "allacci. Squadra tecnica con oltre 20 anni di esperienza sui cantieri residenziali.",
     "telefono": "+39 011 2345678", "verified": True, "plan": "pro", "rating": 4.9, "recensioni": 87,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/6b6d81310a20a522499f503922b867e3b6cb9eeee831327e81c75ca861fa537a.jpeg"},
    {"email": "info@caloreeclima.it", "nome": "Calore & Clima Srl",
     "categorie": ["Termoidraulica", "Idraulica"], "zone": ["Milano", "Provincia di Milano"],
     "piva": "IT09876543210", "durc_number": "DURC-MIL-4477",
     "descrizione": "Installazione caldaie, climatizzazione e manutenzione impianti termici. "
                    "Centro assistenza autorizzato con intervento entro 24 ore.",
     "telefono": "+39 02 8765432", "verified": True, "plan": "pro", "rating": 4.8, "recensioni": 64,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/5a6c9120699640e32192e4e37419c7d5f89fd4e6162418e4841698fdcace5fc7.jpeg"},
    {"email": "info@voltinfrastructure.it", "nome": "Volt Infrastructure",
     "categorie": ["Elettricita"], "zone": ["Milano", "Monza"],
     "piva": "IT05566778899", "durc_number": "DURC-MIL-8123",
     "descrizione": "Impianti elettrici civili e terziario, colonnine ricarica auto elettriche, "
                    "consulenza energetica e messe a norma.",
     "telefono": "+39 02 3456781", "verified": True, "plan": "free", "rating": 4.7, "recensioni": 41,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/1877ad0a96faff19a8d75176dba1bf4bb8a137bd8e15442005fe1072d6e60fec.jpeg"},
    {"email": "info@edilnuovacostruzioni.it", "nome": "EdilNuova Costruzioni",
     "categorie": ["Edilizia", "Pavimenti"], "zone": ["Roma", "Provincia di Roma"],
     "piva": "IT04455667788", "durc_number": "DURC-ROM-9054",
     "descrizione": "Ristrutturazioni complete chiavi in mano, rinnovamento di appartamenti e "
                    "completamenti. Direzione cantiere interna con rendering di progetto.",
     "telefono": "+39 06 4567890", "verified": True, "plan": "pro", "rating": 4.9, "recensioni": 132,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/412015838948e0821f17d97bfab730f6bc9ac5c6d3ea103093ffb7ef2e873620.jpeg"},
    {"email": "info@colorartimbiancatura.it", "nome": "ColorArt Imbiancatura",
     "categorie": ["Imbiancatura"], "zone": ["Firenze", "Prato"],
     "piva": "IT02233445566", "durc_number": "DURC-FIR-3391",
     "descrizione": "Pittura decorativa, microcemento e tinteggiature. Partner di marchi "
                    "internazionali di pittura per finiture premium.",
     "telefono": "+39 055 123456", "verified": False, "plan": "free", "rating": 4.6, "recensioni": 18,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/46645c4432c780374001099cb158781ed489bffcaa8663586ae135f25d3d02c2.jpeg"},
    {"email": "info@verdemano.it", "nome": "VerdeMano Giardini",
     "categorie": ["Giardinaggio"], "zone": ["Bologna", "Provincia di Bologna"],
     "piva": "IT01122334455", "durc_number": "DURC-BLO-6620",
     "descrizione": "Progettazione e manutenzione giardini, irrigazione automatica, potature in "
                    "quota e allestimenti verde per condomini e villette.",
     "telefono": "+39 051 987654", "verified": True, "plan": "free", "rating": 4.8, "recensioni": 55,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/3c064825ca76dd73aad28df6860457c53b4fc5a375ffc15566bf9f209885f1b2.jpeg"},
    {"email": "info@pavimentitoscana.it", "nome": "Pavimenti Toscana",
     "categorie": ["Pavimenti", "Edilizia"], "zone": ["Firenze", "Siena"],
     "piva": "IT07788990011", "durc_number": "DURC-FIR-7781",
     "descrizione": "Posa di gres porcellanato, parquet e resine. Rimozione e rilievo umidita con "
                    "garanzia decennale sulle opere.",
     "telefono": "+39 055 445566", "verified": False, "plan": "free", "rating": 4.5, "recensioni": 12,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/19eb0ef01863a3194b00c919c5c5f6cd069a7fea92e99c651f1776b87c415b6b.jpeg"},
    {"email": "info@multiserviceitalia.it", "nome": "MultiService Italia",
     "categorie": ["Altri Servizi", "Edilizia"], "zone": ["Napoli", "Provincia di Napoli"],
     "piva": "IT06677889900", "durc_number": "DURC-NAP-1102",
     "descrizione": "Servizi multi-tecnici per la casa: traslochi, smaltimenti, interventi "
                    "manutentivi minori e piccola edilizia con team dedicato.",
     "telefono": "+39 081 765432", "verified": True, "plan": "free", "rating": 4.4, "recensioni": 29,
     "logo": "https://static.prod-images.emergentagent.com/jobs/e57fe9aa-18be-4843-83d5-91ca460e3cf5/images/e6e329953499fc6f657df342e717d71f51b80a6093cd5354ee8a2715b26023c9.jpeg"},
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
            "rating": a["rating"], "recensioni": a["recensioni"],
            "logo": a.get("logo", ""), "created_at": now(),
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


CITY_COORDS = {
    "torino": (45.0703, 7.6869), "provincia di torino": (45.0703, 7.6869),
    "milano": (45.4642, 9.19), "provincia di milano": (45.4642, 9.19),
    "monza": (45.5844, 9.2746), "roma": (41.9028, 12.4964),
    "provincia di roma": (41.9028, 12.4964), "firenze": (43.7696, 11.2558),
    "prato": (43.8807, 11.0964), "bologna": (44.4949, 11.3426),
    "provincia di bologna": (44.4949, 11.3426), "napoli": (40.8518, 14.2681),
    "provincia di napoli": (40.8518, 14.2681), "siena": (43.3188, 11.3308),
}


async def backfill_geo():
    """Idempotent: geolocates companies that don't have coordinates yet (demo cities)."""
    async for a in db.aziende.find({"location": {"$exists": False}}):
        for z in a.get("zone", []):
            key = str(z).strip().lower()
            if key in CITY_COORDS:
                lat, lng = CITY_COORDS[key]
                await db.aziende.update_one(
                    {"_id": a["_id"], "location": {"$exists": False}},
                    {"$set": {"location": {"type": "Point", "coordinates": [lng, lat]}}},
                )
                break


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



DEMO_ANNUNCI = [
    ("Lampioni Idraulica", "noleggio", "Miniescavatore 1,8 t cingolato", "Movimento terra", "Torino", 140, "giorno", None,
     "Miniescavatore con benna da 40 cm, ideale per scavi in giardino e allacci. Guidabile con patente B, consegna in cantiere inclusa in provincia.",
     "https://images.unsplash.com/photo-1759950345011-ee5a96640e00?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"),
    ("EdilNuova Costruzioni", "noleggio", "Betoniera 350 L elettrica", "Edilizia e betoniere", "Roma", 35, "giorno", None,
     "Betoniera professionale 230V da 350 litri, revisionata. Trasporto incluso nel comune di Roma.",
     "https://images.unsplash.com/photo-1770822662967-7f66605f9103?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"),
    ("EdilNuova Costruzioni", "noleggio", "Ponteggio modulare fino a 12 m", "Ponteggi e facciate", "Roma", 9, "mese", None,
     "Ponteggio multidirezionale certificato, montaggio e smontaggio a cura dei nostri operai abilitati. Prezzo al m² per mese.",
     "https://images.unsplash.com/photo-1616320999187-3c004dad4f0b?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"),
    ("Calore & Clima Srl", "noleggio", "Piattaforma aerea semovente 14 m", "Lavori in quota", "Milano", 190, "giorno", None,
     "Piattaforma a forbice elettrica, altezza di lavoro 14 m. Disponibile anche con operatore qualificato PLE.",
     "https://images.pexels.com/photos/34297398/pexels-photo-34297398.jpeg?auto=compress&cs=tinysrgb&w=800"),
    ("Lampioni Idraulica", "usato", "Kit trapani a batteria 18V", "Elettroutensili", "Torino", 180, "fisso", "Ottimo",
     "Due trapani avvitatori 18V con 2 batterie 4Ah, caricatore rapido e valigetta. Usati in cantiere per una stagione.",
     "https://images.unsplash.com/photo-1546827209-a218e99fdbe9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"),
    ("Calore & Clima Srl", "usato", "Smerigliatrice angolare 125 mm", "Elettroutensili", "Milano", 55, "fisso", "Buono",
     "Smerigliatrice 1.200 W con impugnatura antivibrazione, 10 dischi da taglio inclusi.",
     "https://images.unsplash.com/photo-1518709414768-a88981a4515d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"),
    ("EdilNuova Costruzioni", "usato", "Martello demolitore 11 kg SDS-Max", "Elettroutensili", "Roma", 320, "fisso", "Revisionato",
     "Demolitore 25 J revisionato dal centro assistenza, con punte e scalpelli. Garanzia 3 mesi.",
     "https://images.unsplash.com/photo-1689935421853-cb23a0bc92e4?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"),
    ("Calore & Clima Srl", "usato", "Banco da lavoro in acciaio con morsa", "Altro", "Milano", 240, "fisso", "Ottimo",
     "Banco 150 cm con piano in acciaio, morsa da 125 mm e due cassetti. Ritiro in sede.",
     "https://images.unsplash.com/photo-1530191601183-4de2969575ad?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"),
]


async def seed_annunci_demo():
    """Idempotent: creates demo rental/used listings for PRO demo companies if none exist."""
    if await db.annunci.count_documents({}) > 0:
        return
    for nome, tipo, titolo, cat, zona, prezzo, unita, stato, descr, img in DEMO_ANNUNCI:
        az = await db.aziende.find_one({"nome": nome})
        if not az:
            continue
        await db.annunci.insert_one({
            "tipo": tipo, "titolo": titolo, "descrizione": descr, "categoria": cat, "zona": zona,
            "prezzo": float(prezzo), "unita": unita, "stato": stato, "attivo": True,
            "azienda_id": str(az["_id"]), "azienda_nome": az["nome"], "azienda_verified": bool(az.get("verified")),
            "azienda_telefono": az.get("telefono", ""), "owner_id": az["owner_id"],
            "foto": [], "immagine_url": img, "created_at": now(),
        })
    logger.info("Demo annunci seeded")
