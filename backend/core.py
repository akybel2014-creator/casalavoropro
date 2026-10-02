import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from bson import ObjectId
import jwt
import bcrypt
from dotenv import load_dotenv
from fastapi import Request, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

logger = logging.getLogger("core")


def now() -> datetime:
    return datetime.now(timezone.utc)


def clean_doc(doc, drop=("password_hash",)):
    """Serialize a MongoDB document: _id -> id (str), datetimes -> ISO strings."""
    if not doc:
        return None
    out = dict(doc)
    raw_id = out.pop("_id", None)
    if raw_id is not None:
        out["id"] = str(raw_id)
    for f in drop:
        out.pop(f, None)
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, ObjectId):
            out[k] = str(v)
    return out


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": now() + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": now() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response, user_id: str, email: str):
    response.set_cookie(key="access_token", value=create_access_token(user_id, email),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(user_id),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token non valido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")
        return clean_doc(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")


def require_roles(*roles):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Permesso negato")
        return user
    return dep


async def azienda_for_user(user_id: str) -> Optional[dict]:
    doc = await db.aziende.find_one({"owner_id": user_id})
    return dict(doc) if doc else None


async def notify(user_id: str, titolo: str, testo: str, link: Optional[str] = None):
    try:
        await db.notifiche.insert_one({
            "user_id": user_id, "titolo": titolo, "testo": testo,
            "link": link, "letto": False, "created_at": now(),
        })
    except Exception:
        logger.exception("notify failed")


async def notify_admins(titolo: str, testo: str, link: Optional[str] = None):
    try:
        async for admin in db.users.find({"role": "admin"}):
            await notify(str(admin["_id"]), titolo, testo, link)
    except Exception:
        logger.exception("notify_admins failed")
