"""One-time Stripe provisioning (Flow A) + catalog setup. Idempotent."""
import os
import json
import urllib.request
import urllib.error

import stripe
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

base = os.environ["INTEGRATION_PROXY_URL"]
job_id = "e57fe9aa-18be-4843-83d5-91ca460e3cf5"
key = "sk-emergent-32dF821C8B8E26fB28"

req = urllib.request.Request(
    base + "/stripe/sandboxes",
    data=json.dumps({"job_id": job_id}).encode(),
    headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        sandbox = json.load(r)
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"PROVISIONING FAILED {e.code}: {body}")
    raise SystemExit(1)

print("sandbox account:", sandbox.get("sandbox_account_id"))
print("onboarding_url:", sandbox.get("onboarding_url"))

env_vals = {
    "STRIPE_SECRET_KEY": sandbox["sandbox_secret_key"],
    "STRIPE_PUBLISHABLE_KEY": sandbox["sandbox_publishable_key"],
    "STRIPE_ACCOUNT_ID": sandbox["sandbox_account_id"],
    "STRIPE_WEBHOOK_SECRET": sandbox.get("preview_webhook_secret", ""),
    "STRIPE_MODE": "test",
}
with open("/tmp/stripe_env.json", "w") as f:
    json.dump(env_vals, f)

stripe.api_key = sandbox["sandbox_secret_key"]
acct = stripe.Account.retrieve()
print("sandbox country:", acct["country"])

use_smp_country = acct["country"] in {
    "AU", "AT", "BE", "BG", "CA", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GI", "GR",
    "HK", "HU", "IE", "IT", "JP", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO",
    "SG", "SK", "SI", "ES", "SE", "CH", "GB", "US",
}
tax_mode = "full" if use_smp_country else "calc_only"
with open("/tmp/stripe_tax_mode.txt", "w") as f:
    f.write(tax_mode)
print("tax_mode:", tax_mode)

CATALOG = [
    {
        "emergent_product_id": "casalavoripro_pro_plan",
        "name": "CasaLavoriPRO Piano Pro",
        "tax_code": "txcd_10103001",
        "prices": [
            {"lookup_key": "pro_monthly", "amount": 2900, "currency": "eur", "interval": "month"},
            {"lookup_key": "pro_yearly", "amount": 29000, "currency": "eur", "interval": "year"},
        ],
    }
]


def get_or_create_product(entry):
    for p in stripe.Product.list(active=True).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            return p
    return stripe.Product.create(name=entry["name"], tax_code=entry.get("tax_code"),
                                 metadata={"managed_by": "emergent",
                                           "emergent_product_id": entry["emergent_product_id"]})


for entry in CATALOG:
    product = get_or_create_product(entry)
    print("product:", product.id)
    for p in entry["prices"]:
        existing = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
        if existing and (existing[0].unit_amount != p["amount"] or existing[0].currency != p["currency"]):
            stripe.Price.modify(existing[0].id, active=False)
            existing = []
        if not existing:
            kwargs = dict(product=product.id, unit_amount=p["amount"], currency=p["currency"],
                          lookup_key=p["lookup_key"], transfer_lookup_key=True)
            if p.get("interval"):
                kwargs["recurring"] = {"interval": p["interval"]}
            price = stripe.Price.create(**kwargs)
            print("created price:", p["lookup_key"], price.id)
        else:
            print("price exists:", p["lookup_key"])

print("STRIPE SETUP DONE")
