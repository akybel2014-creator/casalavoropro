"""Pipeline Agenti AI (Gemini 3.1) di CasaLavoroPRO.

- /api/analizza-bolletta: PDF bolletta -> Gemini 3.1 Pro (JSON strutturato) -> lead_in_attesa.
- /api/lead/{id}/risparmia: invia il lead al Broker Energetico Partner (webhook configurabile).
- /api/analizza-macchinario: foto attrezzo -> Gemini Flash (JSON pre-compilato per l'annuncio).
"""
import os
import io
import json
import uuid
import base64
import logging
import tempfile

import httpx
import qrcode
from bson import ObjectId
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Response
from dotenv import load_dotenv
from fpdf import FPDF

from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

from core import db, now, get_current_user, clean_doc, notify_admins
from credits import charge, effective_ruolo, refund_charge
from emailer import send_email, FRONTEND_URL, _wrap
from html import escape

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

logger = logging.getLogger(__name__)
router = APIRouter()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
GEMINI_BOLLETTA_MODEL = os.environ.get("GEMINI_BOLLETTA_MODEL", "gemini-3.1-pro-preview")
GEMINI_MACCHINARIO_MODEL = os.environ.get("GEMINI_MACCHINARIO_MODEL", "gemini-3-flash-preview")
BROKER_WEBHOOK_URL = os.environ.get("BROKER_WEBHOOK_URL", "")
BROKER_API_TOKEN = os.environ.get("BROKER_API_TOKEN", "")

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
    return await _gemini_json_multi(model, system_message, prompt, [(file_bytes, mime_type, suffix)])


async def _gemini_json_multi(model: str, system_message: str, prompt: str, items: list) -> dict:
    """items: lista di tuple (bytes, mime_type, suffix). Analizza piu file insieme."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Servizio AI non configurato")
    tmp_paths = []
    try:
        contents = []
        for file_bytes, mime_type, suffix in items:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file_bytes)
                tmp_paths.append(tmp.name)
            contents.append(FileContentWithMimeType(file_path=tmp_paths[-1], mime_type=mime_type))
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()),
                       system_message=system_message).with_model("gemini", model)
        resp = await chat.send_message(UserMessage(text=prompt, file_contents=contents))
        return _parse_json(resp)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Gemini call failed (%s)", model)
        raise HTTPException(status_code=502, detail="Analisi AI non riuscita, riprova piu tardi")
    finally:
        for p in tmp_paths:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
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
    '  "codice_pod": string,                // codice POD (luce), formato IT...; null se assente\n'
    '  "codice_pdr": string,                // codice PDR (gas); null se assente\n'
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


def _lat(s) -> str:
    return str("" if s is None else s).encode("latin-1", "replace").decode("latin-1")


def _s(v) -> str:
    return "" if v is None else str(v)


def _genera_pdf_report(dati: dict, cliente_nome: str, azienda_nome: str | None) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_margins(18, 18, 18)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(255, 90, 31)
    pdf.cell(0, 12, "CasaLavoroPRO", ln=1)
    pdf.set_text_color(40, 40, 40)
    pdf.set_font("Helvetica", "B", 15)
    pdf.cell(0, 10, "Report di Risparmio Energetico", ln=1)
    pdf.set_draw_color(255, 90, 31)
    pdf.set_line_width(0.8)
    pdf.line(18, pdf.get_y() + 1, 192, pdf.get_y() + 1)
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    if azienda_nome:
        pdf.cell(0, 7, _lat(f"Preparato da: {azienda_nome} con CasaLavoroPRO"), ln=1)
    pdf.cell(0, 7, _lat(f"Cliente: {cliente_nome}"), ln=1)
    pdf.cell(0, 7, _lat(f"Data: {now().strftime('%d/%m/%Y')}"), ln=1)
    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(11, 19, 43)
    pdf.cell(0, 9, "Dati rilevati dalla bolletta", ln=1)
    unita = _s(dati.get("unita_consumo"))
    costo = dati.get("costo_materia_prima")
    spesa = dati.get("spesa_annua_stimata")
    rows = [
        ("Fornitore attuale", _s(dati.get("fornitore"))),
        ("Tipo fornitura", _s(dati.get("tipo_fornitura"))),
        ("Consumo annuo stimato", f"{_s(dati.get('consumo_annuo'))} {unita}".strip()),
        ("Costo materia prima", f"{costo} EUR/{unita or 'u'}" if costo is not None else "-"),
        ("Spesa annua stimata", f"{spesa} EUR" if spesa is not None else "-"),
    ]
    for k, v in rows:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(60, 8, _lat(k + ":"))
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 8, _lat(v), ln=1)
    pdf.ln(6)
    risp = dati.get("risparmio_stimato_annuo")
    pdf.set_fill_color(255, 240, 225)
    pdf.set_draw_color(255, 90, 31)
    y = pdf.get_y()
    pdf.rect(18, y, 174, 26, style="DF")
    pdf.set_xy(18, y + 5)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(255, 90, 31)
    pdf.cell(174, 8, "RISPARMIO STIMATO", align="C", ln=1)
    pdf.set_x(18)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(11, 19, 43)
    pdf.cell(174, 10, _lat(f"EUR {risp} / anno" if risp is not None else "da valutare"), align="C", ln=1)
    pdf.ln(12)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(11, 19, 43)
    pdf.cell(0, 9, "Come attivare il risparmio", ln=1)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, _lat(
        "La stima e calcolata confrontando il costo della materia prima in bolletta con gli indici "
        "all'ingrosso PUN (luce) e PSV (gas) correnti. Per attivare l'offerta piu conveniente, conferma "
        "la pratica dall'app CasaLavoroPRO: un consulente dedicato ti ricontattera entro 24 ore per "
        "completare il passaggio al nuovo fornitore, senza interruzioni di fornitura."))
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(130, 130, 130)
    pdf.multi_cell(0, 5, _lat(
        "Documento informativo generato automaticamente da CasaLavoroPRO. I valori sono stime non vincolanti."))
    return bytes(pdf.output())


async def _invia_report_risparmio(user_id: str, dati: dict):
    """Genera il PDF co-brandizzato e lo invia via email all'utente che ha caricato la bolletta."""
    try:
        u = await db.users.find_one({"_id": ObjectId(user_id)}, {"email": 1, "name": 1, "role": 1})
        if not u or not u.get("email"):
            return
        azienda_nome = None
        if u.get("role") == "azienda":
            az = await db.aziende.find_one({"owner_id": user_id}, {"nome": 1})
            azienda_nome = (az or {}).get("nome")
        pdf_bytes = _genera_pdf_report(dati, u.get("name") or "Cliente", azienda_nome)
        att = [{"filename": "Report_Risparmio_CasaLavoroPRO.pdf",
                "content": base64.b64encode(pdf_bytes).decode()}]
        risp = dati.get("risparmio_stimato_annuo")
        risp_txt = f"EUR {risp} / anno" if risp is not None else "indicato nel report allegato"
        nome = escape(u.get("name") or "")
        body = (f'<p>Ciao {nome},</p>'
                f'<p>abbiamo analizzato la tua bolletta con l\'assistente AI di CasaLavoroPRO. '
                f'In allegato trovi il <strong>Report di Risparmio Energetico</strong> in PDF con il dettaglio della stima.</p>'
                f'<p>Risparmio stimato: <strong>{escape(str(risp_txt))}</strong>, calcolato sugli indici PUN/PSV correnti.</p>'
                f'<p>Per attivare il risparmio apri CasaLavoroPRO e conferma la pratica: un consulente dedicato ti ricontattera entro 24 ore.</p>')
        html = _wrap("Il tuo Report di Risparmio Energetico", body, "Vai a CasaLavoroPRO", FRONTEND_URL)
        await send_email(to=u["email"],
                         subject="Il tuo Report di Risparmio Energetico — Casalavoro Pro",
                         html=html, attachments=att)
    except Exception:
        logger.exception("Invio report risparmio via email fallito")


@router.post("/analizza-bolletta")
async def analizza_bolletta(background: BackgroundTasks, files: list[UploadFile] = File(...), user: dict = Depends(get_current_user)):
    if not files:
        raise HTTPException(status_code=400, detail="Nessun file caricato")
    items = []
    total = 0
    for f in files:
        if f.content_type == "application/pdf":
            mime, suffix = "application/pdf", ".pdf"
        elif f.content_type in IMG_MIME:
            mime = f.content_type
            suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[f.content_type]
        else:
            raise HTTPException(status_code=400, detail="Carica la bolletta in PDF oppure scatta una foto (JPG/PNG/WEBP)")
        data = await f.read()
        total += len(data)
        if total > MAX_UPLOAD:
            raise HTTPException(status_code=400, detail="File troppo grandi (max 15 MB in totale)")
        items.append((data, mime, suffix))

    # L'analisi e gratuita per tutti: l'eventuale credito viene scalato al momento dell'invio al broker ("Risparmia Ora").
    estratto = await _gemini_json_multi(GEMINI_BOLLETTA_MODEL, BOLLETTA_SYSTEM, BOLLETTA_PROMPT, items)

    lead_doc = {
        "user_id": user["id"], "tipo": "bolletta", "stato": "lead_in_attesa",
        "filename": files[0].filename, "pagine": len(items), "dati": estratto,
        "share_token": uuid.uuid4().hex,
        "created_at": now(), "inviato_broker": False,
    }
    res = await db.leads.insert_one(lead_doc)
    lead_doc["_id"] = res.inserted_id
    # Pipeline automatica: PDF report + email all'utente (in background, non blocca la risposta).
    background.add_task(_invia_report_risparmio, user["id"], estratto)
    return {"lead": clean_doc(lead_doc, drop=("user_id",))}


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
    if lead.get("inviato_broker"):
        raise HTTPException(status_code=409, detail="Pratica gia inviata")

    # Addebito: privato gratis; azienda (abbonata o pay-as-you-go) 1 credito, bonus prima (402 se saldo 0).
    charge_res = await charge(user, "analisi_bolletta", meta={"lead_id": str(oid)})

    u = await db.users.find_one({"_id": ObjectId(user["id"])}, {"email": 1, "name": 1, "telefono": 1})
    d = lead.get("dati", {})
    payload = {
        "lead_id": str(oid),
        "anagrafica": {"nome": (u or {}).get("name"), "email": (u or {}).get("email"),
                       "telefono": (u or {}).get("telefono")},
        "fornitore_attuale": d.get("fornitore"),
        "tipo_fornitura": d.get("tipo_fornitura"),
        "codice_pod": d.get("codice_pod"),
        "codice_pdr": d.get("codice_pdr"),
        "consumo_annuo_stimato": d.get("consumo_annuo"),
        "unita_consumo": d.get("unita_consumo"),
        "risparmio_stimato_annuo": d.get("risparmio_stimato_annuo"),
        "origine": "CasaLavoroPRO",
        "timestamp": now().isoformat(),
    }

    # Invio reale solo se URL + Bearer token configurati; altrimenti simulazione (demo).
    real = bool(BROKER_WEBHOOK_URL and BROKER_API_TOKEN)
    if real:
        try:
            async with httpx.AsyncClient(timeout=20) as cx:
                r = await cx.post(BROKER_WEBHOOK_URL, json=payload,
                                  headers={"Authorization": f"Bearer {BROKER_API_TOKEN}",
                                           "Content-Type": "application/json"})
                r.raise_for_status()
        except Exception:
            logger.exception("Invio lead al broker fallito")
            await refund_charge(user["id"], charge_res, "analisi_bolletta")
            raise HTTPException(status_code=502, detail="Invio al broker non riuscito, riprova piu tardi")
    else:
        logger.info("[SIMULAZIONE BROKER] lead %s -> %s", oid, json.dumps(payload)[:500])

    await db.leads.update_one({"_id": oid}, {"$set": {
        "stato": "inviato_broker", "inviato_broker": True, "charged": charge_res["charged"],
        "broker_simulato": not real, "inviato_at": now()}})
    return {"ok": True, "inviato": True, "simulato": not real, "charged": charge_res["charged"]}


class RichiestaPubblica(BaseModel):
    nome: str
    telefono: str
    email: str | None = None


def _public_summary(lead: dict) -> dict:
    d = lead.get("dati", {}) or {}
    return {
        "fornitore": d.get("fornitore"),
        "tipo_fornitura": d.get("tipo_fornitura"),
        "consumo_annuo": d.get("consumo_annuo"),
        "unita_consumo": d.get("unita_consumo"),
        "spesa_annua_stimata": d.get("spesa_annua_stimata"),
        "risparmio_stimato_annuo": d.get("risparmio_stimato_annuo"),
        "note": d.get("note"),
        "created_at": lead["created_at"].isoformat() if lead.get("created_at") else None,
    }


@router.get("/report/pubblico/{token}")
async def report_pubblico(token: str):
    """Riepilogo pubblico (senza dati sensibili) del risparmio stimato, condivisibile via link/QR."""
    lead = await db.leads.find_one({"share_token": token})
    if not lead:
        raise HTTPException(status_code=404, detail="Report non trovato o scaduto")
    nome = ""
    try:
        u = await db.users.find_one({"_id": ObjectId(lead["user_id"])}, {"name": 1})
        nome = ((u or {}).get("name") or "").strip().split(" ")[0]
    except Exception:
        pass
    out = _public_summary(lead)
    out["cliente_nome"] = nome
    return out


@router.get("/report/pubblico/{token}/qr.png")
async def report_pubblico_qr(token: str):
    """QR code PNG che punta alla pagina pubblica del report."""
    lead = await db.leads.find_one({"share_token": token}, {"_id": 1})
    if not lead:
        raise HTTPException(status_code=404, detail="Report non trovato")
    img = qrcode.make(f"{FRONTEND_URL}/r/{token}")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png",
                    headers={"Cache-Control": "public, max-age=86400"})


@router.post("/report/pubblico/{token}/richiedi")
async def richiedi_offerta_pubblica(token: str, body: RichiestaPubblica):
    """Cattura un nuovo lead da un visitatore che apre un report condiviso."""
    lead = await db.leads.find_one({"share_token": token})
    if not lead:
        raise HTTPException(status_code=404, detail="Report non trovato o scaduto")
    nome = (body.nome or "").strip()
    tel = (body.telefono or "").strip()
    if not nome or not tel:
        raise HTTPException(status_code=400, detail="Nome e telefono sono obbligatori")
    doc = {
        "user_id": lead["user_id"],
        "tipo": "richiesta_pubblica",
        "stato": "lead_in_attesa",
        "origine_share_token": token,
        "contatto": {"nome": nome, "telefono": tel,
                     "email": ((body.email or "").strip() or None)},
        "dati": lead.get("dati", {}),
        "created_at": now(),
        "inviato_broker": False,
    }
    await db.leads.insert_one(doc)
    await notify_admins(
        "Nuovo lead da report condiviso",
        f"{nome} ({tel}) ha richiesto un'offerta aprendo un report di risparmio condiviso.",
    )
    return {"ok": True}


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
