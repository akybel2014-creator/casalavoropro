import os
import re
import ipaddress
import logging
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from fastapi import HTTPException

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").rstrip("/")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> str | None:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        return None


def _wrap(title: str, body_html: str, cta_text: str = "", cta_href: str = "") -> str:
    cta = ""
    if cta_text and cta_href:
        cta = (f'<tr><td style="padding:24px 32px 8px 32px;">'
               f'<a href="{escape(cta_href, quote=True)}" style="background-color:#FF5A1F;color:#ffffff;'
               f'text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">'
               f'{escape(cta_text)}</a></td></tr>')
    return (f'<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#F8FAFC;">'
            f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
            f'<tr><td align="center" style="padding:32px 16px;">'
            f'<table role="presentation" width="560" cellpadding="0" cellspacing="0" '
            f'style="background-color:#0B132B;border-radius:16px;overflow:hidden;">'
            f'<tr><td style="padding:24px 32px;background-color:#0B132B;">'
            f'<span style="color:#FF5A1F;font-weight:800;font-size:20px;font-family:Arial,sans-serif;">CasaLavori<span style="color:#ffffff">PRO</span></span>'
            f'</td></tr>'
            f'<tr><td style="padding:8px 32px 8px 32px;color:#F8FAFC;font-family:Arial,sans-serif;'
            f'font-size:22px;font-weight:bold;">{escape(title)}</td></tr>'
            f'<tr><td style="padding:8px 32px;color:#CBD5E1;font-family:Arial,sans-serif;font-size:15px;line-height:22px;">'
            f'{body_html}</td></tr>{cta}'
            f'<tr><td style="padding:24px 32px;color:#64748B;font-family:Arial,sans-serif;font-size:12px;">'
            f'Sent by {escape(EMAIL_FROM_NAME)}. We never ask for your password or card details by email.'
            f'</td></tr></table></td></tr></table></body></html>')


async def send_welcome(to: str, name: str, ruolo: str):
    if ruolo == "azienda":
        body = (f'<p>Ciao {escape(name)}, benvenuto nella rete di {escape(EMAIL_FROM_NAME)}.</p>'
                f'<p>Completa il profilo della tua impresa e richiedi la verifica PRO: le aziende '
                f'verificate ricevono piu richieste di preventivo dai privati della tua zona.</p>')
        await send_email(to=to, subject="Benvenuto su CasaLavoroPRO", html=_wrap(
            "Benvenuto, azienda PRO", body, "Completa il profilo", f"{FRONTEND_URL}/dashboard/azienda"))
    else:
        body = (f'<p>Ciao {escape(name)}, benvenuto su {escape(EMAIL_FROM_NAME)}.</p>'
                f'<p>Descrivi il lavoro da fare in casa: riceverai preventivi gratuiti da aziende '
                f'verificate della tua citta. Nessun costo, nessun vincolo.</p>')
        await send_email(to=to, subject="Benvenuto su CasaLavoroPRO", html=_wrap(
            "Benvenuto su CasaLavoroPRO", body, "Richiedi un preventivo", f"{FRONTEND_URL}/nuova-richiesta"))


async def send_new_quote(to: str, client_name: str, azienda_nome: str, prezzo: float):
    body = (f'<p>Ciao {escape(client_name)}, hai ricevuto un nuovo preventivo da '
            f'<strong>{escape(azienda_nome)}</strong>.</p>'
            f'<p>Prezzo indicativo: <strong>{prezzo:,.2f} EUR</strong>. Apri la tua area privata per '
            f'confrontare le offerte e accettare la migliore.</p>')
    await send_email(to=to, subject="Hai ricevuto un nuovo preventivo", html=_wrap(
        "Nuovo preventivo ricevuto", body, "Vedi i preventivi", f"{FRONTEND_URL}/dashboard"))


async def send_verification_result(to: str, azienda_nome: str, verificata: bool):
    if verificata:
        body = (f"<p>La verifica dell'azienda <strong>{escape(azienda_nome)}</strong> e stata completata.</p>"
                f'<p>Da ora il tuo profilo mostra il badge <strong>Azienda Verificata</strong> e compare '
                f'in posizione di evidenza nella directory.</p>')
        await send_email(to=to, subject="Azienda verificata: benvenuto nella rete PRO", html=_wrap(
            "Sei un'Azienda Verificata", body, "Vai al pannello", f"{FRONTEND_URL}/dashboard/azienda"))
    else:
        body = (f"<p>La verifica dell'azienda <strong>{escape(azienda_nome)}</strong> non e stata "
                f'superata. Controlla i documenti inseriti (Partita IVA e DURC) e invia nuovamente la '
                f'richiesta dal tuo pannello.</p>')
        await send_email(to=to, subject="Verifica azienda: documento non validato", html=_wrap(
            "Verifica non superata", body, "Correggi i documenti", f"{FRONTEND_URL}/dashboard/azienda"))


async def send_quote_accepted(to: str, azienda_nome: str, titolo: str):
    body = (f'<p>Complimenti, il tuo preventivo per <strong>{escape(titolo)}</strong> e stato accettato '
            f'dal cliente.</p>'
            f'<p>Contatta il cliente per pianificare l\'intervento di {escape(azienda_nome)}.</p>')
    await send_email(to=to, subject="Preventivo accettato dal cliente", html=_wrap(
        "Preventivo accettato", body, "Vai al pannello", f"{FRONTEND_URL}/dashboard/azienda"))



def _d_it(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


def _eur(v) -> str:
    return f"{float(v):,.2f} EUR".replace(",", "X").replace(".", ",").replace("X", ".")


def _noleggio_box(p: dict) -> str:
    righe = [
        ("Mezzo", p.get("annuncio_titolo", "")),
        ("Periodo", f"{_d_it(p['dal'])} - {_d_it(p['al'])} ({p.get('giorni', 0)} giorni)"),
        ("Totale stimato", _eur(p.get("totale", 0))),
    ]
    if p.get("caparra_importo"):
        stato = {"pagata": " (pagata)", "rimborsata": " (rimborsata)"}.get(p.get("caparra_stato"), "")
        righe.append(("Caparra", _eur(p["caparra_importo"]) + stato))
    if p.get("nota"):
        righe.append(("Nota", p["nota"]))
    cells = "".join(
        f'<tr><td style="padding:4px 0;color:#94A3B8;width:140px;">{escape(k)}</td>'
        f'<td style="padding:4px 0;color:#F8FAFC;font-weight:bold;">{escape(str(v))}</td></tr>' for k, v in righe)
    return f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0;font-size:14px;">{cells}</table>'


NOLEGGIO_EVENTI = {
    "richiesta": {
        "privato": ("Richiesta di noleggio inviata", "Richiesta inviata",
                    "Abbiamo inviato la tua richiesta a <strong>{azienda}</strong>. Riceverai una email appena verrà confermata o rifiutata.",
                    "Le mie prenotazioni", "/dashboard"),
        "azienda": ("Nuova richiesta di noleggio", "Nuova richiesta di noleggio",
                    "<strong>{cliente}</strong> ha richiesto il noleggio di un tuo mezzo. Conferma o rifiuta le date dal pannello.",
                    "Gestisci la richiesta", "/dashboard/azienda"),
    },
    "confermata": {
        "privato": ("Noleggio confermato", "Noleggio confermato",
                    "<strong>{azienda}</strong> ha confermato il tuo noleggio. Per bloccare le date paga la caparra con carta dal tuo pannello.",
                    "Paga la caparra", "/dashboard"),
        "azienda": ("Hai confermato un noleggio", "Noleggio confermato",
                    "Hai confermato il noleggio richiesto da <strong>{cliente}</strong>. Ti avviseremo quando la caparra sarà pagata.",
                    "Vai al pannello", "/dashboard/azienda"),
    },
    "rifiutata": {
        "privato": ("Noleggio non disponibile", "Richiesta rifiutata",
                    "Purtroppo <strong>{azienda}</strong> non può confermare il noleggio nelle date richieste. Puoi scegliere un altro periodo o un altro mezzo.",
                    "Cerca un altro mezzo", "/noleggio"),
        "azienda": ("Hai rifiutato una richiesta di noleggio", "Richiesta rifiutata",
                    "Hai rifiutato la richiesta di <strong>{cliente}</strong>. Le date sono di nuovo disponibili nel calendario.",
                    "Vai al pannello", "/dashboard/azienda"),
    },
    "annullata": {
        "privato": ("Prenotazione annullata", "Prenotazione annullata",
                    "Hai annullato la richiesta di noleggio presso <strong>{azienda}</strong>.",
                    "Le mie prenotazioni", "/dashboard"),
        "azienda": ("Prenotazione annullata dal cliente", "Prenotazione annullata",
                    "<strong>{cliente}</strong> ha annullato la richiesta di noleggio. Le date sono di nuovo libere.",
                    "Vai al pannello", "/dashboard/azienda"),
    },
    "annullata_azienda": {
        "privato": ("Noleggio annullato dall'azienda", "Noleggio annullato",
                    "<strong>{azienda}</strong> ha dovuto annullare il noleggio confermato. Se avevi pagato la caparra, il rimborso è già stato avviato sulla stessa carta (5-10 giorni lavorativi).",
                    "Cerca un altro mezzo", "/noleggio"),
        "azienda": ("Hai annullato un noleggio confermato", "Noleggio annullato",
                    "Hai annullato il noleggio di <strong>{cliente}</strong>. L'eventuale caparra è stata rimborsata automaticamente al cliente.",
                    "Vai al pannello", "/dashboard/azienda"),
    },
    "caparra_pagata": {
        "privato": ("Caparra ricevuta: noleggio bloccato", "Caparra pagata",
                    "Abbiamo registrato il pagamento della caparra: le date sono bloccate per te presso <strong>{azienda}</strong>. Il saldo si regola direttamente con l'azienda.",
                    "Le mie prenotazioni", "/dashboard"),
        "azienda": ("Caparra pagata dal cliente", "Caparra ricevuta",
                    "<strong>{cliente}</strong> ha pagato la caparra: il noleggio è bloccato. Organizza la consegna del mezzo.",
                    "Vai al pannello", "/dashboard/azienda"),
    },
}


async def send_noleggio_event(to: str, ruolo: str, evento: str, p: dict):
    conf = NOLEGGIO_EVENTI.get(evento, {}).get(ruolo)
    if not conf or not to:
        return
    subject, title, intro, cta, path = conf
    saluto = escape(p.get("azienda_nome", "") if ruolo == "azienda" else p.get("client_name", ""))
    body = (f"<p>Ciao {saluto},</p><p>{intro.format(azienda=escape(p.get('azienda_nome', '')), cliente=escape(p.get('client_name', '')))}</p>"
            f"{_noleggio_box(p)}")
    await send_email(to=to, subject=subject, html=_wrap(title, body, cta, f"{FRONTEND_URL}{path}"))
