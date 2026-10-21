import re
import logging
import uuid as uuidlib
import httpx
from urllib.parse import urlparse
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, Field
from core import db, now, clean_doc, require_roles, notify
from subscription import PRO_ACTIVE_STATES, TRIAL_STATES
from emailer import send_verification_result
from routes_annunci import TIPI, UNITA, STATI_USATO, CATEGORIE_ANNUNCI, MAX_FOTO_ANNUNCIO
from routes_gallery import _put_object, ALLOWED, MAX_SIZE, APP_NAME, EMERGENT_KEY, optimize_image

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


def _admin_oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Elemento non trovato")


class AdminAziendaUpdateIn(BaseModel):
    nome: Optional[str] = None
    categorie: Optional[List[str]] = None
    zone: Optional[List[str]] = None
    piva: Optional[str] = None
    descrizione: Optional[str] = None
    telefono: Optional[str] = None
    sito: Optional[str] = None
    logo: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    recensioni: Optional[int] = Field(None, ge=0)
    verified: Optional[bool] = None


class AdminAnnuncioUpdateIn(BaseModel):
    titolo: Optional[str] = Field(None, min_length=3, max_length=120)
    descrizione: Optional[str] = Field(None, min_length=10, max_length=2000)
    categoria: Optional[str] = None
    sottocategoria: Optional[str] = None
    zona: Optional[str] = Field(None, min_length=2, max_length=80)
    prezzo: Optional[float] = Field(None, gt=0, le=1_000_000)
    unita: Optional[str] = None
    stato: Optional[str] = None
    immagine_url: Optional[str] = None
    attivo: Optional[bool] = None


@router.put("/admin/aziende/{azienda_id}")
async def admin_modifica_azienda(azienda_id: str, inp: AdminAziendaUpdateIn, user: dict = Depends(require_roles("admin"))):
    oid = _admin_oid(azienda_id)
    az = await db.aziende.find_one({"_id": oid})
    if not az:
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    data = inp.model_dump(exclude_none=True)
    update = {}
    for k in ("nome", "piva", "descrizione", "telefono", "sito", "logo"):
        if k in data:
            update[k] = (data[k] or "").strip() if isinstance(data[k], str) else data[k]
    for k in ("categorie", "zone", "rating", "recensioni"):
        if k in data:
            update[k] = data[k]
    if "verified" in data:
        update["verified"] = bool(data["verified"])
        update["verification_status"] = "verificata" if data["verified"] else "none"
        update["verified_at"] = now() if data["verified"] else None
    if update:
        await db.aziende.update_one({"_id": oid}, {"$set": update})
    fresh = await db.aziende.find_one({"_id": oid})
    return clean_doc(fresh)


@router.delete("/admin/aziende/{azienda_id}")
async def admin_elimina_azienda(azienda_id: str, user: dict = Depends(require_roles("admin"))):
    oid = _admin_oid(azienda_id)
    az = await db.aziende.find_one({"_id": oid})
    if not az:
        raise HTTPException(status_code=404, detail="Azienda non trovata")
    az_id_str = str(oid)
    await db.annunci.delete_many({"azienda_id": az_id_str})
    await db.recensioni.delete_many({"azienda_id": az_id_str})
    await db.preferiti.delete_many({"azienda_id": az_id_str})
    await db.aziende.delete_one({"_id": oid})
    # Rimuove anche l'account di login collegato, se presente.
    owner_id = az.get("owner_id")
    if owner_id:
        try:
            await db.users.delete_one({"_id": ObjectId(owner_id)})
        except (InvalidId, TypeError):
            pass
    return {"ok": True}


@router.put("/admin/annunci/{annuncio_id}")
async def admin_modifica_annuncio(annuncio_id: str, inp: AdminAnnuncioUpdateIn, user: dict = Depends(require_roles("admin"))):
    oid = _admin_oid(annuncio_id)
    ann = await db.annunci.find_one({"_id": oid})
    if not ann:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    data = inp.model_dump(exclude_none=True)
    update = {}
    for k in ("titolo", "descrizione", "zona", "immagine_url"):
        if k in data:
            update[k] = (data[k] or "").strip()
    if "prezzo" in data:
        update["prezzo"] = float(data["prezzo"])
    if "attivo" in data:
        update["attivo"] = bool(data["attivo"])
    categoria = data.get("categoria", ann.get("categoria"))
    if "categoria" in data:
        if categoria not in CATEGORIE_ANNUNCI:
            raise HTTPException(status_code=400, detail="Categoria non valida")
        update["categoria"] = categoria
    if "sottocategoria" in data:
        sotto = data["sottocategoria"] or None
        if sotto and sotto not in CATEGORIE_ANNUNCI.get(categoria, []):
            raise HTTPException(status_code=400, detail="Sottocategoria non valida")
        update["sottocategoria"] = sotto
    if ann.get("tipo") == "noleggio" and "unita" in data:
        if data["unita"] not in UNITA:
            raise HTTPException(status_code=400, detail="Unità non valida")
        update["unita"] = data["unita"]
    if ann.get("tipo") == "usato" and "stato" in data:
        if data["stato"] and data["stato"] not in STATI_USATO:
            raise HTTPException(status_code=400, detail="Stato non valido")
        update["stato"] = data["stato"] or "Buono"
    if update:
        await db.annunci.update_one({"_id": oid}, {"$set": update})
    fresh = await db.annunci.find_one({"_id": oid})
    return clean_doc(fresh, drop=("owner_id",))


@router.delete("/admin/annunci/{annuncio_id}")
async def admin_elimina_annuncio(annuncio_id: str, user: dict = Depends(require_roles("admin"))):
    oid = _admin_oid(annuncio_id)
    ann = await db.annunci.find_one({"_id": oid})
    if not ann:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    for f in ann.get("foto", []):
        await db.files.update_one({"path": f.get("path")}, {"$set": {"is_deleted": True}})
    await db.annunci.delete_one({"_id": oid})
    return {"ok": True}


@router.post("/admin/annunci/{annuncio_id}/foto")
async def admin_upload_foto_annuncio(annuncio_id: str, files: List[UploadFile] = File(...),
                                     user: dict = Depends(require_roles("admin"))):
    oid = _admin_oid(annuncio_id)
    ann = await db.annunci.find_one({"_id": oid})
    if not ann:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    if EMERGENT_KEY is None:
        raise HTTPException(status_code=503, detail="Storage non configurato")
    existing = ann.get("foto", [])
    if len(existing) + len(files) > MAX_FOTO_ANNUNCIO:
        raise HTTPException(status_code=400, detail=f"Massimo {MAX_FOTO_ANNUNCIO} foto per annuncio")
    uploaded = []
    for file in files:
        if file.content_type not in ALLOWED:
            raise HTTPException(status_code=400, detail="Formato non supportato: usa JPG, PNG o WEBP")
        data = await file.read()
        if len(data) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Immagine troppo grande (max 5 MB)")
        opt_data, opt_ct, opt_ext = optimize_image(data)
        path = f"{APP_NAME}/annunci/{oid}/{uuidlib.uuid4()}.{opt_ext}"
        try:
            result = _put_object(path, opt_data, opt_ct)
        except Exception:
            logger.exception("admin upload annuncio failed")
            raise HTTPException(status_code=502, detail="Upload non riuscito, riprova")
        entry = {"id": str(uuidlib.uuid4()), "path": result["path"], "filename": file.filename, "created_at": now()}
        await db.files.insert_one({**entry, "owner_id": user["id"], "is_deleted": False,
                                   "is_public": True, "content_type": opt_ct})
        uploaded.append(entry)
    await db.annunci.update_one({"_id": oid}, {"$push": {"foto": {"$each": uploaded}}})
    fresh = await db.annunci.find_one({"_id": oid})
    return clean_doc(fresh, drop=("owner_id",))


class FotoUrlIn(BaseModel):
    urls: List[str] = Field(..., min_length=1, max_length=50)


@router.post("/admin/annunci/{annuncio_id}/foto-url")
async def admin_add_foto_annuncio_url(annuncio_id: str, inp: FotoUrlIn,
                                      user: dict = Depends(require_roles("admin"))):
    """Aggiunge foto a un macchinario partendo da una lista di URL immagine
    (incollati manualmente o estratti da un CSV lato frontend). Scarica, ottimizza
    in WebP e salva nello storage, come l'upload diretto di file."""
    oid = _admin_oid(annuncio_id)
    ann = await db.annunci.find_one({"_id": oid})
    if not ann:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    if EMERGENT_KEY is None:
        raise HTTPException(status_code=503, detail="Storage non configurato")

    # Pulizia/deduplica degli URL preservando l'ordine
    seen, urls = set(), []
    for raw in inp.urls:
        u = (raw or "").strip()
        parsed = urlparse(u)
        if parsed.scheme in ("http", "https") and parsed.netloc and u not in seen:
            seen.add(u)
            urls.append(u)
    if not urls:
        raise HTTPException(status_code=400, detail="Nessun URL valido (usa http/https)")

    existing = ann.get("foto", [])
    disponibili = MAX_FOTO_ANNUNCIO - len(existing)
    if disponibili <= 0:
        raise HTTPException(status_code=400, detail=f"Limite di {MAX_FOTO_ANNUNCIO} foto gia raggiunto")

    uploaded, errori = [], []
    async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
        for u in urls:
            if len(uploaded) >= disponibili:
                errori.append({"url": u, "motivo": f"limite {MAX_FOTO_ANNUNCIO} foto raggiunto"})
                continue
            try:
                resp = await client.get(u, headers={"User-Agent": "CasaLavoroPRO/1.0"})
                resp.raise_for_status()
                data = resp.content
            except Exception:
                errori.append({"url": u, "motivo": "download non riuscito"})
                continue
            if len(data) > MAX_SIZE:
                errori.append({"url": u, "motivo": "immagine troppo grande (max 5 MB)"})
                continue
            opt_data, opt_ct, opt_ext = optimize_image(data)
            if opt_ct not in ALLOWED:
                errori.append({"url": u, "motivo": "formato non supportato"})
                continue
            path = f"{APP_NAME}/annunci/{oid}/{uuidlib.uuid4()}.{opt_ext}"
            try:
                result = _put_object(path, opt_data, opt_ct)
            except Exception:
                logger.exception("admin add foto-url failed")
                errori.append({"url": u, "motivo": "salvataggio non riuscito"})
                continue
            fname = (urlparse(u).path.rsplit("/", 1)[-1] or "foto")[:120]
            entry = {"id": str(uuidlib.uuid4()), "path": result["path"],
                     "filename": fname, "created_at": now()}
            await db.files.insert_one({**entry, "owner_id": user["id"], "is_deleted": False,
                                       "is_public": True, "content_type": opt_ct})
            uploaded.append(entry)

    if uploaded:
        await db.annunci.update_one({"_id": oid}, {"$push": {"foto": {"$each": uploaded}}})
    fresh = await db.annunci.find_one({"_id": oid})
    out = clean_doc(fresh, drop=("owner_id",))
    out["aggiunte"] = len(uploaded)
    out["errori"] = errori
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
