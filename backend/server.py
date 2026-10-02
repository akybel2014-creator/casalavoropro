from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import logging
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from core import client, db, now, hash_password, verify_password  # noqa: E402
from routes_auth import router as auth_router  # noqa: E402
from routes_aziende import router as aziende_router  # noqa: E402
from routes_richieste import router as richieste_router  # noqa: E402
from routes_recensioni import router as recensioni_router  # noqa: E402
from routes_gallery import router as gallery_router, _init_storage  # noqa: E402
from routes_admin import router as admin_router  # noqa: E402
from routes_billing import router as billing_router  # noqa: E402
from routes_notifiche import router as notifiche_router  # noqa: E402
from seed import seed_demo_data, backfill_emergenze, backfill_geo  # noqa: E402

app = FastAPI(title="CasaLavoriPRO API")

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(aziende_router)
api_router.include_router(richieste_router)
api_router.include_router(recensioni_router)
api_router.include_router(gallery_router)
api_router.include_router(admin_router)
api_router.include_router(billing_router)
api_router.include_router(notifiche_router)


@api_router.get("/")
async def root():
    return {"message": "CasaLavoriPRO API is running"}


app.include_router(api_router)

cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    try:
        await db.aziende.create_index("location", sparse=True)
    except Exception:
        pass

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@casalavoripro.it")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin2026!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Admin", "role": "admin", "created_at": now(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})

    await seed_demo_data()
    await backfill_emergenze()
    await backfill_geo()

    try:
        _init_storage()
        logging.getLogger(__name__).info("Object storage initialized")
    except Exception as e:
        logging.getLogger(__name__).error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
