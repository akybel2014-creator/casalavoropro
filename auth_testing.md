# Auth Testing Playbook — CasaLavoriPRO

## MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`; indexes: users.email (unique), login_attempts.identifier, password_reset_tokens.expires_at (TTL).

## API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@casalavoripro.it","password":"Admin2026!"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns the user object and sets `access_token` + `refresh_token` httpOnly cookies (SameSite=none, secure). `/me` returns the same user via cookies. Refresh: `POST /api/auth/refresh` re-issues the access cookie from the refresh cookie.

## Brute force
5 failed logins per `{ip}:{email}` → 15 min lockout (HTTP 429). Successful login clears attempts.

## Verified end-to-end (2026-10-02)
- register (privato/azienda), login (3 ruoli), me, refresh
- richiesta → feed azienda → risposta → accetta → notifiche
- admin verifica azienda (in_attesa → verificata)
- Stripe checkout session creation (test mode) + status endpoint
