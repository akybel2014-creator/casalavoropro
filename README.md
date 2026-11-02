# CasaLavoroPRO

CasaLavoroPRO è il marketplace italiano che unisce privati, aziende e professionisti verificati per lavori in casa, noleggio attrezzatura edile, mercatino dell'usato, registro interventi con foto certificate, offerte di lavoro nel settore edile e analisi energetica delle bollette con AI.

## Architettura

- **Frontend**: React 19 + Vite 6 + Tailwind CSS + Radix UI (`src/`)
- **Backend**: Express + TypeScript (`server.ts`, `server/routes.ts`, `server/store.ts`, `server/gemini.ts`)
- **AI (Server-Side)**: `@google/genai` (`gemini-3.8-flash`) per estrazione strutturata da bollette luce/gas e valutazione valore macchinari usati

## Avvio locale

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Configura le variabili d'ambiente (vedi `.env.example`):
   - `GEMINI_API_KEY`: chiave API Gemini per analisi bollette e macchinari
   - `JWT_SECRET`: segreto per la firma dei token di sessione (opzionale in sviluppo)
   - `VITE_MAPBOX_TOKEN`: token Mapbox opzionale per geocoding (fallback automatico su OpenStreetMap Nominatim)
3. Avvia il server di sviluppo (porta `3000`):
   ```bash
   npm run dev
   ```
4. Build di produzione:
   ```bash
   npm run build
   npm start
   ```

## Account Demo Pre-caricati

- **Privato**: `mario.rossi@demo.it` / `Demo2026!`
- **Azienda (Idraulica)**: `info@rossiidraulica.demo.it` / `Demo2026!`
- **Admin**: `admin@casalavoripro.it` / `Demo2026!`
