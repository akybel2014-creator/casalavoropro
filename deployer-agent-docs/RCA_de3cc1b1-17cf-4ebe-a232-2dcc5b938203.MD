# RCA — Production browser register/login fails on custom domain (CasaLavoroPRO)

**Deployment:** home-pro-landing (`ed0a634a-a9d0-4867-96bc-aea30fa90f67`)
**Active run:** de3cc1b1-17cf-4ebe-a232-2dcc5b938203 (success)
**Frontend type:** cloudflare (static bundle served from R2 by a Cloudflare worker; `/api` proxied to the k8s backend)

## Symptom
In the browser, `POST /api/auth/register` and `POST /api/auth/login` fail on the custom domain, while the same calls succeed in preview and via direct `curl`.

## Root cause (PROVEN) — origin mismatch, not app code
The production frontend bundle has its backend base URL baked to the **apex** `https://casalavoropro.com`, but the app is actually served on **`www.casalavoropro.com`** (apex 308-redirects to www). Every in-browser API call therefore becomes cross-origin (page origin `www` → request to `apex`), and the CORS preflight (OPTIONS) to the apex receives the 308 redirect. Browsers treat a redirected preflight as a CORS failure, so register/login POSTs abort. Host-only `Secure; SameSite=None` cookies set on one host are not shared across the apex/www boundary, which additionally breaks session persistence.

### Evidence
- `list_secrets(equals={REACT_APP_BACKEND_URL: "https://casalavoropro.com"})` → **`matches_expected: true`**. Confirmed again against `https://www.casalavoropro.com` → **`matches_expected: false`**. So the baked backend URL = apex, NOT the serving origin.
- `list_secrets` → `CORS_ORIGINS` and `FRONTEND_URL` both **`matches_expected: false`** against `https://www.casalavoropro.com` — i.e. the backend's allowed origin / frontend URL are aligned to the apex, not to the www origin users actually land on.
- `list_domains` → both `casalavoropro.com` and `www.casalavoropro.com` are `verified:true`, `ssl_status:active`, `root_redirect_enabled:false` on both. The apex→www 308 redirect reported in the browser/curl therefore originates from the zone/Cloudflare redirect rules, not from our platform's root-redirect feature.
- `check_domain_status` → both domains `linked:true` (DNS fine). This is not a DNS/SSL problem.
- Reporter's curl: `POST https://www.casalavoropro.com/api/auth/register` → 200; apex with `-L` → 200. curl works because it follows the 308 and performs no CORS preflight. Preview works because there `REACT_APP_BACKEND_URL` == the serving origin (same-origin, no redirect).

## Why this is not a code bug
Backend serves auth correctly (curl POST → 200). The failure is purely that the browser's page origin (`www`) differs from the baked API base URL (`apex`), with a redirect in between. It is a domain/origin configuration + build-bake mismatch.

## Important platform note
`REACT_APP_BACKEND_URL` is a **SYSTEM/platform-managed** secret. It is regenerated from production state on every deploy and derived from the custom-domain configuration — it was baked to the apex. A user edit of it in the Secrets tab will be overwritten on the next deploy; the baked value only changes when the canonical custom-domain configuration changes and the bundle is rebuilt (it is baked at build time).

## Fix — pick ONE canonical origin and make serving origin == baked backend URL == CORS origin

**Option A (recommended — canonical = www):**
1. Make `www.casalavoropro.com` the canonical/primary custom domain so the platform bakes `REACT_APP_BACKEND_URL = https://www.casalavoropro.com`. Keep the apex→www redirect (users land on www, same-origin).
2. In Deployment Panel → Secrets, set `CORS_ORIGINS = https://www.casalavoropro.com` and `FRONTEND_URL = https://www.casalavoropro.com` (these are user-owned keys). Add the apex too only if the apex must be directly reachable.
3. Redeploy so the bundle is rebaked with the www backend URL. (If the platform does not expose a "primary domain" choice that makes `REACT_APP_BACKEND_URL` resolve to www, raise an Emergent support ticket — a system key cannot be set by the user.)

**Option B (lowest-friction — canonical = apex, matches the already-baked value):**
1. Remove the apex→www 308 redirect in the Cloudflare zone so the app serves directly on `https://casalavoropro.com` (same-origin with the already-baked apex backend URL — no cross-origin redirect).
2. In Secrets, set `CORS_ORIGINS = https://casalavoropro.com` and `FRONTEND_URL = https://casalavoropro.com`.
3. Redeploy to pick up the CORS/frontend values (the baked backend URL already = apex).

**Either way:** after the change, confirm the backend's CORS layer allows **credentialed** requests (Access-Control-Allow-Credentials: true) from the final single origin, and verify in an incognito browser that the OPTIONS preflight returns 200/204 (no 3xx) and auth POSTs succeed.

## What I did NOT change
Debug-only. I did not redeploy, did not edit secrets (incl. the system-managed `REACT_APP_BACKEND_URL`), and did not change domain configuration — all of these are user/domain-panel or platform actions.
