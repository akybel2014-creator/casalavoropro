import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export const JWT_SECRET = process.env.JWT_SECRET || "casalavoropro-dev-secret-key-2026";
export const FOUNDER_LIMIT = 50;
export const PRO_UPSELL =
  "Funzione riservata al piano PRO. Attiva CasaLavoroPRO con 14 giorni di prova gratuita per sbloccare cantieri, annunci e offerte di lavoro.";
export const PRO_ACTIVE_STATES = ["active", "trialing", "active_trial"] as const;
export const TRIAL_STATES = ["trialing", "active_trial"] as const;

export const CATEGORIE_ANNUNCI: Record<string, string[]> = {
  "Movimento terra": ["Escavatori", "Miniescavatori", "Pale e terne", "Rulli compattatori", "Dumper"],
  "Edilizia e betoniere": ["Betoniere", "Impastatrici", "Vibratori per calcestruzzo", "Montacarichi", "Puntelli e casseforme"],
  "Ponteggi e facciate": ["Ponteggi", "Trabattelli", "Piattaforme di facciata", "Reti e teli"],
  "Lavori in quota": ["Piattaforme aeree", "Sollevatori telescopici", "Scale e ponti su ruote"],
  Elettroutensili: ["Trapani e avvitatori", "Smerigliatrici", "Seghe circolari", "Martelli demolitori", "Generatori"],
  Giardinaggio: ["Tagliaerba", "Decespugliatori", "Motoseghe", "Biotrituratori", "Soffiatori"],
  "Idraulica e riscaldamento": ["Pompe", "Disgorgatrici", "Saldatrici per tubi", "Riscaldatori"],
  "Trasporto e sollevamento": ["Transpallet", "Carrelli elevatori", "Gru", "Argani", "Rimorchi"],
  "Pulizia industriale": ["Idropulitrici", "Aspiratori industriali", "Lavasciuga pavimenti", "Generatori di vapore"],
  Altro: ["Altro"],
};

export const TIPI_ANNUNCI = ["noleggio", "usato"] as const;
export const UNITA_ANNUNCI = ["giorno", "settimana", "mese", "fisso"] as const;
export const STATI_USATO = ["Nuovo", "Ottimo", "Buono", "Revisionato", "Da sistemare"] as const;
export const TIPI_CONTRATTO = ["Full-time", "Part-time", "Stagionale", "Apprendistato", "A chiamata", "Tirocinio"] as const;

export function newId(): string {
  return crypto.randomBytes(12).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(pw, hash);
  } catch {
    return false;
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface UserDoc {
  id: string;
  email: string;
  password_hash: string;
  extra_passwords?: string[];
  name: string;
  role: "privato" | "azienda";
  suspended?: boolean;
  telefono?: string;
  created_at: string;
}

export interface FotoEntry {
  id: string;
  path: string;
  filename: string;
  created_at: string;
}

export interface StoredFile {
  path: string;
  data: Buffer;
  content_type: string;
  owner_id: string;
  is_deleted: boolean;
  is_public: boolean;
  created_at: string;
}

export interface AziendaDoc {
  id: string;
  owner_id: string;
  nome: string;
  categorie: string[];
  zone: string[];
  piva: string;
  descrizione: string;
  telefono: string;
  sito: string;
  logo?: string | null;
  foto?: FotoEntry[];
  docs: Array<{ tipo: string; valore: string }>;
  docs_uploaded_at?: string;
  verified: boolean;
  verification_status: "none" | "in_attesa" | "verificata" | "rifiutata";
  verified_at?: string | null;
  plan: "free" | "pro";
  subscription_status: string;
  founder50?: boolean;
  trial_used?: boolean;
  trial_ends_at?: string | null;
  emergenze?: boolean;
  emergenze_weekend?: boolean;
  emergenze_notturno?: boolean;
  emergenze_telefono?: string;
  location?: { type: "Point"; coordinates: [number, number] };
  rating: number;
  recensioni: number;
  created_by_admin?: boolean;
  created_at: string;
}

export interface RichiestaDoc {
  id: string;
  client_id: string;
  client_name: string;
  titolo: string;
  categoria: string;
  zona: string;
  budget: string;
  descrizione: string;
  urgente?: boolean;
  stato: "aperta" | "in_lavorazione" | "chiusa";
  risposte_count: number;
  risposta_accettata?: string;
  foto?: FotoEntry[];
  created_at: string;
}

export interface RispostaDoc {
  id: string;
  richiesta_id: string;
  azienda_id: string;
  azienda_nome: string;
  azienda_verified: boolean;
  prezzo: number;
  durata_giorni: number;
  messaggio: string;
  stato: "inviata" | "accettata" | "rifiutata";
  created_at: string;
}

export interface RecensioneDoc {
  id: string;
  richiesta_id: string;
  azienda_id: string;
  client_id: string;
  client_name: string;
  voto: number;
  commento: string;
  created_at: string;
}

export interface MessaggioDoc {
  id: string;
  risposta_id: string;
  sender_id: string;
  sender_role: "privato" | "azienda";
  sender_name: string;
  testo: string;
  letto: boolean;
  created_at: string;
}

export interface NotificaDoc {
  id: string;
  user_id: string;
  titolo: string;
  messaggio: string;
  link?: string;
  letto: boolean;
  created_at: string;
}

export interface AnnuncioDoc {
  id: string;
  tipo: "noleggio" | "usato";
  titolo: string;
  descrizione: string;
  categoria: string;
  sottocategoria?: string | null;
  zona: string;
  prezzo: number;
  unita: string;
  stato?: string | null;
  attivo: boolean;
  venduto?: boolean;
  azienda_id: string;
  azienda_nome: string;
  azienda_verified: boolean;
  azienda_telefono: string;
  venditore_privato?: boolean;
  owner_id: string;
  foto: FotoEntry[];
  immagine_url?: string;
  rating?: number;
  recensioni?: number;
  created_by_admin?: boolean;
  created_at: string;
}

export interface PrenotazioneDoc {
  id: string;
  annuncio_id: string;
  annuncio_titolo: string;
  azienda_id: string;
  azienda_nome: string;
  owner_id: string;
  client_id: string;
  client_name: string;
  dal: string;
  al: string;
  giorni: number;
  prezzo: number;
  unita: string;
  totale: number;
  nota: string;
  stato: "richiesta" | "confermata" | "rifiutata" | "annullata";
  annullata_da?: string;
  motivo_annullamento?: string;
  caparra_importo?: number;
  caparra_stato?: "da_pagare" | "pagata" | "rimborsata";
  caparra_paid_at?: string;
  caparra_refunded_at?: string;
  recensione?: { voto_mezzo: number; voto_azienda: number; commento: string };
  created_at: string;
  updated_at?: string;
}

export interface RecensioneNoleggioDoc {
  id: string;
  prenotazione_id: string;
  annuncio_id: string;
  annuncio_titolo: string;
  azienda_id: string;
  client_id: string;
  client_name: string;
  voto_mezzo: number;
  voto_azienda: number;
  commento: string;
  created_at: string;
}

export interface OffertaLavoroDoc {
  id: string;
  titolo: string;
  descrizione: string;
  zona: string;
  tipo_contratto: string;
  retribuzione?: string | null;
  contatto_email?: string | null;
  contatto_telefono?: string | null;
  in_evidenza: boolean;
  attivo: boolean;
  azienda_id: string;
  azienda_nome: string;
  azienda_verified: boolean;
  owner_id: string;
  created_at: string;
  updated_at?: string;
}

export interface InterventoDoc {
  id: string;
  user_id: string;
  titolo: string;
  cliente: string | null;
  indirizzo: string | null;
  data: string | null;
  importo: number | null;
  note: string | null;
  stato: "pianificato" | "in_corso" | "completato";
  created_at: string;
}

export interface LeadDoc {
  id: string;
  user_id: string;
  tipo: string;
  stato: string;
  filename?: string;
  pagine?: number;
  dati: any;
  errore?: string;
  share_token?: string;
  origine_share_token?: string;
  contatto?: { nome: string; telefono: string; email: string | null };
  inviato_broker: boolean;
  broker_simulato?: boolean;
  created_at: string;
  analizzato_at?: string;
  inviato_at?: string;
}

export interface PaymentTxDoc {
  session_id: string;
  user_id: string;
  kind: "abbonamento" | "caparra";
  lookup_key?: string;
  prenotazione_id?: string;
  trial_days?: number;
  amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export const db = {
  users: [] as UserDoc[],
  aziende: [] as AziendaDoc[],
  richieste: [] as RichiestaDoc[],
  risposte: [] as RispostaDoc[],
  recensioni: [] as RecensioneDoc[],
  messaggi: [] as MessaggioDoc[],
  notifiche: [] as NotificaDoc[],
  preferiti: [] as Array<{ user_id: string; azienda_id: string; created_at: string }>,
  preferiti_annunci: [] as Array<{ user_id: string; annuncio_id: string; created_at: string }>,
  annunci: [] as AnnuncioDoc[],
  prenotazioni: [] as PrenotazioneDoc[],
  recensioni_noleggio: [] as RecensioneNoleggioDoc[],
  offerte_lavoro: [] as OffertaLavoroDoc[],
  interventi: [] as InterventoDoc[],
  leads: [] as LeadDoc[],
  files: new Map<string, StoredFile>(),
  password_reset_tokens: [] as Array<{ token: string; email: string; used: boolean; expires_at: number }>,
  payment_transactions: [] as PaymentTxDoc[],
};

export function cleanUser(u: UserDoc) {
  const { password_hash, extra_passwords, ...rest } = u;
  return rest;
}

export function cleanAzienda(a: AziendaDoc, dropOwner = false) {
  const copy: any = { ...a };
  if (dropOwner) delete copy.owner_id;
  return copy;
}

export function aziendaForUser(userId: string): AziendaDoc | undefined {
  return db.aziende.find((a) => a.owner_id === userId);
}

export function aziendaProActive(az?: AziendaDoc | null): boolean {
  if (!az || az.plan !== "pro") return false;
  if (!(PRO_ACTIVE_STATES as readonly string[]).includes(az.subscription_status)) return false;
  if ((TRIAL_STATES as readonly string[]).includes(az.subscription_status) && az.trial_ends_at) {
    if (Date.now() > new Date(az.trial_ends_at).getTime()) return false;
  }
  return true;
}

export function proStatus(user: { id: string; role: string }) {
  if (user.role !== "azienda") {
    return {
      plan: null,
      pro_active: false,
      subscription_status: null,
      trial: false,
      trial_days_left: 0,
      trial_ends_at: null,
    };
  }
  const az = aziendaForUser(user.id);
  const sub = az?.subscription_status || null;
  const active = aziendaProActive(az);
  let trial_days_left = 0;
  if (az?.trial_ends_at && sub && (TRIAL_STATES as readonly string[]).includes(sub)) {
    const diffMs = new Date(az.trial_ends_at).getTime() - Date.now();
    trial_days_left = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }
  return {
    plan: az?.plan || "free",
    pro_active: active,
    subscription_status: sub,
    trial: active && !!sub && (TRIAL_STATES as readonly string[]).includes(sub),
    trial_days_left,
    trial_ends_at: az?.trial_ends_at || null,
  };
}

export function notify(userId: string, titolo: string, messaggio: string, link = "") {
  if (!userId) return;
  db.notifiche.unshift({
    id: newId(),
    user_id: userId,
    titolo,
    messaggio,
    link,
    letto: false,
    created_at: nowIso(),
  });
}

export function notifyAdmins(_titolo: string, _messaggio: string, _link = "") {
  // no-op: sezione admin rimossa, gestione tramite Supabase
}

export function createAuthTokens(userId: string, email: string) {
  const access_token = jwt.sign({ sub: userId, email, type: "access" }, JWT_SECRET, { expiresIn: "2h" });
  const refresh_token = jwt.sign({ sub: userId, email, type: "refresh" }, JWT_SECRET, { expiresIn: "14d" });
  return { access_token, refresh_token };
}

export function setAuthCookies(req: Request, res: Response, userId: string, email: string) {
  const { access_token, refresh_token } = createAuthTokens(userId, email);
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const cookieOpts = {
    httpOnly: true,
    path: "/",
    sameSite: (isSecure ? "none" : "lax") as "none" | "lax",
    secure: isSecure,
  };
  res.cookie("access_token", access_token, { ...cookieOpts, maxAge: 2 * 60 * 60 * 1000 });
  res.cookie("refresh_token", refresh_token, { ...cookieOpts, maxAge: 14 * 24 * 60 * 60 * 1000 });
  return { access_token, refresh_token };
}

export interface AuthedRequest extends Request {
  user?: ReturnType<typeof cleanUser>;
}

export function getUserFromRequest(req: Request): UserDoc | null {
  let token = "";
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  } else if (typeof (req.query as any)?.token === "string") {
    token = String((req.query as any).token).trim();
  }
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; type?: string };
    if (payload.type && payload.type !== "access") return null;
    const u = db.users.find((x) => x.id === payload.sub);
    if (!u || u.suspended) return null;
    return u;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const u = getUserFromRequest(req);
  if (!u) {
    res.status(401).json({ detail: "Non autenticato" });
    return;
  }
  req.user = cleanUser(u);
  next();
}

export function requireRoles(...roles: Array<"privato" | "azienda">) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const u = getUserFromRequest(req);
    if (!u) {
      res.status(401).json({ detail: "Non autenticato" });
      return;
    }
    if (!roles.includes(u.role)) {
      res.status(403).json({ detail: "Permesso negato" });
      return;
    }
    req.user = cleanUser(u);
    next();
  };
}

// ---------- SEED DATA ----------

const CITY_COORDS: Record<string, [number, number]> = {
  torino: [45.0703, 7.6869],
  "provincia di torino": [45.0703, 7.6869],
  milano: [45.4642, 9.19],
  "provincia di milano": [45.4642, 9.19],
  monza: [45.5844, 9.2746],
  roma: [41.9028, 12.4964],
  "provincia di roma": [41.9028, 12.4964],
  firenze: [43.7696, 11.2558],
  prato: [43.8807, 11.0964],
  bologna: [44.4949, 11.3426],
  "provincia di bologna": [44.4949, 11.3426],
  napoli: [40.8518, 14.2681],
  "provincia di napoli": [40.8518, 14.2681],
  siena: [43.3188, 11.3308],
};

const EMERGENZE_BACKFILL: Record<string, [boolean, boolean, boolean, string]> = {
  "Lampioni Idraulica": [true, true, true, "+39 335 111 2233"],
  "Calore & Clima Srl": [true, true, false, "+39 335 222 3344"],
  "Volt Infrastructure": [true, false, true, "+39 335 333 4455"],
  "EdilNuova Costruzioni": [true, true, true, "+39 335 444 5566"],
  "ColorArt Imbiancatura": [false, false, false, ""],
  "VerdeMano Giardini": [false, true, false, ""],
  "Broker Energia Toscana": [false, false, false, ""],
  "MultiService Italia": [true, true, false, "+39 335 777 8899"],
};

const DEMO_AZIENDE: Array<{
  email: string;
  nome: string;
  categorie: string[];
  zone: string[];
  piva: string;
  descrizione: string;
  telefono: string;
  verified: boolean;
  plan: "free" | "pro";
  rating: number;
  recensioni: number;
  logo: string;
}> = [];

const DEMO_ANNUNCI: Array<[string, "noleggio" | "usato", string, string, string, number, string, string | null, string, string]> = [
  [
    "Lampioni Idraulica",
    "noleggio",
    "Miniescavatore 1,8 t cingolato",
    "Movimento terra",
    "Torino",
    140,
    "giorno",
    null,
    "Miniescavatore con benna da 40 cm, ideale per scavi in giardino e allacci. Guidabile con patente B, consegna in cantiere inclusa in provincia.",
    "https://images.unsplash.com/photo-1759950345011-ee5a96640e00?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  ],
  [
    "EdilNuova Costruzioni",
    "noleggio",
    "Betoniera 350 L elettrica",
    "Edilizia e betoniere",
    "Roma",
    35,
    "giorno",
    null,
    "Betoniera professionale 230V da 350 litri, revisionata. Trasporto incluso nel comune di Roma.",
    "https://images.unsplash.com/photo-1770822662967-7f66605f9103?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  ],
  [
    "EdilNuova Costruzioni",
    "noleggio",
    "Ponteggio modulare fino a 12 m",
    "Ponteggi e facciate",
    "Roma",
    9,
    "mese",
    null,
    "Ponteggio multidirezionale certificato, montaggio e smontaggio a cura dei nostri operai abilitati. Prezzo al m² per mese.",
    "https://images.unsplash.com/photo-1616320999187-3c004dad4f0b?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  ],
  [
    "Calore & Clima Srl",
    "noleggio",
    "Piattaforma aerea semovente 14 m",
    "Lavori in quota",
    "Milano",
    190,
    "giorno",
    null,
    "Piattaforma a forbice elettrica, altezza di lavoro 14 m. Disponibile anche con operatore qualificato PLE.",
    "https://images.pexels.com/photos/34297398/pexels-photo-34297398.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
  [
    "Lampioni Idraulica",
    "usato",
    "Kit trapani a batteria 18V",
    "Elettroutensili",
    "Torino",
    180,
    "fisso",
    "Ottimo",
    "Due trapani avvitatori 18V con 2 batterie 4Ah, caricatore rapido e valigetta. Usati in cantiere per una stagione.",
    "https://images.unsplash.com/photo-1546827209-a218e99fdbe9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  ],
  [
    "Calore & Clima Srl",
    "usato",
    "Smerigliatrice angolare 125 mm",
    "Elettroutensili",
    "Milano",
    55,
    "fisso",
    "Buono",
    "Smerigliatrice 1.200 W con impugnatura antivibrazione, 10 dischi da taglio inclusi.",
    "https://images.unsplash.com/photo-1518709414768-a88981a4515d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  ],
  [
    "EdilNuova Costruzioni",
    "usato",
    "Martello demolitore 11 kg SDS-Max",
    "Elettroutensili",
    "Roma",
    320,
    "fisso",
    "Revisionato",
    "Demolitore 25 J revisionato dal centro assistenza, con punte e scalpelli. Garanzia 3 mesi.",
    "https://images.unsplash.com/photo-1689935421853-cb23a0bc92e4?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  ],
  [
    "Calore & Clima Srl",
    "usato",
    "Banco da lavoro in acciaio con morsa",
    "Altro",
    "Milano",
    240,
    "fisso",
    "Ottimo",
    "Banco 150 cm con piano in acciaio, morsa da 125 mm e due cassetti. Ritiro in sede.",
    "https://images.unsplash.com/photo-1530191601183-4de2969575ad?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
  ],
];

export function seedDemoData() {
  if (db.aziende.length > 0) return;

  const demoHash = hashPassword("Demo2026!");

  // Demo companies
  for (const a of DEMO_AZIENDE) {
    const uid = newId();
    db.users.push({
      id: uid,
      email: a.email,
      password_hash: demoHash,
      name: a.nome,
      role: "azienda",
      created_at: nowIso(),
    });

    let location: AziendaDoc["location"] | undefined;
    for (const z of a.zone) {
      const coords = CITY_COORDS[z.trim().toLowerCase()];
      if (coords) {
        location = { type: "Point", coordinates: [coords[1], coords[0]] };
        break;
      }
    }

    const em = EMERGENZE_BACKFILL[a.nome] || [false, false, false, ""];

    db.aziende.push({
      id: newId(),
      owner_id: uid,
      nome: a.nome,
      categorie: [...a.categorie],
      zone: [...a.zone],
      piva: a.piva,
      descrizione: a.descrizione,
      telefono: a.telefono,
      sito: "",
      logo: a.logo,
      foto: [],
      docs: [],
      verified: a.verified,
      verification_status: a.verified ? "verificata" : "in_attesa",
      plan: a.plan,
      subscription_status: a.plan === "pro" ? "active" : "none",
      founder50: false,
      emergenze: em[0],
      emergenze_weekend: em[1],
      emergenze_notturno: em[2],
      emergenze_telefono: em[3],
      location,
      rating: a.rating,
      recensioni: a.recensioni,
      created_at: nowIso(),
    });
  }

  // Demo private client + requests + quote
  const clientId = newId();
  db.users.push({
    id: clientId,
    email: "mario.rossi@example.com",
    password_hash: demoHash,
    name: "Mario Rossi",
    role: "privato",
    created_at: nowIso(),
  });

  const r1Id = newId();
  db.richieste.push({
    id: r1Id,
    client_id: clientId,
    client_name: "Mario Rossi",
    titolo: "Sostituzione caldaia in appartamento",
    categoria: "Termoidraulica",
    zona: "Milano",
    budget: "2.000 - 3.000 EUR",
    descrizione:
      "Caldaia da 24 kW da sostituire in appartamento di 90 mq, con manutenzione straordinaria dei radiatori inclusa nel lavoro.",
    stato: "in_lavorazione",
    risposte_count: 1,
    created_at: nowIso(),
  });

  const calore = db.aziende.find((x) => x.nome === "Calore & Clima Srl");
  if (calore) {
    db.risposte.push({
      id: newId(),
      richiesta_id: r1Id,
      azienda_id: calore.id,
      azienda_nome: calore.nome,
      azienda_verified: true,
      prezzo: 2450.0,
      durata_giorni: 3,
      messaggio:
        "Buongiorno Mario, includiamo caldaia a condensazione 24 kW, smaltimento della vecchia unita e collaudo. Intervento in 3 giorni.",
      stato: "inviata",
      created_at: nowIso(),
    });
  }

  db.richieste.push({
    id: newId(),
    client_id: clientId,
    client_name: "Mario Rossi",
    titolo: "Allaccio idrico per lavanderia",
    categoria: "Idraulica",
    zona: "Torino",
    budget: "300 - 600 EUR",
    descrizione:
      "Serve un nuovo allaccio idraulico con scarico per una lavanderia sotto scala, percorrenza tubi circa 6 metri.",
    stato: "aperta",
    risposte_count: 0,
    created_at: nowIso(),
  });

  // Demo rental & used marketplace listings
  for (const [nome, tipo, titolo, cat, zona, prezzo, unita, stato, descr, img] of DEMO_ANNUNCI) {
    const az = db.aziende.find((x) => x.nome === nome);
    if (!az) continue;
    db.annunci.push({
      id: newId(),
      tipo,
      titolo,
      descrizione: descr,
      categoria: cat,
      zona,
      prezzo,
      unita,
      stato,
      attivo: true,
      azienda_id: az.id,
      azienda_nome: az.nome,
      azienda_verified: az.verified,
      azienda_telefono: az.telefono,
      owner_id: az.owner_id,
      foto: [],
      immagine_url: img,
      created_at: nowIso(),
    });
  }
}
