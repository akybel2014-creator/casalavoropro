"""Converte in WebP le foto gia caricate prima dell'introduzione dell'ottimizzazione all'upload.

Per ogni record in db.files non ancora WebP: scarica l'oggetto dallo storage, lo ridimensiona
(max 1600px) e lo converte in WebP (q82), quindi riscrive i byte sullo STESSO path e aggiorna
content_type -> image/webp nel record db.files. serve_file usa il content_type del record, quindi
non serve toccare i riferimenti in aziende.foto / annunci.foto.

Idempotente: salta i record gia image/webp e quelli dove l'ottimizzazione non riduce il peso.

Uso:
    cd /app/backend && set -a && source .env && set +a && python scripts/optimize_existing_photos.py
    (aggiungi --dry-run per simulare senza scrivere)
"""
import os
import sys
import asyncio

sys.path.insert(0, "/app/backend")

from motor.motor_asyncio import AsyncIOMotorClient
from routes_gallery import optimize_image, _get_object, _put_object

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
DRY_RUN = "--dry-run" in sys.argv

TARGET_TYPES = ("image/jpeg", "image/jpg", "image/png")


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    query = {"is_deleted": False, "content_type": {"$in": list(TARGET_TYPES)}}
    total = await db.files.count_documents(query)
    print(f"Foto candidate alla conversione: {total}" + (" (DRY RUN)" if DRY_RUN else ""))

    converted = skipped = errors = 0
    saved_bytes = 0

    cursor = db.files.find(query)
    async for rec in cursor:
        path = rec.get("path")
        if not path:
            continue
        try:
            data, _ = _get_object(path)
        except Exception as e:
            print(f"  [ERR] download {path}: {e}")
            errors += 1
            continue

        opt_data, opt_ct, opt_ext = optimize_image(data)
        if opt_ct != "image/webp" or len(opt_data) >= len(data):
            # ottimizzazione non vantaggiosa o fallita -> lascia invariato
            skipped += 1
            continue

        riduzione = len(data) - len(opt_data)
        print(f"  {path}: {len(data)//1024} KB -> {len(opt_data)//1024} KB "
              f"(-{round(100 * riduzione / len(data))}%)")

        if not DRY_RUN:
            try:
                _put_object(path, opt_data, "image/webp")
                await db.files.update_one({"_id": rec["_id"]}, {"$set": {"content_type": "image/webp"}})
            except Exception as e:
                print(f"  [ERR] write {path}: {e}")
                errors += 1
                continue

        converted += 1
        saved_bytes += riduzione

    print("\n=== Riepilogo ===")
    print(f"Convertite: {converted} | Saltate: {skipped} | Errori: {errors}")
    print(f"Risparmio totale: {saved_bytes // 1024} KB (~{saved_bytes // (1024 * 1024)} MB)")
    if DRY_RUN:
        print("(DRY RUN: nessuna scrittura effettuata)")


if __name__ == "__main__":
    asyncio.run(main())
