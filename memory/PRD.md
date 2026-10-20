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
- **Contatore Live in Home**: badge "OFFERTA FONDATORI · LIVE" nell'hero (sotto il sottotitolo) con posti rimasti (remaining/total), barra di avanzamento posti occupati, pallino pulsante e CTA registrazione azienda. Visibile solo se `offer.active`. Riusa `/api/founder-offer`. File: `Hero.jsx`.
- **[19/10] Urgenza Dinamica**: quando `remaining < 10`, il contatore Hero diventa ROSSO e lampeggia (opacity pulse infinito), badge "ULTIMI POSTI · LIVE", testo "Solo X posti rimasti!", barra rossa e glow rosso. File: `Hero.jsx` (attr `data-urgent`). Verificato a 5 posti via screenshot.
- **[19/10] Reset Aziende**: azzerate tutte le aziende + account + dati collegati (su richiesta utente). Privati/admin preservati.
- **[19/10] Aziende Demo ripopolate**: riavvio backend → `seed_demo_data` ha reinserito 8 aziende demo (6 verificate) per la prova sociale in home. Contatore Fondatori resta 50/50 (demo non sono founder50).
- **[19/10] Pubblicazione**: deploy avviato per collegare dominio custom casalavoropro.com (auto-link dal pannello deploy + record CNAME).
- **[20/10] Messaggistica semplificata**: banner top ora "Iscrizione gratis per tutti · Aziende e privati, registratevi senza alcun costo" (rimossa logica founder-offer dal banner). File `LaunchBanner.jsx`.
- **[20/10] Rimosso contatore Fondatori LIVE dall'hero** (incl. stato urgente rosso). File `Hero.jsx` ripulito (import/state inutilizzati). NB: la logica backend founder50 (primi 50 PRO gratis) resta attiva, solo non più pubblicizzata.
- **[20/10] Conteggi reali categorie in home**: nuovo endpoint `GET /api/aziende/categorie-count` (aggregazione $unwind+$group) + `CategoryGrid.jsx` mostra il numero reale di aziende per categoria (normalizzazione accenti, singolare/plurale).
- **[20/10] Loghi aziende demo**: generati 8 loghi flat/moderni (Gemini Nano Banana) e assegnati al campo `logo` delle 8 aziende demo → gli avatar della prova sociale in home mostrano loghi reali invece delle iniziali. Loghi salvati anche in `seed.py` (persistono ai re-seed).

## Backlog
- P1: Chiavi Twilio/Mapbox/Broker (BLOCCATO su utente).
- P1: Verifica dominio custom casalavoropro.com (auto-link post deploy).
- P3: Claude AI / Google Auth.

## Credenziali test
Vedi `/app/memory/test_credentials.md`.
