# PRD — CasaLavoriPRO

## Problema originale (dall'utente)
Landing vetrina "CasaLavoriPRO" per un marketplace del settore casa che unisce privati e aziende (idraulica, elettricità, ristrutturazioni…). Richieste iniziali: header con menu + Accedi/Registrati, hero con barra di ricerca (Dove/Cosa ti serve/Cerca), 4 badge di valore, griglia 8 categorie, "Come funziona" a 4 punti, due box CTA privato/azienda, footer con social, responsive, palette blu scuro/arancione. Al chiarimento l'utente ha scelto: **marketplace funzionante completo** (non solo statico), **prima la web app**, tema WordPress rimandato a fase successiva.

## Decisioni utente (2026-10-02)
1. "Vorrei già il marketplace funzionante" → v1 = web app completa React + FastAPI + MongoDB.
2. Screenshot allegato mai ricevuto tra gli asset → ricostruito fedelmente dal brief + design agent.
3. WordPress nativo: conflitto tecnico spiegato; utente ha scelto "prima la web app, poi pensiamo al tema WP".
4. Scope v1: "Tutto quanto" = core + verifiche azienda + abbonamenti Stripe.

## Architettura
- Frontend: React 19 (CRA/craco), Tailwind, shadcn/ui, framer-motion (reveal cinetici, masked hero reveal), Lenis (smooth scroll), react-router 7, axios con cookie httpOnly.
- Backend: FastAPI, motor (MongoDB async), JWT in cookie httpOnly (access 15 min + refresh 7 giorni) con fallback Bearer, bcrypt, brute-force lockout (5 tentativi/15 min), seed startup (admin + 8 aziende demo + richieste demo).
- Stripe: Flow A sandbox reclamabile, webhook /api/stripe/webhook + polling status; tax mode SMP "full" (account IT, prodotto digitale).
- Email: Resend gestito da Emergent (benvenuto, nuovo preventivo, esito verifica, preventivo accettato) con gate G1–G5.

## Requisiti core (statici dal brief)
- Header sticky glassmorfico con logo SVG originale + favicon, 7 voci di menu, Accedi/Registrati.
- Hero: reveal riga-per-riga mascherato, barra ricerca funzionante (→ /aziende con filtri), immagine casa con card fluttuanti.
- 4 badge valore, marquee editoriale lento, griglia 8 categorie con icone, Come funziona 4 step, doppio box CTA, FAQ accordion, footer social.

## Funzionalità implementate (2026-10-02)
- Directory aziende reale con filtri (testo, categoria, zona, solo verificate) + pagina profilo azienda.
- Auth 3 ruoli (privato/azienda/admin) con registrazioni distinte, accessi demo rapidi, reset password.
- Dashboard privato: richieste, preventivi ricevuti, accettazione, notifiche in-app.
- Dashboard azienda: feed richieste per categoria/zone, invio preventivi (prezzo/messaggio/durata), modifica profilo, richiesta verifica P.IVA+DURC, abbonamento Stripe (mensile/annuale) + pagamento in test.
- Pannello admin: statistiche + verifica/rifiuto aziende con notifica ed email.
- Emergenze 24/7: le aziende dichiarano disponibilità emergenza/weekend/notturno + telefono dedicato (tab dedicato in dashboard), badge "Emergenze" nelle card directory, filtro "Emergenze 24/7", card dedicata sul profilo pubblico e sezione landing con CTA (2026-10-02).
- Seed demo: 8 aziende, privato Mario Rossi, richieste/preventivi di esempio.

## Aggiunte del 2026-10-02 (pomeriggio)
- WhatsApp (Twilio): avviso alle aziende con Emergenze 24/7 quando arriva una richiesta marcata "urgente" dal privato. Funzione pronta ma NON attiva: parte solo quando vengono impostate TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM in backend/.env (ora vuote, invio saltato con log). Le notifiche in-app partono comunque.
- Ricerca "più vicine a me": aziende geolocalizzate (lat/lng GeoJSON, indice 2dsphere), distanza haversine calcolata dal backend, filtro per raggio (10/25/50/100 km) e ordinamento per distanza. Aziende impostano la posizione dal pannello (geolocalizzazione browser; ricerca indirizzi Mapbox attiva automaticamente quando viene impostato REACT_APP_MAPBOX_TOKEN, ora vuoto). Demo: coordinate città precompilate.
- Galleria lavori: upload fino a 6 foto (JPG/PNG/WEBP, max 5 MB) su object storage Emergent, servite via /api/files/{path}; tab "Galleria" nel pannello azienda e sezione "Lavori realizzati" sul profilo pubblico.
- Recensioni reali: dopo aver accettato un preventivo (richiesta chiusa) il privato lascia voto 1-5 + commento; rating medio e conteggio ricalcolati e mostrati in directory e profilo; sezione "Recensioni dei clienti" pubblica.

## Aggiunte del 2026-10-02 (sera)
- Mappa visuale nella directory: toggle Griglia/Mappa (Leaflet + OpenStreetMap, nessuna chiave), pin arancioni con iniziale, popup con link al profilo, cerchio del raggio e marker utente quando la posizione è attiva.
- Chat privato-azienda legata a ogni preventivo: collezione messaggi con autorizzazione (solo cliente proprietario o azienda rispondente), polling 4s, marcatura letti, notifiche in-app, "Apri chat" nelle card di entrambe le dashboard.
- WhatsApp e Mapbox restano IN PAUSA come da utente: attivabili incollando le chiavi in backend/.env (TWILIO_*) e REACT_APP_MAPBOX_TOKEN, senza modifiche al codice.
- Badge messaggi non letti (2026-10-02 sera): contatore nel menu (Header) e sulle card di entrambe le dashboard, polling 20s + aggiornamento alla chiusura chat; le richieste chiuse con risposta dell'azienda restano ora nel feed azienda (chat raggiungibile); header presente anche nelle dashboard.
- Deploy: richiesto dall'utente ma bloccato su saldo ECU insufficiente (50 ECU/mese richiesti, 45 disponibili). Da rilanciare dopo il ricaricamento. Il dominio personalizzato si collega dopo il primo deploy dalle impostazioni di pubblicazione.

## Aggiunte del 2026-10-05
- Deploy: health check statico superato (deployment_agent: pass); pipeline di deploy avviata dalla piattaforma in background.
- Aziende preferite (solo privati): collezione `preferiti` {user_id, azienda_id, created_at} con indice unico; endpoint GET /api/preferiti, GET /api/preferiti/ids, PUT/DELETE /api/preferiti/{azienda_id}. Cuore sulle card directory e bottone largo nel profilo azienda (anonimo -> redirect login; aziende non vedono il cuore). Dashboard privato: nuova tab "Preferite" con "Ricontatta al volo" (prefill categoria/zona), "Profilo", rimozione. Testato con testing agent (iteration_1: 7/7 backend + frontend OK).
- Homepage: voci menu "Noleggio Attrezzi" (/#noleggio-attrezzi) e "Mercatino Usato" (/#mercatino-usato) in header (nav desktop da breakpoint xl, mobile sotto) e footer; nuova sezione `NoleggioUsato.jsx` sotto la griglia categorie con 4 schede macchinari a noleggio + 4 schede usato (contenuto statico di vetrina, immagini Unsplash/Pexels); box arancione "Sei un'Azienda?" aggiornato con vantaggi noleggio/vendita usato per abbonati PRO.
- Nota: le schede noleggio/usato sono VETRINA STATICA; un vero marketplace annunci (CRUD per aziende abbonate) resta in backlog.
- GitHub: il codice è React/Node (frontend) + FastAPI; l'invio su GitHub avviene tramite il pulsante "Save to Github" della chat, non dall'agente.

## Aggiunte del 2026-10-05 (pomeriggio) — Marketplace annunci reale
- Collezione `annunci` {tipo noleggio|usato, titolo, descrizione, categoria (lista fissa in routes_annunci.CATEGORIE_ANNUNCI), zona, prezzo, unita giorno|settimana|mese|fisso, stato (usato), attivo, foto[] via object storage, immagine_url (solo demo), azienda_id/nome/verified/telefono, owner_id}. Seed idempotente di 8 annunci demo per le aziende PRO.
- API: GET /api/annunci (filtri tipo, categoria, zona, q, prezzo_min, prezzo_max, limit; solo attivi, senza owner_id), GET /api/annunci/meta, GET /api/annunci/mine, GET /api/annunci/{id}, POST /api/annunci (solo azienda con plan=pro, altrimenti 402), PUT/DELETE /api/annunci/{id} (solo proprietario), POST /api/annunci/{id}/foto (max 4, JPG/PNG/WEBP 5MB), DELETE /api/annunci/{id}/foto/{foto_id}.
- Frontend: pagine /noleggio e /mercatino (Annunci.jsx, filtri in query string), /annunci/:id (dettaglio con galleria, contatto azienda, "Richiedi disponibilità" -> /nuova-richiesta precompilata per i privati), tab "Annunci" in dashboard azienda (AnnunciPanel: crea, nascondi/mostra, foto, elimina; aziende FREE vedono upsell -> tab Abbonamento). Homepage NoleggioUsato ora dinamica (ultimi 4 per tipo). Menu/footer puntano alle pagine dedicate.
- Testing agent iteration_2: 20/20 backend + tutti i flussi frontend OK. Redeploy rilanciato (asincrono).

## Aggiunte del 2026-10-05 (sera) — Modifica annuncio + Calendario noleggio
- Modifica annuncio: AnnuncioDialog riusato in modalità edit (matita in ogni riga della tab Annunci) -> PUT /api/annunci/{id} (tipo non modificabile).
- Prenotazioni noleggio: collezione `prenotazioni` {annuncio_id, annuncio_titolo, azienda_id/nome, owner_id, client_id/name, dal, al (ISO date), giorni, prezzo, unita, totale, nota, stato richiesta|confermata|rifiutata|annullata}. API: GET /api/annunci/{id}/disponibilita (pubblica), POST /api/annunci/{id}/prenotazioni (privato; valida date, max 180 gg, 409 su sovrapposizione con richiesta/confermata), GET /api/prenotazioni/mine, GET /api/prenotazioni/azienda, POST /api/prenotazioni/{id}/stato (azienda: confermata|rifiutata), POST /api/prenotazioni/{id}/annulla (privato). Notifiche in-app a entrambe le parti. Totale: giorno*gg, settimana*ceil(gg/7), mese*ceil(gg/30).
- Frontend: NoleggioCalendar (react-day-picker range, giorni occupati disabilitati, stima totale, nota) nel dettaglio annunci noleggio; tab "Noleggi" dashboard privato (annulla); sezione "Richieste di noleggio" nella tab Annunci azienda (conferma/rifiuta, badge "da gestire").
- Testing agent iteration_3: 17/17 backend + frontend OK.

## Aggiunte del 2026-10-05 (notte) — Email noleggio + Caparra Stripe
- Email (Resend/Emergent) a cliente E azienda per ogni evento noleggio: richiesta, confermata, rifiutata, annullata, caparra_pagata (`emailer.send_noleggio_event`, tabella NOLEGGIO_EVENTI). Per gli account demo con email fittizie Resend risponde 422 "undeliverable" (atteso).
- Caparra: alla conferma dell'azienda `caparra_importo = max(10€, 20% totale)`, `caparra_stato = da_pagare`. POST /api/prenotazioni/{id}/caparra/checkout (privato) crea Stripe Checkout one-shot (price_data con tax_code txcd_20030000, metadata kind=caparra). `payment_transactions.kind` distingue abbonamento/caparra; GET /api/payments/status e webhook chiamano `_on_paid` -> `segna_caparra_pagata` (idempotente, notifiche + email). Annullamento vietato dopo caparra pagata. UI: badge caparra + bottone "Paga caparra" nella tab Noleggi; /payment/success?tipo=caparra con copy dedicato.
- BUG FIX pre-esistente: routes_billing usava motor senza await (status Stripe dava 500 e la transazione non veniva salvata) — corretto.
- Testing agent iteration_4: 10/10 backend + frontend OK. Redeploy rilanciato.

## Aggiunte del 2026-10-05 (tarda notte) — Rimborso caparra + Recensioni noleggio
- POST /api/prenotazioni/{id}/annulla-azienda {motivo}: l'azienda annulla (anche se confermata); se caparra pagata -> `routes_billing.rimborsa_caparra` (stripe.Refund su caparra_payment_intent, fallback su payment_transactions) -> caparra_stato 'rimborsata', caparra_refund_id; stato 'annullata', annullata_da 'azienda'; notifica + email evento 'annullata_azienda'. Senza PI noto -> 400 e nessun cambio stato.
- Recensioni noleggio: POST /api/prenotazioni/{id}/recensione {voto_mezzo, voto_azienda, commento} (solo confermata e al < oggi, una per prenotazione) -> collezione `recensioni_noleggio`; rating/recensioni su annuncio (media voto_mezzo) e su azienda (media combinata recensioni lavori + voto_azienda). GET /api/annunci/{id}/recensioni pubblico. UI: stelle su AnnuncioCard e dettaglio (+ lista recensioni), box recensione nella tab Noleggi del privato, badge "Caparra rimborsata", bottone "Annulla / Annulla e rimborsa" per l'azienda (confirm + prompt motivo).
- Dominio: l'utente ha indicato https://casalovoropro.com/ (possibile refuso di casalavoripro.com). Istruzioni fornite: Manage Publishes -> Domain; Auto-Link oppure DNS manuale (A root 162.159.142.117 e 172.66.2.113; CNAME www); SSL automatico Cloudflare; propagazione 5-15 min (max 24-48h); nessun costo extra.
- Testing agent iteration_5: 15/15 backend (incluso refund Stripe reale) + frontend OK. Redeploy rilanciato.
- Prezzi abbonamento PRO cambiati (richiesta utente 2026-10-05): 3,99 €/mese (pro_monthly, 399 cent) e 39,99 €/anno (pro_yearly, 3999 cent). Vecchi price Stripe disattivati, nuovi creati con transfer_lookup_key; aggiornati setup_stripe.py, routes_billing.PLANS, UI tab Abbonamento. Verificato checkout con i nuovi importi.
- OFFERTA LANCIO FONDATORI (2026-10-05): strategia di lancio gratuita.
  - Brand rinominato da "CasaLavoriPRO" a "CasaLavoroPRO" (solo display: logo, header, footer, email, titoli, index.html). Email interne (admin@casalavoripro.it) e APP_NAME storage invariati per non rompere login/upload.
  - Backend routes_auth.register: ogni nuova azienda riceve automaticamente plan="pro", subscription_status="active_trial", trial_ends_at=2026-12-31, offerta_lancio=True → sblocca TUTTE le funzioni PRO (annunci noleggio/usato) senza carta. Verificato via curl: registrazione + creazione annuncio noleggio OK.
  - Home CtaBoxes: titolo "Offerta Lancio Fondatori 2026", sottotitolo bianco #FFFFFF, box azienda con 4 bullet e unico pulsante "Registrati Gratis Ora (Senza Carta)" → /registrati?ruolo=azienda. Prezzi rimossi.
  - DashboardAzienda tab Abbonamento: rimossi prezzi €/mese €/anno e pulsanti Stripe (checkout). Mostra card offerta lancio + badge "Profilo PRO attivo · gratis fino al 31 Dicembre 2026".
  - Footer: rimossi telefono e indirizzo (restano email info@casalavoropro.com + orari).
  - SEO potenziata: title/description/keywords ottimizzati, Open Graph + Twitter card, JSON-LD (Organization/WebSite/Service), /robots.txt, /sitemap.xml, /og-image.svg. Dominio canonical: casalavoropro.com.
- Email Benvenuto Fondatori (2026-10-05): emailer.send_welcome (ramo azienda) riscritto per spiegare accesso PRO gratis fino al 31/12 con elenco funzioni incluse + CTA profilo. Fixato anche il logo nell'header email (CasaLavoro PRO). Invio verificato via Resend (HTTP 202 Accepted su delivered@resend.dev).
- Countdown Offerta (2026-10-05): nuovo componente /components/CountdownOfferta.jsx (deadline 2026-12-31 23:59:59 +01:00) mostrato sul box azienda in home (tone onOrange) e sulla pagina /registrati?ruolo=azienda (tone onDark). Verificato il rendering live.
- Deploy richiesto dall'utente (2026-10-05) per pubblicare nome nuovo + offerta lancio + countdown + email fondatori.
- Banner Scadenza Globale (2026-10-05): nuovo componente /components/site/LaunchBanner.jsx (barra fissa arancione in alto con countdown compatto + link "Registrati gratis" → /registrati?ruolo=azienda). Reso dentro Header (quindi su tutte le pagine con Header + dashboard) e aggiunto manualmente su pagine standalone /login, /registrati, /reset-password. Aumentato padding superiore (py-24→pt-32 pb-24, detail pt-24→pt-32) su Login/Registrati/ResetPassword/NuovaRichiesta/DashboardAzienda/DashboardPrivato/DashboardAdmin/AziendaDettaglio/AnnuncioDettaglio per evitare sovrapposizioni con banner+header. Aggiunta prop `compact` a CountdownOfferta. Test frontend iteration_6.json: 100%, nessun bug. Redeploy richiesto per portare il banner in produzione.
- Email Promemoria Offerta + Conversione Fine Offerta (2026-10-05): task pianificati via piattaforma (.emergent/crons.yml).
  - Cron `offer-reminder` (giornaliero 09:00 UTC) → /api/cron/offer-reminder: invia promemoria email alle aziende in active_trial quando mancano <=7 e <=1 giorni al 31/12 (milestone tracciate in azienda.offerta_reminders_sent per evitare duplicati). Email: emailer.send_offer_reminder. PERSONALIZZATO: include il conteggio delle richieste di lavoro ricevute (richieste che matchano le categorie dell'azienda) e dei preventivi inviati (risposte), per spingere a restare; fallback incoraggiante se entrambi 0.
  - Cron `offer-expire` (giornaliero 00:30 UTC) → /api/cron/offer-expire: dopo trial_ends_at converte le aziende active_trial in plan=free, subscription_status=trial_expired.
  - Cron `offer-reactivation` (una tantum, at 2027-01-01T10:00:00Z) → /api/cron/offer-reactivation: invia alle aziende trial_expired (non già contattate, campo reactivation_email_sent) un'email "Riattiva il PRO" con CTA diretta alla tab Abbonamento (link /dashboard/azienda?tab=abbonamento dove ci sono i pulsanti di checkout Stripe). Email: emailer.send_reactivation_email (include conteggio richieste di lavoro nelle categorie come gancio). DashboardAzienda ora apre la tab giusta dal query param ?tab= (useSearchParams).
  - Nuovo /app/backend/routes_cron.py (auth Bearer WEBHOOK_CRON_SECRET, ack 2xx + lavoro in BackgroundTasks). Secret in backend/.env (WEBHOOK_CRON_SECRET).
  - DashboardAzienda tab Abbonamento reso condizionale: active_trial → card offerta lancio; active (pagato) → "Abbonamento attivo"; trial_expired/free → piani a pagamento Base/Pro + pulsanti Stripe checkout ripristinati + nota "offerta terminata". Ripristinata la funzione checkout().
  - Test: /app/backend/tests/test_cron_offerta.py (expire/skip/reminder/idempotenza PASS) + iteration_7.json (UI 3 stati PASS, checkout→Stripe OK).
  - NOTA: le modifiche (crons + dashboard + email promemoria) richiedono un REDEPLOY per attivarsi in produzione (le schedule cron si sincronizzano al deploy).
- Nuove categorie di servizio (2026-10-05): aggiunto export SERVICE_CATEGORIES in components/landing/CategoryGrid.jsx (elenco completo deduplicato: vecchie showcase + Assicurazione, Catering, Geometra, Giardiniere, Idraulico, Imbianchino, Installazione Condizionatori, Investigatore Privato, NCC, Noleggio con Conducente, Notaio, Nutrizionista, Personal Trainer, Psicologo, Pulizia, Pulizie a Fondo, Riparazione Elettrodomestici, Ristrutturazione Casa, Ristrutturazioni, Sale per Compleanni, Svuota Cantine, Trasporti, Zanzariere). Selettori/filtri (Registrati, DashboardAzienda, NuovaRichiesta, Aziende) ora usano SERVICE_CATEGORIES. La griglia home (CATEGORIES) resta curata. Backend: categoria è testo libero, nessuna modifica. Verificato via screenshot.
- Link social configurabili + Deployment readiness (2026-10-05): footer con 4 social (Facebook, Instagram, LinkedIn, TikTok con SVG custom), URL da env REACT_APP_SOCIAL_* (default handle casalavoropro). Posti chiavi API gia pronti nei .env: backend TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM (vuoti), frontend REACT_APP_MAPBOX_TOKEN (vuoto). Health check deployment: PASS dopo fix — (1) .gitignore non blocca piu .env (test_credentials.md resta escluso); (2) rimosso indice TTL expireAfterSeconds=0 su password_reset_tokens (scadenza gia validata in routes_auth.reset_password), ora create_index("token"); (3) query db.aziende.find(...).limit(500) nelle notifiche richieste; (4) risolto N+1 in /richieste/mine (batch con $in). Verificato login + /richieste/mine HTTP 200.
- Pagina Prezzi (2026-10-07): nuova pagina pubblica /prezzi (frontend/src/pages/Prezzi.jsx) con banner offerta lancio + countdown, card Profilo Base (gratuito, sempre) e Profilo Pro (€3,99/mese · €39,99/anno), tabella "Servizi opzionali" (annunci in evidenza, profilo sponsorizzato, verifica avanzata, portfolio, pacchetti personalizzati) e paragrafo Condizioni. Rotta in App.js (PublicLayout), link "Prezzi" in Header NAV_ITEMS e nel footer. Verificato via screenshot.
- Sottocategorie attrezzi + Offerte di lavoro + rimozione FAQ (2026-10-07):
  - CATEGORIE_ANNUNCI ora dict categoria->sottocategorie (routes_annunci.py); AnnuncioIn/Update con campo sottocategoria, validazione coerenza categoria/sottocategoria (400 se incoerente), meta espone sottocategorie, lista_annunci filtra per sottocategoria. Frontend: AnnunciPanel con Select sottocategoria dipendente, Annunci (/noleggio e /mercatino) con filtro sottocategoria, AnnuncioCard mostra chip sottocategoria.
  - Nuovo modulo routes_offerte_lavoro.py: CRUD offerte di lavoro per aziende (titolo, descrizione, zona, tipo_contratto, retribuzione, contatti, attivo), owner-check 403, endpoint pubblico GET /api/aziende/{id}/offerte-lavoro (solo attive). Frontend: OfferteLavoroPanel + nuova tab 'Offerte di lavoro' in DashboardAzienda; sezione pubblica 'Offerte di lavoro' in AziendaDettaglio.
  - Rimosso link 'FAQ' dal menu header (NAV_ITEMS); sezione FAQ in home invariata.
  - Test: iteration_8.json backend 100% (13/13) + frontend 100%, nessun bug. Regressione: /app/backend/tests/test_offerte_e_sottocategorie.py. Nota non bloccante: warning Radix DialogContent aria-describedby.

## Persone
- Privato: cerca artigiani verificati, vuole preventivi rapidi e gratuiti.
- Azienda: vuole lead qualificati, profilo verificato, piano PRO.
- Admin: verifica documenti, gestisce la fiducia della piattaforma.

## Backlog
- P0: tema WordPress nativo (fase 2 dichiarata dall'utente, da definire).
- P1: notifiche WhatsApp (Twilio — servono chiavi utente, mai fornite), Mapbox (serve token pk.), collegamento dominio (in attesa che l'utente configuri DNS/Auto-Link), promemoria email pre-consegna noleggio, calendario occupazione nella dashboard azienda.
- P2: recensioni reali post-lavoro, chat integrata, mappa nella directory, SEO/OG avanzati.

## Note
- WhatsApp/Twilio e upload file non inclusi in v1 (nessuna chiave Twilio fornita; verifica via numeri documento).
- Il DB di preview e quello live sono separati: dopo il primo Deploy reinserire i contenuti dal sito live.
