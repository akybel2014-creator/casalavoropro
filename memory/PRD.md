# CasaLavoroPRO — PRD

## Problema / Obiettivo
Marketplace React + FastAPI + MongoDB che collega privati e aziende di servizi per lavori in casa. Modello SaaS (abbonamento PRO con trial 14 giorni via Stripe). Funzionalità: ricerca professionisti, analisi bollette AI (Gemini 3.1 Pro, async polling), report PDF con QR, reminder email via cron.

## Lingua
Utente italiano — tutte le comunicazioni in ITALIANO.

## Vincoli tecnici chiave
- AI bollette: SEMPRE asincrono (upload immediato → background → polling frontend). Non tornare al sincrono (causa 520 Cloudflare).
- Nessun sistema crediti/wallet (rimosso). Funzioni sbloccate solo da abbonamento PRO.
- Founder 50: prime 50 aziende registrate → `founder50=True`, PRO gratis a vita, bypass Stripe.
- Broker: fallback con coda se `BROKER_WEBHOOK_URL` non raggiungibile.

## Architettura
- Frontend: `/app/frontend/src/` CRA. Dashboard separate per ruolo.
- Backend: `/app/backend/` FastAPI modulare (routes_ai, routes_billing, routes_gallery, routes_auth, subscription).
- Endpoint founder: `GET /api/founder-offer` → `{total, taken, remaining, active}`.

## Integrazioni
- Stripe (chiave utente), Resend (managed), Twilio/Mapbox/Broker (chiavi utente — MOCKED, in attesa), Object Storage + Gemini 3.1 Pro (Emergent LLM Key).

## Implementato (ultimo update: 19/10/2026)
- Cleanup crediti + PRO gating, trial Stripe 14gg, portale clienti Stripe, fix 520 (async AI), fix upload bollette img/PDF.
- Homepage: ricerca professionisti, social proof loghi reali, categorie quick link, avatar loghi reali, upload logo azienda.
- Promo Founder 50 (PRO gratis per sempre) + banner countdown.
- **[NEW] Contatore Live in Home**: badge "OFFERTA FONDATORI · LIVE" nell'hero (sotto il sottotitolo) con posti rimasti (remaining/total), barra di avanzamento posti occupati, pallino pulsante e CTA registrazione azienda. Visibile solo se `offer.active`. Riusa `/api/founder-offer`. File: `Hero.jsx`.

## Backlog
- P1: Chiavi Twilio/Mapbox/Broker (BLOCCATO su utente).
- P1: Verifica dominio custom casalavoropro.com (auto-link post deploy).
- P3: Claude AI / Google Auth.

## Credenziali test
Vedi `/app/memory/test_credentials.md`.
