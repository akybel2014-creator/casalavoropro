import os
import logging
import uuid as uuidlib
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import Response
from core import db, now, clean_doc, require_roles, azienda_for_user
from starlette.responses import StreamingResponse
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "casalavoripro"
MAX_FOTO = 6
MAX_SIZE = 5 * 1024 * 1024
ALLOWED = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

_storage_key = None


def _init_storage(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    import requests
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _put_object(path: str, data: bytes, content_type: str) -> dict:
    import requests
    key = _init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=120)
    if resp.status_code == 404:
        key = _init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type},
                            data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def _get_object(path: str) -> tuple[bytes, str]:
    import requests
    key = _init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


@router.post("/aziende/mine/foto")
async def upload_foto(files: List[UploadFile] = File(...), user: dict = Depends(require_roles("azienda"))):
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    if EMERGENT_KEY is None:
        raise HTTPException(status_code=503, detail="Storage non configurato")
    existing = azienda.get("foto", [])
    if len(existing) >= MAX_FOTO:
        raise HTTPException(status_code=400, detail=f"Massimo {MAX_FOTO} foto nel portfolio")
    if len(existing) + len(files) > MAX_FOTO:
        raise HTTPException(status_code=400, detail=f"Massimo {MAX_FOTO} foto nel portfolio: puoi aggiungerne ancora {MAX_FOTO - len(existing)}")

    uploaded = []
    for file in files:
        if file.content_type not in ALLOWED:
            raise HTTPException(status_code=400, detail="Formato non supportato: usa JPG, PNG o WEBP")
        data = await file.read()
        if len(data) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Immagine troppo grande (max 5 MB)")
        ext = ALLOWED[file.content_type]
        path = f"{APP_NAME}/gallery/{azienda['_id']}/{uuidlib.uuid4()}.{ext}"
        try:
            result = _put_object(path, data, file.content_type)
        except Exception:
            logger.exception("upload failed")
            raise HTTPException(status_code=502, detail="Upload non riuscito, riprova")
        entry = {"id": str(uuidlib.uuid4()), "path": result["path"], "filename": file.filename, "created_at": now()}
        await db.files.insert_one({**entry, "owner_id": user["id"], "is_deleted": False,
                                   "is_public": True, "content_type": file.content_type})
        uploaded.append(entry)

    await db.aziende.update_one({"_id": azienda["_id"]}, {"$push": {"foto": {"$each": uploaded}}})
    fresh = await db.aziende.find_one({"_id": azienda["_id"]}, {"foto": 1})
    return {"foto": [clean_doc(f) for f in fresh.get("foto", [])]}


@router.delete("/aziende/mine/foto/{foto_id}")
async def delete_foto(foto_id: str, user: dict = Depends(require_roles("azienda"))):
    azienda = await azienda_for_user(user["id"])
    if not azienda:
        raise HTTPException(status_code=404, detail="Profilo azienda non trovato")
    foto = next((f for f in azienda.get("foto", []) if f.get("id") == foto_id), None)
    if not foto:
        raise HTTPException(status_code=404, detail="Foto non trovata")
    await db.files.update_one({"path": foto["path"]}, {"$set": {"is_deleted": True}})
    await db.aziende.update_one({"_id": azienda["_id"]}, {"$pull": {"foto": {"id": foto_id}}})
    fresh = await db.aziende.find_one({"_id": azienda["_id"]}, {"foto": 1})
    return {"foto": [clean_doc(f) for f in fresh.get("foto", [])]}


@router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"path": path, "is_deleted": False, "is_public": True})
    if not record:
        raise HTTPException(status_code=404, detail="File non trovato")
    try:
        data, content_type = _get_object(path)
    except Exception:
        logger.exception("download failed")
        raise HTTPException(status_code=502, detail="File non disponibile, riprova")
    return Response(content=data, media_type=record.get("content_type") or content_type)
