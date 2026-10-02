import secrets
import logging
from datetime import timedelta
from typing import Optional, List
from bson import ObjectId
from html import escape
import jwt
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from pydantic import BaseModel, Field, EmailStr
from core import (db, now, clean_doc, hash_password, verify_password, set_auth_cookies,
                  get_current_user, JWT_SECRET, JWT_ALGORITHM, azienda_for_user, notify)
from emailer import send_welcome, send_email, _wrap, FRONTEND_URL

logger = logging.getLogger(__name__)
router = APIRouter()


class AziendaRegIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    categorie: List[str] = []
    zone: List[str] = []
    piva: Optional[str] = None
    descrizione: Optional[str] = None


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    ruolo: str = "privato"
    azienda: Optional[AziendaRegIn] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=100)


@router.post("/auth/register")
async def register(inp: RegisterIn, response: Response):
    email = inp.email.lower().strip()
    if inp.ruolo not in ("privato", "azienda"):
        raise HTTPException(status_code=400, detail="Ruolo non valido")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email gia registrata")

    user_doc = {
        "email": email, "password_hash": hash_password(inp.password),
        "name": inp.name.strip(), "role": inp.ruolo, "created_at": now(),
    }
    res = await db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    azienda_out = None
    if inp.ruolo == "azienda":
        a = inp.azienda or AziendaRegIn(nome=inp.name.strip())
        azienda_doc = {
            "owner_id": user_id, "nome": a.nome.strip(), "categorie": a.categorie,
            "zone": a.zone, "piva": a.piva or "", "descrizione": a.descrizione or "",
            "telefono": "", "sito": "", "durc_number": "", "docs": [],
            "verified": False, "verification_status": "none",
            "plan": "free", "subscription_status": "none",
            "rating": 0.0, "recensioni": 0, "created_at": now(),
        }
        ares = await db.aziende.insert_one(azienda_doc)
        azienda_out = clean_doc(azienda_doc)
        azienda_out["id"] = str(ares.inserted_id)

    set_auth_cookies(response, user_id, email)
    user_out = clean_doc(user_doc)
    user_out["id"] = user_id

    await notify(user_id, "Benvenuto su CasaLavoriPRO",
                 "Il tuo account e attivo. Esplora la piattaforma e inizia subito.")
    try:
        await send_welcome(email, user_out["name"], inp.ruolo)
    except Exception:
        logger.exception("welcome email failed")
    return {"user": user_out, "azienda": azienda_out}


@router.post("/auth/login")
async def login(inp: LoginIn, request: Request, response: Response):
    email = inp.email.lower().strip()
    ident = f"{request.client.host if request.client else 'unknown'}:{email}"

    att = await db.login_attempts.find_one({"identifier": ident})
    if att and att.get("count", 0) >= 5 and att.get("locked_until") and now() < att["locked_until"]:
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra 15 minuti")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user.get("password_hash", "")):
        count = (att.get("count", 0) if att else 0) + 1
        update = {"$inc": {"count": 1}, "$set": {"updated_at": now()}}
        if count >= 5:
            update["$set"]["locked_until"] = now() + timedelta(minutes=15)
        await db.login_attempts.update_one({"identifier": ident}, update, upsert=True)
        raise HTTPException(status_code=401, detail="Credenziali non valide")

    await db.login_attempts.delete_many({"identifier": ident})
    user_id = str(user["_id"])
    set_auth_cookies(response, user_id, email)

    azienda = await azienda_for_user(user_id)
    return {"user": clean_doc(user), "azienda": clean_doc(azienda) if azienda else None}


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    azienda = await azienda_for_user(user["id"])
    return {"user": user, "azienda": clean_doc(azienda) if azienda else None}


@router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token non valido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")
        set_auth_cookies(response, str(user["_id"]), user["email"])
        return {"ok": True}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")


@router.post("/auth/forgot-password")
async def forgot_password(inp: ForgotIn):
    email = inp.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "email": email, "used": False, "expires_at": now() + timedelta(hours=1),
        })
        logger.info("Password reset link: /reset-password?token=%s", token)
        body = (f'<p>Ciao {escape(user.get("name", ""))}, hai richiesto il reset della password.</p>'
                f"<p>Apri il link qui sotto entro un'ora per scegliere una nuova password.</p>")
        await send_email(to=email, subject="Reset della password", html=_wrap(
            "Reset della password", body, "Scegli una nuova password",
            f"{FRONTEND_URL}/reset-password?token={token}"))
    return {"ok": True}


@router.post("/auth/reset-password")
async def reset_password(inp: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": inp.token, "used": False})
    if not rec or (rec.get("expires_at") and now() > rec["expires_at"]):
        raise HTTPException(status_code=400, detail="Token non valido o scaduto")
    await db.users.update_one({"email": rec["email"]},
                              {"$set": {"password_hash": hash_password(inp.password)}})
    await db.password_reset_tokens.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"ok": True}
