import logging
from typing import Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, azienda_for_user, notify
from emailer import send_new_quote, send_quote_accepted
from whatsapp import send_whatsapp_alert

logger = logging.getLogger(__name__)
router = APIRouter()


def _oid(s: str):
    try:
        return ObjectId(s)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Elemento non trovato")


class RichiestaIn(BaseModel):
    titolo: str = Field(min_length=5, max_length=120)
    categoria: str = Field(min_length=2)
    zona: str = Field(min_length=2, max_length=80)
    budget: Optional[str] = None
    descrizione: str = Field(min_length=10, max_length=2000)
    urgente: bool = False


class RispostaIn(BaseModel):
    prezzo: float = Field(gt=0)
    messaggio: str = Field(min_length=10, max_length=2000)
    durata_giorni: int = Field(ge=1, le=365)


@router.post("/richieste")
async def create_richiesta(inp: RichiestaIn, user: dict = Depends(require_roles("privato"))):
    doc = {
        "client_id": user["id"], "client_name": user["name"],
        "titolo": inp.titolo.strip(), "categoria": inp.categoria.strip(),
        "zona": inp.zona.strip(), "budget": inp.budget or "",
        "descrizione": inp.descrizione.strip(), "urgente": inp.urgente,
        "stato": "aperta", "risposte_count": 0, "created_at": now(),
    }
    res = await db.richieste.insert_one(doc)
    out = clean_doc(doc)
    out["id"] = str(res.inserted_id)

    matching = db.aziende.find({"categorie": inp.categoria.strip()})
    async for a in matching:
        if inp.urgente and a.get("emergenze"):
            phone = a.get("emergenze_telefono") or a.get("telefono") or ""
            try:
                await send_whatsapp_alert(phone, a.get("nome", ""), inp.titolo.strip(), inp.zona.strip())
            except Exception:
                logger.exception("whatsapp alert failed")
        await notify(a["owner_id"],
                     "Richiesta URGENTE di preventivo" if inp.urgente else "Nuova richiesta di preventivo",
                     f"{user['name']} cerca: {inp.titolo.strip()} ({inp.zona.strip()})",
                     link="/dashboard/azienda")
    return out


@router.get("/richieste/mine")
async def my_richieste(user: dict = Depends(require_roles("privato"))):
    reqs = await db.richieste.find({"client_id": user["id"]}) \
        .sort("created_at", -1).to_list(100)
    out = []
    for r in reqs:
        rid = str(r["_id"])
        risposte = await db.risposte.find({"richiesta_id": rid}).sort("created_at", -1).to_list(50)
        item = clean_doc(r)
        item["id"] = rid
        item["risposte"] = [clean_doc(x) for x in risposte]
        rec = await db.recensioni.find_one({"richiesta_id": rid})
        item["recensione"] = clean_doc(rec) if rec else None
        out.append(item)
    return out


@router.get("/richieste/feed")
async def feed_aziende(user: dict = Depends(require_roles("azienda"))):
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    query = {"stato": {"$ne": "chiusa"}}
    if azienda.get("categorie"):
        query["categoria"] = {"$in": azienda["categorie"]}
    mie_risposte = await db.risposte.find({"azienda_id": str(azienda["_id"])}).to_list(300)
    responded = {r["richiesta_id"]: str(r["_id"]) for r in mie_risposte}
    from bson import ObjectId as _OID
    responded_ids = [_OID(k) for k in responded if len(k) == 24]
    full_query = {"$or": [query, {"_id": {"$in": responded_ids}}]}
    reqs = await db.richieste.find(full_query).sort("created_at", -1).to_list(100)
    out = []
    for r in reqs:
        item = clean_doc(r)
        item["id"] = str(r["_id"])
        item["risposto"] = str(r["_id"]) in responded
        item["risposta_id"] = responded.get(str(r["_id"]))
        out.append(item)
    return out


@router.post("/richieste/{richiesta_id}/risposte")
async def send_risposta(richiesta_id: str, inp: RispostaIn,
                        user: dict = Depends(require_roles("azienda"))):
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    req = await db.richieste.find_one({"_id": _oid(richiesta_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    if req.get("stato") == "chiusa":
        raise HTTPException(status_code=400, detail="Richiesta gia chiusa")
    existing = await db.risposte.find_one({"richiesta_id": richiesta_id,
                                           "azienda_id": str(azienda["_id"])})
    if existing:
        raise HTTPException(status_code=400, detail="Hai gia inviato un preventivo per questa richiesta")

    doc = {
        "richiesta_id": richiesta_id, "azienda_id": str(azienda["_id"]),
        "azienda_nome": azienda.get("nome", ""), "azienda_verified": azienda.get("verified", False),
        "prezzo": inp.prezzo, "messaggio": inp.messaggio.strip(),
        "durata_giorni": inp.durata_giorni, "stato": "inviata", "created_at": now(),
    }
    await db.risposte.insert_one(doc)
    out = clean_doc(doc)
    out["id"] = str(doc["_id"])
    await db.richieste.update_one({"_id": req["_id"]},
                                  {"$inc": {"risposte_count": 1},
                                   "$set": {"stato": "in_lavorazione"}})
    await notify(req["client_id"], "Nuovo preventivo ricevuto",
                 f"{azienda.get('nome', '')} ha inviato un preventivo per: {req.get('titolo', '')}",
                 link="/dashboard")
    client = await db.users.find_one({"_id": _oid(req["client_id"])})
    if client:
        try:
            await send_new_quote(client["email"], client.get("name", ""),
                                 azienda.get("nome", ""), inp.prezzo)
        except Exception:
            logger.exception("quote email failed")
    return clean_doc(doc)


@router.get("/richieste/{richiesta_id}/risposte")
async def list_risposte(richiesta_id: str, user: dict = Depends(require_roles("privato", "admin"))):
    req = await db.richieste.find_one({"_id": _oid(richiesta_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    if user["role"] != "admin" and req["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    docs = await db.risposte.find({"richiesta_id": richiesta_id}) \
        .sort("created_at", -1).to_list(50)
    return [clean_doc(x) for x in docs]


@router.post("/risposte/{risposta_id}/accetta")
async def accetta_risposta(risposta_id: str, user: dict = Depends(require_roles("privato"))):
    risposta = await db.risposte.find_one({"_id": _oid(risposta_id)})
    if not risposta:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    req = await db.richieste.find_one({"_id": _oid(risposta["richiesta_id"])})
    if not req or req["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Permesso negato")
    if req.get("stato") == "chiusa":
        raise HTTPException(status_code=400, detail="Richiesta gia chiusa")

    await db.risposte.update_one({"_id": risposta["_id"]}, {"$set": {"stato": "accettata"}})
    await db.risposte.update_many({"richiesta_id": risposta["richiesta_id"],
                                   "_id": {"$ne": risposta["_id"]}},
                                  {"$set": {"stato": "rifiutata"}})
    await db.richieste.update_one({"_id": req["_id"]},
                                  {"$set": {"stato": "chiusa",
                                            "risposta_accettata": str(risposta["_id"])}})
    azienda = await db.aziende.find_one({"_id": _oid(risposta["azienda_id"])})
    if azienda:
        await notify(azienda["owner_id"], "Preventivo accettato",
                     f"Il cliente ha accettato il tuo preventivo per: {req.get('titolo', '')}",
                     link="/dashboard/azienda")
        owner = await db.users.find_one({"_id": _oid(azienda["owner_id"])})
        if owner:
            try:
                await send_quote_accepted(owner["email"], azienda.get("nome", ""),
                                          req.get("titolo", ""))
            except Exception:
                logger.exception("accepted email failed")
    return {"ok": True}
