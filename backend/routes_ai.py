"""Pipeline Agenti AI (Gemini 3.1) di CasaLavoroPRO.

- /api/analizza-bolletta: PDF bolletta -> Gemini 3.1 Pro (JSON strutturato) -> lead_in_attesa.
- /api/lead/{id}/risparmia: invia il lead al Broker Energetico Partner (webhook configurabile).
- /api/analizza-macchinario: foto attrezzo -> Gemini Flash (JSON pre-compilato per l'annuncio).
"""
import os
import json
import uuid
import logging
import tempfile

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from dotenv import load_dotenv

from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

from core import db, now, get_current_user, clean_doc
from credits import charge, effective_ruolo

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

logger = logging.getLogger(__name__)
router = APIRouter()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
GEMINI_BOLLETTA_MODEL = os.environ.get("GEMINI_BOLLETTA_MODEL", "gemini-3.1-pro-preview")
GEMINI_MACCHINARIO_MODEL = os.environ.get("GEMINI_MACCHINARIO_MODEL", "gemini-3-flash-preview")
BROKER_WEBHOOK_URL = os.environ.get("BROKER_WEBHOOK_URL", "")

MAX_UPLOAD = 15 * 1024 * 1024
IMG_MIME = {"image/jpeg", "image/png", "image/webp"}


def _parse_json(text: str) -> dict:
    """Estrae un oggetto JSON dalla risposta del modello (tollerante ai code-fence)."""
    t = (text or "").strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1] if "```" in t[3:] else t[3:]
        if t.lstrip().startswith("json"):
            t = t.lstrip()[4:]
    start, end = t.find("{"), t.rfind("}")
    if start != -1 and end != -1 and end > start:
        t = t[start:end + 1]
    try:
        return json.loads(t)
    except Exception:
        logger.warning("JSON non parsabile dalla risposta AI: %s", (text or "")[:300])
        raise HTTPException(status_code=502, detail="Risposta AI non interpretabile, riprova")


async def _gemini_json(model: str, system_message: str, prompt: str,
                       file_bytes: bytes, mime_type: str, suffix: str) -> dict:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Servizio AI non configurato")
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()),
                       system_message=system_message).with_model("gemini", model)
        file_content = FileContentWithMimeType(file_path=tmp_path, mime_type=mime_type)
        resp = await chat.send_message(UserMessage(text=prompt, file_contents=[file_content]))
        return _parse_json(resp)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Gemini call failed (%s)", model)
        raise HTTPException(status_code=502, detail="Analisi AI non riuscita, riprova piu tardi")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


BOLLETTA_SYSTEM = (
    "Sei un analista esperto di bollette energetiche italiane (luce e gas). "
    "Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo ne code fence."
)
BOLLETTA_PROMPT = (
    "Analizza la bolletta allegata ed estrai i dati nel seguente schema JSON:\n"
    "{\n"
    '  "fornitore": string,\n'
    '  "tipo_fornitura": "luce" | "gas" | "dual",\n'
    '  "consumo_annuo": number,            // kWh per la luce, Smc per il gas\n'
    '  "unita_consumo": "kWh" | "Smc",\n'
    '  "costo_materia_prima": number,       // EUR/kWh o EUR/Smc attuale in bolletta\n'
    '  "spesa_annua_stimata": number,       // EUR totali stimati all\'anno\n'
    '  "risparmio_stimato_annuo": number,   // EUR risparmiabili stimati vs indici PUN (luce) / PSV (gas) correnti\n'
    '  "note": string\n'
    "}\n"
    "Se un dato non e deducibile usa null. Stima il risparmio confrontando il costo materia prima "
    "in bolletta con gli indici all'ingrosso PUN/PSV correnti tipici del mercato italiano."
)

MACCHINARIO_SYSTEM = (
    "Sei un perito esperto di attrezzature edili, macchinari e utensili per il noleggio/usato. "
    "Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo ne code fence."
)
MACCHINARIO_PROMPT = (
    "Analizza la foto dell'attrezzo/macchinario allegata e pre-compila un annuncio nel seguente schema JSON:\n"
    "{\n"
    '  "titolo_suggerito": string,       // breve e commerciale, in italiano\n'
    '  "categoria": string,              // es. Escavatori, Betoniere, Utensili elettrici, Ponteggi\n'
    '  "stato_usura": "Nuovo" | "Ottimo" | "Buono" | "Usurato" | "Da revisionare",\n'
    '  "descrizione_breve": string,      // 1-2 frasi\n'
    '  "tag_ricerca": [string]           // 3-6 parole chiave per la ricerca\n'
    "}"
)


@router.post("/analizza-bolletta")
async def analizza_bolletta(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Carica la bolletta in formato PDF")
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(status_code=400, detail="File troppo grande (max 15 MB)")

    # Privato = gratis; azienda = 1 credito (bolletta extra oltre i bonus).
    charge_res = await charge(user, "analisi_bolletta", meta={"file": file.filename})

    estratto = await _gemini_json(GEMINI_BOLLETTA_MODEL, BOLLETTA_SYSTEM, BOLLETTA_PROMPT,
                                  data, "application/pdf", ".pdf")

    lead_doc = {
        "user_id": user["id"], "tipo": "bolletta", "stato": "lead_in_attesa",
        "filename": file.filename, "dati": estratto,
        "charged": charge_res["charged"], "created_at": now(), "inviato_broker": False,
    }
    res = await db.leads.insert_one(lead_doc)
    lead_doc["_id"] = res.inserted_id
    return {"lead": clean_doc(lead_doc, drop=("user_id",)), "charged": charge_res["charged"]}


@router.get("/lead/mine")
async def miei_lead(user: dict = Depends(get_current_user)):
    docs = await db.leads.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return [clean_doc(d, drop=("user_id",)) for d in docs]


@router.post("/lead/{lead_id}/risparmia")
async def invia_lead_broker(lead_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(lead_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Lead non trovato")
    lead = await db.leads.find_one({"_id": oid, "user_id": user["id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead non trovato")

    u = await db.users.find_one({"_id": ObjectId(user["id"])}, {"email": 1, "name": 1})
    payload = {
        "lead_id": str(oid), "cliente": {"nome": (u or {}).get("name"), "email": (u or {}).get("email")},
        "dati_bolletta": lead.get("dati", {}), "origine": "CasaLavoroPRO",
        "timestamp": now().isoformat(),
    }

    inviato = False
    if BROKER_WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=15) as cx:
                r = await cx.post(BROKER_WEBHOOK_URL, json=payload)
                r.raise_for_status()
            inviato = True
        except Exception:
            logger.exception("Invio lead al broker fallito")
            raise HTTPException(status_code=502, detail="Invio al broker non riuscito, riprova")
    else:
        # Nessun broker configurato: invio simulato (lead marcato come inviato).
        logger.info("[SIMULAZIONE BROKER] lead %s -> payload=%s", oid, json.dumps(payload)[:500])
        inviato = True

    await db.leads.update_one({"_id": oid}, {"$set": {
        "stato": "inviato_broker", "inviato_broker": True,
        "broker_simulato": not bool(BROKER_WEBHOOK_URL), "inviato_at": now()}})
    return {"ok": True, "inviato": inviato, "simulato": not bool(BROKER_WEBHOOK_URL)}


@router.post("/analizza-macchinario")
async def analizza_macchinario(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if (await effective_ruolo(user)) == "privato":
        raise HTTPException(status_code=403, detail="Funzione riservata alle aziende")
    if file.content_type not in IMG_MIME:
        raise HTTPException(status_code=400, detail="Formato immagine non supportato (JPG, PNG o WEBP)")
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(status_code=400, detail="Immagine troppo grande (max 15 MB)")
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[file.content_type]
    estratto = await _gemini_json(GEMINI_MACCHINARIO_MODEL, MACCHINARIO_SYSTEM, MACCHINARIO_PROMPT,
                                  data, file.content_type, ext)
    return {"suggerimenti": estratto}
