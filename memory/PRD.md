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

## Persone
- Privato: cerca artigiani verificati, vuole preventivi rapidi e gratuiti.
- Azienda: vuole lead qualificati, profilo verificato, piano PRO.
- Admin: verifica documenti, gestisce la fiducia della piattaforma.

## Backlog
- P0: tema WordPress nativo (fase 2 dichiarata dall'utente, da definire).
- P1: notifiche WhatsApp (Twilio — servono chiavi utente), Mapbox (serve token pk.), dominio personalizzato dopo deploy, modifica annuncio esistente (oggi solo attivo/nascondi + foto), richieste di noleggio con date/calendario.
- P2: recensioni reali post-lavoro, chat integrata, mappa nella directory, SEO/OG avanzati.

## Note
- WhatsApp/Twilio e upload file non inclusi in v1 (nessuna chiave Twilio fornita; verifica via numeri documento).
- Il DB di preview e quello live sono separati: dopo il primo Deploy reinserire i contenuti dal sito live.
