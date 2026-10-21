import re
import logging
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, notify
from subscription import PRO_ACTIVE_STATES, TRIAL_STATES
from emailer import send_verification_result
from routes_annunci import TIPI, UNITA, STATI_USATO, CATEGORIE_ANNUNCI

logger = logging.getLogger(__name__)
router = APIRouter()

SUB_MONTHLY_CENTS = 399
SUB_YEARLY_CENTS = 3999


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Utente non trovato")


class VerificaIn(BaseModel):
    azione: str  # verificata | rifiutata


class RoleIn(BaseModel):
    role: str | None = None


class SuspendIn(BaseModel):
    suspended: bool


class AdminAziendaIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    categorie: List[str] = []
    zone: List[str] = []
    piva: Optional[str] = ""
    descrizione: Optional[str] = ""
    telefono: Optional[str] = ""
    sito: Optional[str] = ""
    logo: Optional[str] = ""
    rating: float = Field(0.0, ge=0, le=5)
    recensioni: int = Field(0, ge=0)
    verified: bool = True


class AdminAnnuncioIn(BaseModel):
    tipo: str
    titolo: str = Field(min_length=3, max_length=120)
    descrizione: str = Field(min_length=10, max_length=2000)
    categoria: str
    sottocategoria: Optional[str] = None
    zona: str = Field(min_length=2, max_length=80)
    prezzo: float = Field(gt=0, le=1_000_000)
    unita: str = "giorno"
    stato: Optional[str] = None
    immagine_url: Optional[str] = ""
    azienda_id: Optional[str] = None
    azienda_nome: Optional[str] = ""
    azienda_telefono: Optional[str] = ""


@router.post("/admin/aziende")
async def admin_crea_azienda(inp: AdminAziendaIn, user: dict = Depends(require_roles("admin"))):
    """Inserimento manuale di un'azienda nella directory/marketplace (senza account di login)."""
    verified = bool(inp.verified)
    doc = {
        "owner_id": "", "nome": inp.nome.strip(), "categorie": inp.categorie, "zone": inp.zone,
        "piva": (inp.piva or "").strip(), "descrizione": (inp.descrizione or "").strip(),
        "telefono": (inp.telefono or "").strip(), "sito": (inp.sito or "").strip(),
        "logo": (inp.logo or "").strip(), "durc_number": "", "docs": [],
        "verified": verified, "verification_status": "verificata" if verified else "none",
        "verified_at": now() if verified else None,
        "plan": "free", "subscription_status": "none", "founder50": False,
        "trial_used": False, "trial_ends_at": None,
        "emergenze": False, "emergenze_weekend": False, "emergenze_notturno": False, "emergenze_telefono": "",
        "rating": float(inp.rating), "recensioni": int(inp.recensioni),
        "created_by_admin": True, "created_at": now(),
    }
    res = await db.aziende.insert_one(doc)
    out = clean_doc(doc)
    out["id"] = str(res.inserted_id)
    return out


@router.post("/admin/annunci")
async def admin_crea_annuncio(inp: AdminAnnuncioIn, user: dict = Depends(require_roles("admin"))):
    """Inserimento manuale di un annuncio/macchinario nel marketplace (noleggio o usato)."""
    if inp.tipo not in TIPI:
        raise HTTPException(status_code=400, detail="Tipo annuncio non valido (noleggio/usato)")
    if inp.categoria not in CATEGORIE_ANNUNCI:
        raise HTTPException(status_code=400, detail="Categoria non valida")
    sotto = inp.sottocategoria or None
    if sotto and sotto not in CATEGORIE_ANNUNCI.get(inp.categoria, []):
        raise HTTPException(status_code=400, detail="Sottocategoria non valida per la categoria scelta")
    unita = inp.unita
    stato = inp.stato
    if inp.tipo == "usato":
        unita = "fisso"
        if stato and stato not in STATI_USATO:
            raise HTTPException(status_code=400, detail="Stato dell'usato non valido")
        stato = stato or "Buono"
    else:
        if unita not in UNITA:
            raise HTTPException(status_code=400, detail="Unità di prezzo non valida")
        stato = None

    azienda_nome = (inp.azienda_nome or "").strip()
    azienda_telefono = (inp.azienda_telefono or "").strip()
    azienda_verified = False
    azienda_id = (inp.azienda_id or "").strip()
    if azienda_id:
        try:
            az = await db.aziende.find_one({"_id": ObjectId(azienda_id)})
        except (InvalidId, TypeError):
            az = None
        if az:
            azienda_nome = azienda_nome or az.get("nome", "")
            azienda_verified = bool(az.get("verified"))
            azienda_telefono = azienda_telefono or az.get("telefono", "")

    doc = {
        "tipo": inp.tipo, "titolo": inp.titolo.strip(), "descrizione": inp.descrizione.strip(),
        "categoria": inp.categoria, "sottocategoria": sotto, "zona": inp.zona.strip(),
        "prezzo": float(inp.prezzo), "unita": unita, "stato": stato, "attivo": True,
        "azienda_id": azienda_id, "azienda_nome": azienda_nome,
        "azienda_verified": azienda_verified, "azienda_telefono": azienda_telefono,
        "owner_id": "", "immagine_url": (inp.immagine_url or "").strip(), "foto": [],
        "created_by_admin": True, "created_at": now(),
    }
    res = await db.annunci.insert_one(doc)
    out = clean_doc(doc, drop=("owner_id",))
    out["id"] = str(res.inserted_id)
    return out


@router.get("/admin/aziende")
async def admin_list_aziende(user: dict = Depends(require_roles("admin"))):
    docs = await db.aziende.find({}).sort("created_at", -1).to_list(300)
    out = []
    for d in docs:
        item = clean_doc(d)
        owner = None
        if d.get("owner_id"):
            try:
                owner = await db.users.find_one({"_id": ObjectId(d["owner_id"])})
            except Exception:
                owner = None
        item["owner_email"] = owner.get("email", "") if owner else ""
        out.append(item)
    return out


@router.post("/admin/aziende/{azienda_id}/verifica")
async def admin_verifica_azienda(azienda_id: str, inp: VerificaIn,
                                 user: dict = Depends(require_roles("admin"))):
    try:
        oid = ObjectId(azienda_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    azienda = await db.aziende.find_one({"_id": oid})
    if not azienda:
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    if inp.azione not in ("verificata", "rifiutata"):
        raise HTTPException(status_code=400, detail="Azione non valida")

    verificata = inp.azione == "verificata"
    await db.aziende.update_one({"_id": oid},
                                {"$set": {"verification_status": inp.azione,
                                          "verified": verificata,
                                          "verified_at": now() if verificata else None}})
    await notify(azienda["owner_id"],
                 "Azienda verificata" if verificata else "Verifica non superata",
                 (f"Complimenti: {azienda.get('nome', '')} e ora un'Azienda Verificata PRO."
                  if verificata else
                  f"La verifica di {azienda.get('nome', '')} non e stata superata. "
                  f"Controlla i documenti e riprova."),
                 link="/dashboard/azienda") if azienda.get("owner_id") else None
    owner = None
    if azienda.get("owner_id"):
        try:
            owner = await db.users.find_one({"_id": ObjectId(azienda["owner_id"])})
        except (InvalidId, TypeError):
            owner = None
    if owner:
        try:
            await send_verification_result(owner["email"], azienda.get("nome", ""), verificata)
        except Exception:
            logger.exception("verification email failed")
    return {"ok": True, "verification_status": inp.azione}


@router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_roles("admin"))):
    return {
        "utenti": await db.users.count_documents({}),
        "aziende": await db.aziende.count_documents({}),
        "aziende_verificate": await db.aziende.count_documents({"verified": True}),
        "richieste": await db.richieste.count_documents({}),
        "risposte": await db.risposte.count_documents({}),
        "abbonamenti_pro": await db.aziende.count_documents({"plan": "pro"}),
    }


@router.get("/admin/metrics")
async def admin_metrics(user: dict = Depends(require_roles("admin"))):
    """Metriche di business: MRR stimato (abbonamenti e prove) e utenti per piano."""
    mrr_cents = 0
    active_subs = 0
    async for az in db.aziende.find({"subscription_status": {"$in": list(PRO_ACTIVE_STATES)}}, {"owner_id": 1}):
        oid = az.get("owner_id")
        if not oid:
            continue
        active_subs += 1
        tx = await db.payment_transactions.find_one(
            {"user_id": oid, "payment_status": "paid", "lookup_key": {"$exists": True}},
            sort=[("created_at", -1)])
        if tx and tx.get("lookup_key") == "pro_yearly":
            mrr_cents += round(SUB_YEARLY_CENTS / 12)
        else:
            mrr_cents += SUB_MONTHLY_CENTS

    trial_subs = await db.aziende.count_documents({"subscription_status": {"$in": list(TRIAL_STATES)}})
    pro_subs = await db.aziende.count_documents({"subscription_status": "active"})
    privati = await db.users.count_documents({"role": "privato"})
    aziende_tot = await db.users.count_documents({"role": "azienda"})
    utenti_tot = await db.users.count_documents({})
    aziende_free = max(0, aziende_tot - pro_subs - trial_subs)
    return {
        "mrr_cents": mrr_cents, "mrr_eur": round(mrr_cents / 100, 2),
        "active_subscriptions": active_subs,
        "trial_subscriptions": trial_subs,
        "counts": {
            "privati": privati, "aziende_pro": pro_subs, "aziende_trial": trial_subs,
            "aziende_free": aziende_free, "aziende_totali": aziende_tot, "totale": utenti_tot,
        },
    }


@router.get("/admin/users")
async def admin_users(q: str = "", user: dict = Depends(require_roles("admin"))):
    """Ricerca utenti/artigiani per email o nome (max 100)."""
    query = {}
    if q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query = {"$or": [{"email": rx}, {"name": rx}]}
    docs = await db.users.find(query).sort("created_at", -1).to_list(100)
    out = []
    for d in docs:
        item = clean_doc(d)
        az = await db.aziende.find_one({"owner_id": item["id"]},
                                       {"nome": 1, "plan": 1, "subscription_status": 1})
        item["azienda_nome"] = (az or {}).get("nome")
        item["plan"] = (az or {}).get("plan")
        item["subscription_status"] = (az or {}).get("subscription_status")
        item["suspended"] = bool(d.get("suspended", False))
        out.append(item)
    return out


@router.patch("/admin/users/{user_id}/role")
async def admin_set_role(user_id: str, inp: RoleIn, user: dict = Depends(require_roles("admin"))):
    """Modifica il tipo di account (role) di un utente."""
    oid = _oid(user_id)
    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if inp.role is None:
        raise HTTPException(status_code=400, detail="Nessun valore da aggiornare")
    if inp.role not in ("privato", "azienda", "admin"):
        raise HTTPException(status_code=400, detail="Ruolo non valido")
    await db.users.update_one({"_id": oid}, {"$set": {"role": inp.role}})
    return {"ok": True, "role": inp.role}


@router.patch("/admin/users/{user_id}/suspend")
async def admin_suspend(user_id: str, inp: SuspendIn, user: dict = Depends(require_roles("admin"))):
    """Sospende o riattiva un account (blocco per violazioni)."""
    oid = _oid(user_id)
    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Non puoi sospendere un amministratore")
    await db.users.update_one({"_id": oid}, {"$set": {"suspended": bool(inp.suspended)}})
    return {"ok": True, "suspended": bool(inp.suspended)}
