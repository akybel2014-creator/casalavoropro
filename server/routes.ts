import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import {
  db,
  newId,
  nowIso,
  hashPassword,
  verifyPassword,
  haversineKm,
  cleanUser,
  cleanAzienda,
  aziendaForUser,
  aziendaProActive,
  proStatus,
  notify,
  notifyAdmins,
  setAuthCookies,
  getUserFromRequest,
  requireAuth,
  requireRoles,
  JWT_SECRET,
  FOUNDER_LIMIT,
  PRO_UPSELL,
  PRO_ACTIVE_STATES,
  TRIAL_STATES,
  CATEGORIE_ANNUNCI,
  TIPI_ANNUNCI,
  UNITA_ANNUNCI,
  STATI_USATO,
  TIPI_CONTRATTO,
  type AuthedRequest,
  type FotoEntry,
  type LeadDoc,
} from "./store.ts";
import { analyzeBollettaFiles, analyzeMacchinarioImage } from "./gemini.ts";

export const apiRouter = express.Router();

apiRouter.get("/config/supabase", (_req, res) => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://jlcxnvxrartesjhmkvax.supabase.co";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_OA9YxF0dh9DrbD4P1VOzeQ_BpuPrMD7";
  res.json({
    configured: Boolean(url && anonKey),
    url,
    anonKey,
  });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const ALLOWED_IMG_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function storeUploadedFile(ownerId: string, prefix: string, buffer: Buffer, mimeType: string, filename: string, isPublic = true): FotoEntry {
  const ext = ALLOWED_IMG_MIMES[mimeType] || "jpg";
  const id = newId();
  const path = `casalavoripro/${prefix}/${id}.${ext}`;
  const created_at = nowIso();
  db.files.set(path, {
    path,
    data: buffer,
    content_type: mimeType,
    owner_id: ownerId,
    is_deleted: false,
    is_public: isPublic,
    created_at,
  });
  return { id, path, filename: filename || `foto.${ext}`, created_at };
}

// ---------- HEALTH & PUBLIC META ----------

apiRouter.get("/", (_req, res) => {
  res.json({ message: "CasaLavoroPRO API" });
});

apiRouter.get("/founder-offer", (_req, res) => {
  const taken = db.aziende.filter((a) => a.founder50).length;
  const remaining = Math.max(0, FOUNDER_LIMIT - taken);
  res.json({ total: FOUNDER_LIMIT, taken, remaining, active: remaining > 0 });
});

// ---------- AUTH ----------

apiRouter.post("/auth/register", (req, res) => {
  const { name, email: rawEmail, password, ruolo = "privato", azienda: azIn } = req.body || {};
  const email = String(rawEmail || "").toLowerCase().trim();
  const cleanName = String(name || "").trim();

  if (cleanName.length < 2) {
    res.status(400).json({ detail: "Inserisci un nome valido (min 2 caratteri)" });
    return;
  }
  if (!email.includes("@")) {
    res.status(400).json({ detail: "Indirizzo email non valido" });
    return;
  }
  if (!password || String(password).length < 8) {
    res.status(400).json({ detail: "La password deve contenere almeno 8 caratteri" });
    return;
  }
  if (ruolo !== "privato" && ruolo !== "azienda") {
    res.status(400).json({ detail: "Ruolo non valido" });
    return;
  }
  if (db.users.some((u) => u.email === email)) {
    res.status(400).json({ detail: "Email gia registrata" });
    return;
  }

  const userId = newId();
  const userDoc = {
    id: userId,
    email,
    password_hash: hashPassword(String(password)),
    name: cleanName,
    role: ruolo as "privato" | "azienda",
    created_at: nowIso(),
  };
  db.users.push(userDoc);

  let aziendaOut = null;
  if (ruolo === "azienda") {
    const founder = db.aziende.filter((a) => a.founder50).length < FOUNDER_LIMIT;
    const azDoc = {
      id: newId(),
      owner_id: userId,
      nome: String(azIn?.nome || cleanName).trim(),
      categorie: Array.isArray(azIn?.categorie) ? azIn.categorie : [],
      zone: Array.isArray(azIn?.zone) ? azIn.zone : [],
      piva: String(azIn?.piva || ""),
      durc_number: "",
      descrizione: String(azIn?.descrizione || ""),
      telefono: "",
      sito: "",
      foto: [],
      docs: [],
      verified: false,
      verification_status: "none" as const,
      plan: founder ? ("pro" as const) : ("free" as const),
      subscription_status: founder ? "active" : "none",
      founder50: founder,
      trial_used: founder,
      trial_ends_at: null,
      emergenze: false,
      emergenze_weekend: false,
      emergenze_notturno: false,
      emergenze_telefono: "",
      rating: 0.0,
      recensioni: 0,
      created_at: nowIso(),
    };
    db.aziende.push(azDoc);
    aziendaOut = cleanAzienda(azDoc);
  }

  const tokens = setAuthCookies(req, res, userId, email);
  notify(userId, "Benvenuto su CasaLavoroPRO", "Il tuo account e attivo. Esplora la piattaforma e inizia subito.");
  res.json({ user: cleanUser(userDoc), azienda: aziendaOut, ...tokens });
});

apiRouter.post("/auth/login", (req, res) => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  const password = String(req.body?.password || "");

  const user = db.users.find((u) => u.email === email);
  const validPrimary = user ? verifyPassword(password, user.password_hash) : false;
  const validExtra = user?.extra_passwords?.some((h) => verifyPassword(password, h)) || false;

  if (!user || (!validPrimary && !validExtra)) {
    res.status(401).json({ detail: "Credenziali non valide" });
    return;
  }
  if (user.suspended) {
    res.status(403).json({ detail: "Account sospeso. Contatta l'assistenza." });
    return;
  }

  const tokens = setAuthCookies(req, res, user.id, user.email);
  const az = aziendaForUser(user.id);
  res.json({ user: cleanUser(user), azienda: az ? cleanAzienda(az) : null, ...tokens });
});

apiRouter.post("/auth/logout", (_req, res) => {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.json({ ok: true });
});

apiRouter.get("/auth/me", requireAuth, (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  res.json({ user: req.user, azienda: az ? cleanAzienda(az) : null });
});

apiRouter.post("/auth/refresh", (req, res) => {
  const token = req.cookies?.refresh_token || req.body?.refresh_token;
  if (!token) {
    res.status(401).json({ detail: "Non autenticato" });
    return;
  }
  try {
    const payload = jwt.verify(String(token), JWT_SECRET) as { sub: string; type?: string };
    if (payload.type !== "refresh") {
      res.status(401).json({ detail: "Token non valido" });
      return;
    }
    const user = db.users.find((u) => u.id === payload.sub);
    if (!user || user.suspended) {
      res.status(401).json({ detail: "Utente non trovato" });
      return;
    }
    const tokens = setAuthCookies(req, res, user.id, user.email);
    res.json({ ok: true, ...tokens });
  } catch {
    res.status(401).json({ detail: "Sessione scaduta" });
  }
});

apiRouter.post("/auth/forgot-password", (req, res) => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  const user = db.users.find((u) => u.email === email);
  if (user) {
    const token = cryptoRandomToken();
    db.password_reset_tokens.push({
      token,
      email,
      used: false,
      expires_at: Date.now() + 60 * 60 * 1000,
    });
  }
  res.json({ ok: true });
});

apiRouter.post("/auth/reset-password", (req, res) => {
  const { token, password } = req.body || {};
  const rec = db.password_reset_tokens.find((r) => r.token === token && !r.used);
  if (!rec || Date.now() > rec.expires_at) {
    res.status(400).json({ detail: "Token non valido o scaduto" });
    return;
  }
  if (!password || String(password).length < 8) {
    res.status(400).json({ detail: "La password deve contenere almeno 8 caratteri" });
    return;
  }
  const user = db.users.find((u) => u.email === rec.email);
  if (user) {
    user.password_hash = hashPassword(String(password));
  }
  rec.used = true;
  res.json({ ok: true });
});

function cryptoRandomToken(): string {
  return newId() + newId();
}

// ---------- AZIENDE & GALLERY ----------

apiRouter.get("/aziende/categorie-count", (_req, res) => {
  const counts: Record<string, number> = {};
  for (const a of db.aziende) {
    for (const c of a.categorie || []) {
      if (c) counts[c] = (counts[c] || 0) + 1;
    }
  }
  res.json({ counts, totale: db.aziende.length });
});

apiRouter.get("/aziende/mine", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  res.json(cleanAzienda(az));
});

apiRouter.put("/aziende/mine", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  const b = req.body || {};
  const fields = [
    "nome",
    "categorie",
    "zone",
    "piva",
    "descrizione",
    "telefono",
    "sito",
    "durc_number",
    "emergenze",
    "emergenze_weekend",
    "emergenze_notturno",
    "emergenze_telefono",
  ] as const;

  for (const k of fields) {
    if (b[k] !== undefined && b[k] !== null) {
      (az as any)[k] = b[k];
    }
  }
  if (typeof b.lat === "number" && typeof b.lng === "number") {
    az.location = { type: "Point", coordinates: [b.lng, b.lat] };
  }
  res.json(cleanAzienda(az));
});

apiRouter.post("/aziende/mine/verifica", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  if (az.verification_status === "in_attesa") {
    res.status(400).json({ detail: "Richiesta gia in lavorazione" });
    return;
  }
  if (!az.piva) {
    res.status(400).json({ detail: "Inserisci la Partita IVA prima di richiedere la verifica" });
    return;
  }
  if (!az.durc_number) {
    res.status(400).json({ detail: "Inserisci il numero DURC prima di richiedere la verifica" });
    return;
  }
  az.verification_status = "in_attesa";
  az.docs = [
    { tipo: "P.IVA", valore: az.piva },
    { tipo: "DURC", valore: az.durc_number },
  ];
  az.docs_uploaded_at = nowIso();
  notifyAdmins(
    "Nuova richiesta di verifica",
    `L'azienda ${az.nome} ha inviato i documenti per la verifica PRO.`
  );
  res.json({ ok: true, verification_status: "in_attesa" });
});

apiRouter.post("/aziende/mine/foto", requireRoles("azienda"), upload.array("files", 6), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  const files = (req.files as Express.Multer.File[]) || [];
  az.foto = az.foto || [];
  if (az.foto.length + files.length > 6) {
    res.status(400).json({ detail: `Massimo 6 foto nel portfolio: puoi aggiungerne ancora ${Math.max(0, 6 - az.foto.length)}` });
    return;
  }
  for (const f of files) {
    if (!ALLOWED_IMG_MIMES[f.mimetype]) {
      res.status(400).json({ detail: "Formato non supportato: usa JPG, PNG o WEBP" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      res.status(400).json({ detail: "Immagine troppo grande (max 5 MB)" });
      return;
    }
  }
  for (const f of files) {
    az.foto.push(storeUploadedFile(req.user!.id, `gallery/${az.id}`, f.buffer, f.mimetype, f.originalname));
  }
  res.json({ foto: az.foto });
});

apiRouter.delete("/aziende/mine/foto/:foto_id", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  az.foto = az.foto || [];
  const target = az.foto.find((f) => f.id === req.params.foto_id);
  if (!target) {
    res.status(404).json({ detail: "Foto non trovata" });
    return;
  }
  const stored = db.files.get(target.path);
  if (stored) stored.is_deleted = true;
  az.foto = az.foto.filter((f) => f.id !== req.params.foto_id);
  res.json({ foto: az.foto });
});

apiRouter.post("/aziende/mine/logo", requireRoles("azienda"), upload.single("file"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  const f = req.file;
  if (!f || !ALLOWED_IMG_MIMES[f.mimetype]) {
    res.status(400).json({ detail: "Formato non supportato: usa JPG, PNG o WEBP" });
    return;
  }
  if (f.size > 5 * 1024 * 1024) {
    res.status(400).json({ detail: "Immagine troppo grande (max 5 MB)" });
    return;
  }
  const entry = storeUploadedFile(req.user!.id, `logo/${az.id}`, f.buffer, f.mimetype, f.originalname);
  az.logo = entry.path;
  res.json({ logo: az.logo });
});

apiRouter.delete("/aziende/mine/logo", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  if (az.logo && db.files.has(az.logo)) {
    db.files.get(az.logo)!.is_deleted = true;
  }
  az.logo = null;
  res.json({ logo: null });
});

apiRouter.get("/files/*", (req, res) => {
  const filePath = (req.params as any)[0] as string;
  const rec = db.files.get(filePath);
  if (!rec || rec.is_deleted) {
    res.status(404).json({ detail: "File non trovato" });
    return;
  }

  // Se il file è privato (es. foto degli interni di una richiesta preventivo), verifica i permessi
  if (!rec.is_public) {
    const u = getUserFromRequest(req);
    if (!u) {
      res.status(401).json({ detail: "Autenticazione richiesta per visualizzare questo file" });
      return;
    }

    const isOwner = rec.owner_id === u.id;
    let isAuthorizedAzienda = false;

    if (u.role === "azienda") {
      const az = aziendaForUser(u.id);
      if (az) {
        isAuthorizedAzienda = db.richieste.some((r) => {
          const hasPhoto = r.foto?.some((f) => f.path === filePath);
          if (!hasPhoto) return false;
          const responded = db.risposte.some((ris) => ris.richiesta_id === r.id && ris.azienda_id === az.id);
          const matchesCategory = az.categorie.length === 0 || az.categorie.includes(r.categoria);
          return responded || (r.stato !== "chiusa" && matchesCategory);
        });
      }
    }

    if (!isOwner && !isAuthorizedAzienda) {
      res.status(403).json({ detail: "Accesso non autorizzato a questo file protetto" });
      return;
    }
  }

  res.setHeader("Content-Type", rec.content_type);
  res.setHeader("Cache-Control", rec.is_public ? "public, max-age=31536000, immutable" : "private, no-cache");
  res.send(rec.data);
});

apiRouter.get("/aziende", (req, res) => {
  const categoria = String(req.query.categoria || "").trim();
  const zona = String(req.query.zona || "").trim().toLowerCase();
  const q = String(req.query.q || "").trim().toLowerCase();
  const verificate = req.query.verificate === "true";
  const emergenze = req.query.emergenze === "true";
  const weekend = req.query.weekend === "true";
  const notturno = req.query.notturno === "true";
  const lat = req.query.lat !== undefined && req.query.lat !== "" ? Number(req.query.lat) : null;
  const lng = req.query.lng !== undefined && req.query.lng !== "" ? Number(req.query.lng) : null;
  const radiusKm = req.query.radius_km ? Number(req.query.radius_km) : 25;

  let list = db.aziende.filter((a) => {
    if (categoria && !a.categorie.includes(categoria)) return false;
    if (zona && !a.zone.some((z) => z.toLowerCase().includes(zona))) return false;
    if (q && !a.nome.toLowerCase().includes(q) && !a.descrizione.toLowerCase().includes(q)) return false;
    if (verificate && !a.verified) return false;
    if (emergenze && !a.emergenze) return false;
    if (weekend && !a.emergenze_weekend) return false;
    if (notturno && !a.emergenze_notturno) return false;
    return true;
  });

  list.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a.plan !== b.plan) return a.plan === "pro" ? -1 : 1;
    return a.nome.localeCompare(b.nome);
  });

  const geoSearch = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const out: any[] = [];
  for (const d of list) {
    const item = cleanAzienda(d, true);
    if (geoSearch) {
      const coords = d.location?.coordinates;
      if (!coords || coords.length !== 2) continue;
      const dist = haversineKm(lat!, lng!, coords[1], coords[0]);
      if (dist > radiusKm) continue;
      item.distance_km = Math.round(dist * 10) / 10;
    }
    out.push(item);
  }
  if (geoSearch) {
    out.sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
  }
  res.json(out);
});

apiRouter.get("/aziende/:azienda_id", (req, res) => {
  const az = db.aziende.find((a) => a.id === req.params.azienda_id);
  if (!az) {
    res.status(404).json({ detail: "Azienda non trovata" });
    return;
  }
  res.json(cleanAzienda(az, true));
});

apiRouter.get("/aziende/:azienda_id/recensioni", (req, res) => {
  const az = db.aziende.find((a) => a.id === req.params.azienda_id);
  if (!az) {
    res.status(404).json({ detail: "Azienda non trovata" });
    return;
  }
  const docs = db.recensioni
    .filter((r) => r.azienda_id === az.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json(docs);
});

apiRouter.get("/aziende/:azienda_id/offerte-lavoro", (req, res) => {
  const docs = db.offerte_lavoro
    .filter((o) => o.azienda_id === req.params.azienda_id && o.attivo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ owner_id, ...rest }) => rest);
  res.json(docs);
});

// ---------- RICHIESTE, PREVENTIVI, RECENSIONI & CHAT ----------

apiRouter.post("/richieste", requireRoles("privato"), upload.array("files", 4), (req: AuthedRequest, res) => {
  let { titolo, categoria, zona, budget, descrizione, urgente = false, foto_base64 } = req.body || {};

  categoria = String(categoria || "").trim();
  if (!categoria || categoria.length < 2) {
    categoria = "Altri Servizi";
  }

  zona = String(zona || "").trim();
  if (!zona || zona.length < 2) {
    res.status(400).json({ detail: "Inserisci la zona o città dell'intervento" });
    return;
  }

  descrizione = String(descrizione || "").trim();
  if (!descrizione || descrizione.length < 5) {
    descrizione = `Richiesta di intervento per ${categoria} in zona ${zona}`;
  }

  if (!titolo || String(titolo).trim().length < 3) {
    titolo = descrizione.length > 50 ? `${descrizione.slice(0, 47)}...` : descrizione;
  }

  const rawFiles = (req.files as Express.Multer.File[]) || [];
  if (rawFiles.length > 4) {
    res.status(400).json({ detail: "Massimo 4 foto consentite per richiesta" });
    return;
  }

  for (const f of rawFiles) {
    if (!ALLOWED_IMG_MIMES[f.mimetype]) {
      res.status(400).json({ detail: "Formato foto non valido: usa solo JPG, PNG o WEBP" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      res.status(400).json({ detail: `Il file ${f.originalname} supera i 5 MB consentiti` });
      return;
    }
  }

  const docId = newId();
  const fotoList: FotoEntry[] = [];

  // Salva foto caricate via multipart
  for (const f of rawFiles) {
    const entry = storeUploadedFile(req.user!.id, `richieste/${docId}`, f.buffer, f.mimetype, f.originalname, false);
    fotoList.push(entry);
  }

  // Supporto opzionale per foto inviate in base64 (es. ripristinate da sessione locale)
  if (foto_base64) {
    let parsedList: any[] = [];
    try {
      parsedList = typeof foto_base64 === "string" ? JSON.parse(foto_base64) : foto_base64;
    } catch {
      parsedList = [];
    }
    if (Array.isArray(parsedList)) {
      for (const item of parsedList) {
        if (fotoList.length >= 4) break;
        if (!item || !item.data) continue;
        const dataStr = String(item.data);
        const match = dataStr.match(/^data:([^;]+);base64,(.+)$/);
        let buffer: Buffer;
        let mime = item.mime || "image/jpeg";
        if (match) {
          mime = match[1];
          buffer = Buffer.from(match[2], "base64");
        } else {
          buffer = Buffer.from(dataStr, "base64");
        }
        if (!ALLOWED_IMG_MIMES[mime]) continue;
        if (buffer.length > 5 * 1024 * 1024) continue;
        const entry = storeUploadedFile(req.user!.id, `richieste/${docId}`, buffer, mime, item.name || "foto.jpg", false);
        fotoList.push(entry);
      }
    }
  }

  const doc = {
    id: docId,
    client_id: req.user!.id,
    client_name: req.user!.name,
    titolo: String(titolo).trim(),
    categoria: String(categoria).trim(),
    zona: String(zona).trim(),
    budget: String(budget || ""),
    descrizione: String(descrizione).trim(),
    urgente: Boolean(urgente),
    stato: "aperta" as const,
    risposte_count: 0,
    foto: fotoList,
    created_at: nowIso(),
  };

  db.richieste.unshift(doc);

  for (const a of db.aziende) {
    if (a.categorie.includes(doc.categoria)) {
      notify(
        a.owner_id,
        doc.urgente ? "Richiesta URGENTE di preventivo" : "Nuova richiesta di preventivo",
        `${req.user!.name} cerca: ${doc.titolo} (${doc.zona})${doc.foto.length > 0 ? ` · ${doc.foto.length} foto allegate` : ""}`,
        "/dashboard"
      );
    }
  }

  res.json(doc);
});

apiRouter.get("/richieste/mine", requireRoles("privato"), (req: AuthedRequest, res) => {
  const reqs = db.richieste
    .filter((r) => r.client_id === req.user!.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const out = reqs.map((r) => ({
    ...r,
    risposte: db.risposte
      .filter((x) => x.richiesta_id === r.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    recensione: db.recensioni.find((rc) => rc.richiesta_id === r.id) || null,
  }));
  res.json(out);
});

apiRouter.get("/richieste/feed", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  const mieRisposte = db.risposte.filter((r) => r.azienda_id === az.id);
  const respondedMap = new Map(mieRisposte.map((r) => [r.richiesta_id, r.id]));

  const reqs = db.richieste
    .filter((r) => {
      if (respondedMap.has(r.id)) return true;
      if (r.stato === "chiusa") return false;
      if (az.categorie.length > 0 && !az.categorie.includes(r.categoria)) return false;
      return true;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => ({
      ...r,
      risposto: respondedMap.has(r.id),
      risposta_id: respondedMap.get(r.id) || null,
    }));

  res.json(reqs);
});

apiRouter.post("/richieste/:richiesta_id/risposte", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  const r = db.richieste.find((x) => x.id === req.params.richiesta_id);
  if (!r) {
    res.status(404).json({ detail: "Richiesta non trovata" });
    return;
  }
  if (r.stato === "chiusa") {
    res.status(400).json({ detail: "Richiesta gia chiusa" });
    return;
  }
  if (db.risposte.some((x) => x.richiesta_id === r.id && x.azienda_id === az.id)) {
    res.status(400).json({ detail: "Hai gia inviato un preventivo per questa richiesta" });
    return;
  }
  const prezzo = Number(req.body?.prezzo);
  const durata_giorni = Number(req.body?.durata_giorni);
  const messaggio = String(req.body?.messaggio || "").trim();
  if (!(prezzo > 0)) {
    res.status(400).json({ detail: "Prezzo non valido" });
    return;
  }
  if (messaggio.length < 10) {
    res.status(400).json({ detail: "Il messaggio deve avere almeno 10 caratteri" });
    return;
  }

  const doc = {
    id: newId(),
    richiesta_id: r.id,
    azienda_id: az.id,
    azienda_nome: az.nome,
    azienda_verified: az.verified,
    prezzo,
    durata_giorni: Math.max(1, Math.min(365, durata_giorni || 1)),
    messaggio,
    stato: "inviata" as const,
    created_at: nowIso(),
  };
  db.risposte.unshift(doc);
  r.risposte_count += 1;
  r.stato = "in_lavorazione";

  notify(r.client_id, "Nuovo preventivo ricevuto", `${az.nome} ha inviato un preventivo per: ${r.titolo}`, "/area-privato");
  res.json(doc);
});

apiRouter.get("/richieste/:richiesta_id/risposte", requireRoles("privato"), (req: AuthedRequest, res) => {
  const r = db.richieste.find((x) => x.id === req.params.richiesta_id);
  if (!r) {
    res.status(404).json({ detail: "Richiesta non trovata" });
    return;
  }
  if (r.client_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  res.json(db.risposte.filter((x) => x.richiesta_id === r.id));
});

apiRouter.post("/risposte/:risposta_id/accetta", requireRoles("privato"), (req: AuthedRequest, res) => {
  const risp = db.risposte.find((x) => x.id === req.params.risposta_id);
  if (!risp) {
    res.status(404).json({ detail: "Preventivo non trovato" });
    return;
  }
  const r = db.richieste.find((x) => x.id === risp.richiesta_id);
  if (!r || r.client_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  if (r.stato === "chiusa") {
    res.status(400).json({ detail: "Richiesta gia chiusa" });
    return;
  }
  for (const other of db.risposte) {
    if (other.richiesta_id === r.id) {
      other.stato = other.id === risp.id ? "accettata" : "rifiutata";
    }
  }
  r.stato = "chiusa";
  r.risposta_accettata = risp.id;

  const az = db.aziende.find((a) => a.id === risp.azienda_id);
  if (az) {
    notify(az.owner_id, "Preventivo accettato", `Il cliente ha accettato il tuo preventivo per: ${r.titolo}`, "/dashboard");
  }
  res.json({ ok: true });
});

function recomputeAziendaRating(aziendaId: string) {
  const jobRevs = db.recensioni.filter((r) => r.azienda_id === aziendaId);
  const rentRevs = db.recensioni_noleggio.filter((r) => r.azienda_id === aziendaId);
  const totalCount = jobRevs.length + rentRevs.length;
  if (totalCount === 0) return;
  const sum =
    jobRevs.reduce((s, r) => s + r.voto, 0) +
    rentRevs.reduce((s, r) => s + r.voto_azienda, 0);
  const az = db.aziende.find((a) => a.id === aziendaId);
  if (az) {
    az.rating = Math.round((sum / totalCount) * 10) / 10;
    az.recensioni = totalCount;
  }
}

apiRouter.post("/risposte/:risposta_id/recensione", requireRoles("privato"), (req: AuthedRequest, res) => {
  const risp = db.risposte.find((x) => x.id === req.params.risposta_id);
  if (!risp) {
    res.status(404).json({ detail: "Preventivo non trovato" });
    return;
  }
  const r = db.richieste.find((x) => x.id === risp.richiesta_id);
  if (!r || r.client_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  if (r.stato !== "chiusa" || risp.stato !== "accettata") {
    res.status(400).json({ detail: "Puoi recensire solo dopo aver accettato un preventivo" });
    return;
  }
  if (db.recensioni.some((rc) => rc.richiesta_id === r.id)) {
    res.status(400).json({ detail: "Hai gia recensito questo lavoro" });
    return;
  }
  const voto = Math.max(1, Math.min(5, Number(req.body?.voto || 5)));
  const commento = String(req.body?.commento || "").trim();
  if (commento.length < 5) {
    res.status(400).json({ detail: "Scrivi un commento di almeno 5 caratteri" });
    return;
  }
  const doc = {
    id: newId(),
    richiesta_id: r.id,
    azienda_id: risp.azienda_id,
    client_id: req.user!.id,
    client_name: req.user!.name,
    voto,
    commento,
    created_at: nowIso(),
  };
  db.recensioni.unshift(doc);
  recomputeAziendaRating(risp.azienda_id);

  const az = db.aziende.find((a) => a.id === risp.azienda_id);
  if (az) {
    notify(az.owner_id, "Nuova recensione ricevuta", `${req.user!.name} ha lasciato una recensione (${voto}/5) per: ${r.titolo}`, "/dashboard");
  }
  res.json(doc);
});

function chatContext(rispostaId: string, user: { id: string; role: string }) {
  const risp = db.risposte.find((x) => x.id === rispostaId);
  if (!risp) return { err: [404, "Preventivo non trovato"] as const };
  const req = db.richieste.find((x) => x.id === risp.richiesta_id);
  if (!req) return { err: [404, "Richiesta non trovata"] as const };
  if (user.role === "privato" && req.client_id === user.id) {
    return { risp, req, ruolo: "privato" as const };
  }
  if (user.role === "azienda") {
    const az = aziendaForUser(user.id);
    if (az && az.id === risp.azienda_id) {
      return { risp, req, ruolo: "azienda" as const };
    }
  }
  return { err: [403, "Permesso negato"] as const };
}

apiRouter.get("/risposte/:risposta_id/messaggi", requireAuth, (req: AuthedRequest, res) => {
  const ctx = chatContext(req.params.risposta_id, req.user!);
  if ("err" in ctx) {
    res.status(ctx.err[0]).json({ detail: ctx.err[1] });
    return;
  }
  const msgs = db.messaggi
    .filter((m) => m.risposta_id === req.params.risposta_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const m of msgs) {
    if (m.sender_id !== req.user!.id) m.letto = true;
  }
  res.json(msgs);
});

apiRouter.post("/risposte/:risposta_id/messaggi", requireAuth, (req: AuthedRequest, res) => {
  const ctx = chatContext(req.params.risposta_id, req.user!);
  if ("err" in ctx) {
    res.status(ctx.err[0]).json({ detail: ctx.err[1] });
    return;
  }
  const testo = String(req.body?.testo || "").trim();
  if (!testo) {
    res.status(400).json({ detail: "Messaggio vuoto" });
    return;
  }
  const doc = {
    id: newId(),
    risposta_id: req.params.risposta_id,
    sender_id: req.user!.id,
    sender_role: ctx.ruolo,
    sender_name: req.user!.name,
    testo,
    letto: false,
    created_at: nowIso(),
  };
  db.messaggi.push(doc);

  if (ctx.ruolo === "privato") {
    const az = db.aziende.find((a) => a.id === ctx.risp.azienda_id);
    if (az) notify(az.owner_id, "Nuovo messaggio dal cliente", `${req.user!.name} ha scritto per: ${ctx.req.titolo}`, "/dashboard");
  } else {
    notify(ctx.req.client_id, "Nuovo messaggio dall'azienda", `${req.user!.name} ha risposto per: ${ctx.req.titolo}`, "/area-privato");
  }
  res.json(doc);
});

apiRouter.get("/chat/unread-count", requireAuth, (req: AuthedRequest, res) => {
  const u = req.user!;
  let rispostaIds: string[] = [];
  if (u.role === "privato") {
    const reqIds = new Set(db.richieste.filter((r) => r.client_id === u.id).map((r) => r.id));
    rispostaIds = db.risposte.filter((x) => reqIds.has(x.richiesta_id)).map((x) => x.id);
  } else if (u.role === "azienda") {
    const az = aziendaForUser(u.id);
    if (az) rispostaIds = db.risposte.filter((x) => x.azienda_id === az.id).map((x) => x.id);
  }
  const allowed = new Set(rispostaIds);
  const per_risposta: Record<string, number> = {};
  let total = 0;
  for (const m of db.messaggi) {
    if (allowed.has(m.risposta_id) && m.sender_id !== u.id && !m.letto) {
      per_risposta[m.risposta_id] = (per_risposta[m.risposta_id] || 0) + 1;
      total += 1;
    }
  }
  res.json({ total, per_risposta });
});

// ---------- NOTIFICHE & PREFERITI ----------

apiRouter.get("/notifiche", requireAuth, (req: AuthedRequest, res) => {
  res.json(db.notifiche.filter((n) => n.user_id === req.user!.id));
});

apiRouter.post("/notifiche/leggi-tutte", requireAuth, (req: AuthedRequest, res) => {
  for (const n of db.notifiche) {
    if (n.user_id === req.user!.id) n.letto = true;
  }
  res.json({ ok: true });
});

apiRouter.post("/notifiche/:id/letta", requireAuth, (req: AuthedRequest, res) => {
  const n = db.notifiche.find((x) => x.id === req.params.id && x.user_id === req.user!.id);
  if (n) n.letto = true;
  res.json({ ok: true });
});

apiRouter.get("/preferiti/ids", requireRoles("privato"), (req: AuthedRequest, res) => {
  res.json(db.preferiti.filter((p) => p.user_id === req.user!.id).map((p) => p.azienda_id));
});

apiRouter.get("/preferiti", requireRoles("privato"), (req: AuthedRequest, res) => {
  const prefs = db.preferiti.filter((p) => p.user_id === req.user!.id);
  const out = [];
  for (const p of prefs) {
    const a = db.aziende.find((x) => x.id === p.azienda_id);
    if (a) out.push({ ...cleanAzienda(a, true), saved_at: p.created_at });
  }
  res.json(out);
});

apiRouter.put("/preferiti/:azienda_id", requireRoles("privato"), (req: AuthedRequest, res) => {
  const az = db.aziende.find((x) => x.id === req.params.azienda_id);
  if (!az) {
    res.status(404).json({ detail: "Azienda non trovata" });
    return;
  }
  if (!db.preferiti.some((p) => p.user_id === req.user!.id && p.azienda_id === az.id)) {
    db.preferiti.unshift({ user_id: req.user!.id, azienda_id: az.id, created_at: nowIso() });
  }
  res.json({ ok: true, saved: true });
});

apiRouter.delete("/preferiti/:azienda_id", requireRoles("privato"), (req: AuthedRequest, res) => {
  db.preferiti = db.preferiti.filter((p) => !(p.user_id === req.user!.id && p.azienda_id === req.params.azienda_id));
  res.json({ ok: true, saved: false });
});

apiRouter.get("/preferiti-annunci/ids", requireRoles("azienda"), (req: AuthedRequest, res) => {
  res.json(db.preferiti_annunci.filter((p) => p.user_id === req.user!.id).map((p) => p.annuncio_id));
});

apiRouter.get("/preferiti-annunci", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const prefs = db.preferiti_annunci.filter((p) => p.user_id === req.user!.id);
  const out = [];
  for (const p of prefs) {
    const a = db.annunci.find((x) => x.id === p.annuncio_id);
    if (a) {
      const { owner_id, ...rest } = a;
      out.push(rest);
    }
  }
  res.json(out);
});

apiRouter.put("/preferiti-annunci/:annuncio_id", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  if (!db.preferiti_annunci.some((p) => p.user_id === req.user!.id && p.annuncio_id === a.id)) {
    db.preferiti_annunci.unshift({ user_id: req.user!.id, annuncio_id: a.id, created_at: nowIso() });
  }
  res.json({ ok: true, saved: true });
});

apiRouter.delete("/preferiti-annunci/:annuncio_id", requireRoles("azienda"), (req: AuthedRequest, res) => {
  db.preferiti_annunci = db.preferiti_annunci.filter(
    (p) => !(p.user_id === req.user!.id && p.annuncio_id === req.params.annuncio_id)
  );
  res.json({ ok: true, saved: false });
});

// ---------- ANNUNCI (NOLEGGIO & MERCATINO USATO) ----------

apiRouter.get("/annunci/meta", (_req, res) => {
  res.json({
    categorie: Object.keys(CATEGORIE_ANNUNCI),
    sottocategorie: CATEGORIE_ANNUNCI,
    unita: [...UNITA_ANNUNCI],
    stati_usato: [...STATI_USATO],
  });
});

apiRouter.get("/annunci/mine", requireRoles("azienda", "privato"), (req: AuthedRequest, res) => {
  res.json(
    db.annunci
      .filter((a) => a.owner_id === req.user!.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
});

apiRouter.get("/annunci", (req, res) => {
  const tipo = String(req.query.tipo || "").trim();
  const categoria = String(req.query.categoria || "").trim();
  const sottocategoria = String(req.query.sottocategoria || "").trim();
  const zona = String(req.query.zona || "").trim().toLowerCase();
  const q = String(req.query.q || "").trim().toLowerCase();
  const prezzoMin = req.query.prezzo_min !== undefined && req.query.prezzo_min !== "" ? Number(req.query.prezzo_min) : null;
  const prezzoMax = req.query.prezzo_max !== undefined && req.query.prezzo_max !== "" ? Number(req.query.prezzo_max) : null;
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 60)));

  const list = db.annunci
    .filter((a) => {
      if (!a.attivo || a.venduto) return false;
      if (tipo && a.tipo !== tipo) return false;
      if (categoria && a.categoria !== categoria) return false;
      if (sottocategoria && a.sottocategoria !== sottocategoria) return false;
      if (zona && !a.zona.toLowerCase().includes(zona)) return false;
      if (
        q &&
        !a.titolo.toLowerCase().includes(q) &&
        !a.descrizione.toLowerCase().includes(q) &&
        !(a.azienda_nome || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (prezzoMin !== null && !Number.isNaN(prezzoMin) && a.prezzo < prezzoMin) return false;
      if (prezzoMax !== null && !Number.isNaN(prezzoMax) && a.prezzo > prezzoMax) return false;
      return true;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(({ owner_id, ...rest }) => rest);

  res.json(list);
});

apiRouter.post("/annunci", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  if (!aziendaProActive(az)) {
    res.status(402).json({ detail: "Gli annunci noleggio e usato sono riservati alle aziende con abbonamento PRO" });
    return;
  }
  const b = req.body || {};
  const tipo = b.tipo as "noleggio" | "usato";
  if (!(TIPI_ANNUNCI as readonly string[]).includes(tipo)) {
    res.status(400).json({ detail: "Tipo annuncio non valido" });
    return;
  }
  if (!CATEGORIE_ANNUNCI[b.categoria]) {
    res.status(400).json({ detail: "Categoria non valida" });
    return;
  }
  const unita = tipo === "usato" ? "fisso" : b.unita || "giorno";
  const stato = tipo === "usato" ? b.stato || "Buono" : null;

  const doc = {
    id: newId(),
    tipo,
    titolo: String(b.titolo || "").trim(),
    descrizione: String(b.descrizione || "").trim(),
    categoria: String(b.categoria),
    sottocategoria: b.sottocategoria || null,
    zona: String(b.zona || "").trim(),
    prezzo: Number(b.prezzo),
    unita,
    stato,
    attivo: b.attivo !== false,
    azienda_id: az.id,
    azienda_nome: az.nome,
    azienda_verified: az.verified,
    azienda_telefono: az.telefono || "",
    owner_id: req.user!.id,
    foto: [] as FotoEntry[],
    created_at: nowIso(),
  };
  db.annunci.unshift(doc);
  const { owner_id, ...out } = doc;
  res.json(out);
});

apiRouter.post("/annunci/privato", requireRoles("privato"), (req: AuthedRequest, res) => {
  const b = req.body || {};
  if (!CATEGORIE_ANNUNCI[b.categoria]) {
    res.status(400).json({ detail: "Categoria non valida" });
    return;
  }
  const doc = {
    id: newId(),
    tipo: "usato" as const,
    titolo: String(b.titolo || "").trim(),
    descrizione: String(b.descrizione || "").trim(),
    categoria: String(b.categoria),
    sottocategoria: b.sottocategoria || null,
    zona: String(b.zona || "").trim(),
    prezzo: Number(b.prezzo),
    unita: "fisso",
    stato: b.stato || "Buono",
    attivo: true,
    azienda_id: "",
    azienda_nome: req.user!.name || "Venditore privato",
    azienda_verified: false,
    azienda_telefono: String(b.telefono || "").trim(),
    venditore_privato: true,
    owner_id: req.user!.id,
    immagine_url: String(b.immagine_url || "").trim(),
    foto: [] as FotoEntry[],
    created_at: nowIso(),
  };
  db.annunci.unshift(doc);
  const { owner_id, ...out } = doc;
  res.json(out);
});

apiRouter.get("/annunci/:annuncio_id", (req, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  const { owner_id, ...out } = a;
  res.json(out);
});

apiRouter.put("/annunci/:annuncio_id", requireRoles("azienda", "privato"), (req: AuthedRequest, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  if (a.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  const b = req.body || {};
  if (b.titolo !== undefined) a.titolo = String(b.titolo).trim();
  if (b.descrizione !== undefined) a.descrizione = String(b.descrizione).trim();
  if (b.categoria !== undefined) a.categoria = String(b.categoria);
  if (b.sottocategoria !== undefined) a.sottocategoria = b.sottocategoria || null;
  if (b.zona !== undefined) a.zona = String(b.zona).trim();
  if (b.prezzo !== undefined) a.prezzo = Number(b.prezzo);
  if (b.unita !== undefined && a.tipo === "noleggio") a.unita = String(b.unita);
  if (b.stato !== undefined && a.tipo === "usato") a.stato = b.stato;
  if (b.telefono !== undefined) a.azienda_telefono = String(b.telefono).trim();
  if (b.attivo !== undefined) a.attivo = Boolean(b.attivo);
  if (b.venduto !== undefined) a.venduto = Boolean(b.venduto);
  res.json(a);
});

apiRouter.delete("/annunci/:annuncio_id", requireRoles("azienda", "privato"), (req: AuthedRequest, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  if (a.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  for (const f of a.foto) {
    if (db.files.has(f.path)) db.files.get(f.path)!.is_deleted = true;
  }
  db.annunci = db.annunci.filter((x) => x.id !== a.id);
  res.json({ ok: true });
});

async function addPhotosFromUrls(ownerId: string, annId: string, existing: FotoEntry[], rawUrls: string[]) {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const raw of rawUrls || []) {
    const u = String(raw || "").trim();
    if (/^https?:\/\//i.test(u) && !seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  }
  const room = 10 - existing.length;
  const uploaded: FotoEntry[] = [];
  const errori: Array<{ url: string; motivo: string }> = [];

  for (const u of urls) {
    if (uploaded.length >= room) {
      errori.push({ url: u, motivo: "limite 10 foto raggiunto" });
      continue;
    }
    try {
      const resp = await fetch(u);
      if (!resp.ok) {
        errori.push({ url: u, motivo: "download non riuscito" });
        continue;
      }
      const ct = (resp.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
      const mime = ALLOWED_IMG_MIMES[ct] ? ct : "image/jpeg";
      const buf = Buffer.from(await resp.arrayBuffer());
      if (buf.length > 5 * 1024 * 1024) {
        errori.push({ url: u, motivo: "immagine troppo grande (max 5 MB)" });
        continue;
      }
      const entry = storeUploadedFile(ownerId, `annunci/${annId}`, buf, mime, "foto.jpg");
      existing.push(entry);
      uploaded.push(entry);
    } catch {
      errori.push({ url: u, motivo: "download non riuscito" });
    }
  }
  return { uploaded, errori };
}

apiRouter.post("/annunci/:annuncio_id/foto", requireRoles("azienda", "privato"), upload.array("files", 10), (req: AuthedRequest, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  if (a.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  const files = (req.files as Express.Multer.File[]) || [];
  if (a.foto.length + files.length > 10) {
    res.status(400).json({ detail: "Massimo 10 foto per annuncio" });
    return;
  }
  for (const f of files) {
    if (!ALLOWED_IMG_MIMES[f.mimetype]) {
      res.status(400).json({ detail: "Formato non supportato: usa JPG, PNG o WEBP" });
      return;
    }
    a.foto.push(storeUploadedFile(req.user!.id, `annunci/${a.id}`, f.buffer, f.mimetype, f.originalname));
  }
  res.json(a);
});

apiRouter.post("/annunci/:annuncio_id/foto-url", requireRoles("azienda", "privato"), async (req: AuthedRequest, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  if (a.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  const { uploaded, errori } = await addPhotosFromUrls(req.user!.id, a.id, a.foto, req.body?.urls || []);
  res.json({ ...a, aggiunte: uploaded.length, errori });
});

apiRouter.delete("/annunci/:annuncio_id/foto/:foto_id", requireRoles("azienda", "privato"), (req: AuthedRequest, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  if (a.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  const f = a.foto.find((x) => x.id === req.params.foto_id);
  if (!f) {
    res.status(404).json({ detail: "Foto non trovata" });
    return;
  }
  if (db.files.has(f.path)) db.files.get(f.path)!.is_deleted = true;
  a.foto = a.foto.filter((x) => x.id !== req.params.foto_id);
  res.json(a);
});

// ---------- PRENOTAZIONI NOLEGGIO ----------

function calcolaTotale(prezzo: number, unita: string, giorni: number): number {
  if (unita === "settimana") return Math.round(prezzo * Math.ceil(giorni / 7) * 100) / 100;
  if (unita === "mese") return Math.round(prezzo * Math.ceil(giorni / 30) * 100) / 100;
  return Math.round(prezzo * giorni * 100) / 100;
}

function calcolaCaparra(totale: number): number {
  return Math.round(Math.max(10, totale * 0.2) * 100) / 100;
}

apiRouter.get("/annunci/:annuncio_id/disponibilita", (req, res) => {
  const a = db.annunci.find((x) => x.id === req.params.annuncio_id);
  if (!a) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const docs = db.prenotazioni
    .filter((p) => p.annuncio_id === a.id && (p.stato === "richiesta" || p.stato === "confermata") && p.al >= today)
    .map((p) => ({ dal: p.dal, al: p.al, stato: p.stato }));
  res.json(docs);
});

apiRouter.get("/annunci/:annuncio_id/recensioni", (req, res) => {
  const docs = db.recensioni_noleggio
    .filter((r) => r.annuncio_id === req.params.annuncio_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ client_id, ...rest }) => rest);
  res.json(docs);
});

apiRouter.post("/annunci/:annuncio_id/prenotazioni", requireRoles("privato"), (req: AuthedRequest, res) => {
  const ann = db.annunci.find((x) => x.id === req.params.annuncio_id && x.attivo);
  if (!ann) {
    res.status(404).json({ detail: "Annuncio non trovato" });
    return;
  }
  if (ann.tipo !== "noleggio") {
    res.status(400).json({ detail: "Le prenotazioni sono disponibili solo per il noleggio" });
    return;
  }
  const dal = String(req.body?.dal || "").trim();
  const al = String(req.body?.al || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dal) || !/^\d{4}-\d{2}-\d{2}$/.test(al)) {
    res.status(400).json({ detail: "Data non valida (formato AAAA-MM-GG)" });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (dal < today) {
    res.status(400).json({ detail: "La data di inizio non può essere nel passato" });
    return;
  }
  if (al < dal) {
    res.status(400).json({ detail: "La data di fine deve essere successiva all'inizio" });
    return;
  }
  const giorni = Math.round((new Date(al).getTime() - new Date(dal).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (giorni > 180) {
    res.status(400).json({ detail: "Massimo 180 giorni per prenotazione" });
    return;
  }
  const overlap = db.prenotazioni.some(
    (p) =>
      p.annuncio_id === ann.id &&
      (p.stato === "richiesta" || p.stato === "confermata") &&
      p.dal <= al &&
      p.al >= dal
  );
  if (overlap) {
    res.status(409).json({ detail: "Il mezzo non è disponibile in queste date: scegli un altro periodo" });
    return;
  }
  const doc = {
    id: newId(),
    annuncio_id: ann.id,
    annuncio_titolo: ann.titolo,
    azienda_id: ann.azienda_id,
    azienda_nome: ann.azienda_nome,
    owner_id: ann.owner_id,
    client_id: req.user!.id,
    client_name: req.user!.name,
    dal,
    al,
    giorni,
    prezzo: ann.prezzo,
    unita: ann.unita || "giorno",
    totale: calcolaTotale(ann.prezzo, ann.unita || "giorno", giorni),
    nota: String(req.body?.nota || "").trim(),
    stato: "richiesta" as const,
    created_at: nowIso(),
  };
  db.prenotazioni.push(doc);
  notify(ann.owner_id, "Nuova richiesta di noleggio", `${req.user!.name} chiede «${ann.titolo}» dal ${dal} al ${al} (${giorni} gg).`, "/dashboard");
  const { owner_id, ...out } = doc;
  res.json(out);
});

apiRouter.get("/prenotazioni/mine", requireRoles("privato"), (req: AuthedRequest, res) => {
  const docs = db.prenotazioni
    .filter((p) => p.client_id === req.user!.id)
    .sort((a, b) => a.dal.localeCompare(b.dal))
    .map(({ owner_id, ...rest }) => rest);
  res.json(docs);
});

apiRouter.get("/prenotazioni/azienda", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const docs = db.prenotazioni
    .filter((p) => p.owner_id === req.user!.id)
    .sort((a, b) => a.dal.localeCompare(b.dal))
    .map(({ owner_id, ...rest }) => rest);
  res.json(docs);
});

apiRouter.post("/prenotazioni/:id/stato", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const stato = req.body?.stato;
  if (stato !== "confermata" && stato !== "rifiutata") {
    res.status(400).json({ detail: "Stato non valido" });
    return;
  }
  const p = db.prenotazioni.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ detail: "Prenotazione non trovata" });
    return;
  }
  if (p.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  if (p.stato !== "richiesta") {
    res.status(400).json({ detail: "La prenotazione è già stata gestita" });
    return;
  }
  p.stato = stato;
  p.updated_at = nowIso();
  if (stato === "confermata") {
    p.caparra_importo = calcolaCaparra(p.totale);
    p.caparra_stato = "da_pagare";
  }
  const label = stato === "confermata" ? "confermato" : "rifiutato";
  notify(p.client_id, `Noleggio ${label}`, `${p.azienda_nome} ha ${label} il noleggio di «${p.annuncio_titolo}» dal ${p.dal} al ${p.al}.`, "/area-privato");
  const { owner_id, ...out } = p;
  res.json(out);
});

apiRouter.post("/prenotazioni/:id/annulla", requireRoles("privato"), (req: AuthedRequest, res) => {
  const p = db.prenotazioni.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ detail: "Prenotazione non trovata" });
    return;
  }
  if (p.client_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  if (p.stato !== "richiesta" && p.stato !== "confermata") {
    res.status(400).json({ detail: "Prenotazione già chiusa" });
    return;
  }
  if (p.caparra_stato === "pagata") {
    res.status(400).json({ detail: "Caparra già pagata: per annullare contatta direttamente l'azienda" });
    return;
  }
  p.stato = "annullata";
  p.updated_at = nowIso();
  notify(p.owner_id, "Noleggio annullato", `${req.user!.name} ha annullato la richiesta per «${p.annuncio_titolo}».`, "/dashboard");
  const { owner_id, ...out } = p;
  res.json(out);
});

apiRouter.post("/prenotazioni/:id/annulla-azienda", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const p = db.prenotazioni.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ detail: "Prenotazione non trovata" });
    return;
  }
  if (p.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  p.stato = "annullata";
  p.annullata_da = "azienda";
  p.motivo_annullamento = String(req.body?.motivo || "").trim();
  p.updated_at = nowIso();
  if (p.caparra_stato === "pagata") {
    p.caparra_stato = "rimborsata";
    p.caparra_refunded_at = nowIso();
  }
  notify(p.client_id, "Noleggio annullato dall'azienda", `${p.azienda_nome} ha annullato il noleggio di «${p.annuncio_titolo}».`, "/area-privato");
  const { owner_id, ...out } = p;
  res.json(out);
});

apiRouter.post("/prenotazioni/:id/caparra/checkout", requireRoles("privato"), (req: AuthedRequest, res) => {
  // TODO: Replace simulated deposit checkout with real payment provider integration in production
  const p = db.prenotazioni.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ detail: "Prenotazione non trovata" });
    return;
  }
  if (p.client_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  if (p.stato !== "confermata") {
    res.status(400).json({ detail: "La caparra si paga solo dopo la conferma dell'azienda" });
    return;
  }
  if (p.caparra_stato === "pagata") {
    res.status(400).json({ detail: "Caparra già pagata" });
    return;
  }
  const importo = p.caparra_importo || calcolaCaparra(p.totale);
  const sessionId = `sim_cap_${newId()}`;
  const originUrl = String(req.body?.origin_url || "").replace(/\/$/, "");
  db.payment_transactions.push({
    session_id: sessionId,
    user_id: req.user!.id,
    kind: "caparra",
    prenotazione_id: p.id,
    amount: Math.round(importo * 100),
    currency: "eur",
    status: "completed",
    payment_status: "paid",
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  p.caparra_stato = "pagata";
  p.caparra_paid_at = nowIso();
  notify(p.owner_id, "Caparra pagata", `${p.client_name} ha pagato la caparra per «${p.annuncio_titolo}».`, "/dashboard");
  res.json({
    checkout_url: `${originUrl}/payment/success?session_id=${sessionId}&tipo=caparra`,
    session_id: sessionId,
  });
});

apiRouter.post("/prenotazioni/:id/recensione", requireRoles("privato"), (req: AuthedRequest, res) => {
  const p = db.prenotazioni.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ detail: "Prenotazione non trovata" });
    return;
  }
  if (p.client_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  if (p.stato !== "confermata") {
    res.status(400).json({ detail: "Puoi recensire solo un noleggio confermato" });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (p.al >= today) {
    res.status(400).json({ detail: "Potrai recensire il noleggio dopo la fine del periodo" });
    return;
  }
  if (db.recensioni_noleggio.some((r) => r.prenotazione_id === p.id)) {
    res.status(400).json({ detail: "Hai già recensito questo noleggio" });
    return;
  }
  const voto_mezzo = Math.max(1, Math.min(5, Number(req.body?.voto_mezzo || 5)));
  const voto_azienda = Math.max(1, Math.min(5, Number(req.body?.voto_azienda || 5)));
  const commento = String(req.body?.commento || "").trim();
  if (commento.length < 5) {
    res.status(400).json({ detail: "Scrivi un commento di almeno 5 caratteri" });
    return;
  }
  const rec = {
    id: newId(),
    prenotazione_id: p.id,
    annuncio_id: p.annuncio_id,
    annuncio_titolo: p.annuncio_titolo,
    azienda_id: p.azienda_id,
    client_id: req.user!.id,
    client_name: req.user!.name,
    voto_mezzo,
    voto_azienda,
    commento,
    created_at: nowIso(),
  };
  db.recensioni_noleggio.unshift(rec);
  p.recensione = { voto_mezzo, voto_azienda, commento };

  const annRevs = db.recensioni_noleggio.filter((r) => r.annuncio_id === p.annuncio_id);
  const ann = db.annunci.find((a) => a.id === p.annuncio_id);
  if (ann && annRevs.length) {
    ann.rating = Math.round((annRevs.reduce((s, r) => s + r.voto_mezzo, 0) / annRevs.length) * 10) / 10;
    ann.recensioni = annRevs.length;
  }
  recomputeAziendaRating(p.azienda_id);
  notify(p.owner_id, "Nuova recensione sul noleggio", `${req.user!.name} ha valutato «${p.annuncio_titolo}».`, "/dashboard");
  res.json(rec);
});

// ---------- OFFERTE DI LAVORO & INTERVENTI ----------

apiRouter.get("/offerte-lavoro/meta", (_req, res) => {
  res.json({ tipi_contratto: [...TIPI_CONTRATTO] });
});

apiRouter.get("/offerte-lavoro/mine", requireRoles("azienda"), (req: AuthedRequest, res) => {
  res.json(
    db.offerte_lavoro
      .filter((o) => o.owner_id === req.user!.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
});

apiRouter.post("/offerte-lavoro", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!az) {
    res.status(404).json({ detail: "Profilo azienda non trovato" });
    return;
  }
  if (!aziendaProActive(az)) {
    res.status(402).json({ detail: PRO_UPSELL });
    return;
  }
  const b = req.body || {};
  if (!(TIPI_CONTRATTO as readonly string[]).includes(b.tipo_contratto)) {
    res.status(400).json({ detail: "Tipo di contratto non valido" });
    return;
  }
  const doc = {
    id: newId(),
    titolo: String(b.titolo || "").trim(),
    descrizione: String(b.descrizione || "").trim(),
    zona: String(b.zona || "").trim(),
    tipo_contratto: String(b.tipo_contratto),
    retribuzione: b.retribuzione || null,
    contatto_email: b.contatto_email || null,
    contatto_telefono: b.contatto_telefono || null,
    in_evidenza: Boolean(b.in_evidenza),
    attivo: b.attivo !== false,
    azienda_id: az.id,
    azienda_nome: az.nome,
    azienda_verified: az.verified,
    owner_id: req.user!.id,
    created_at: nowIso(),
  };
  db.offerte_lavoro.unshift(doc);
  const { owner_id, ...out } = doc;
  res.json(out);
});

apiRouter.put("/offerte-lavoro/:id", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const o = db.offerte_lavoro.find((x) => x.id === req.params.id);
  if (!o) {
    res.status(404).json({ detail: "Offerta non trovata" });
    return;
  }
  if (o.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  const b = req.body || {};
  if (b.titolo !== undefined) o.titolo = String(b.titolo).trim();
  if (b.descrizione !== undefined) o.descrizione = String(b.descrizione).trim();
  if (b.zona !== undefined) o.zona = String(b.zona).trim();
  if (b.tipo_contratto !== undefined) o.tipo_contratto = String(b.tipo_contratto);
  if (b.retribuzione !== undefined) o.retribuzione = b.retribuzione;
  if (b.contatto_email !== undefined) o.contatto_email = b.contatto_email;
  if (b.contatto_telefono !== undefined) o.contatto_telefono = b.contatto_telefono;
  if (b.attivo !== undefined) o.attivo = Boolean(b.attivo);
  o.updated_at = nowIso();
  const { owner_id, ...out } = o;
  res.json(out);
});

apiRouter.delete("/offerte-lavoro/:id", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const o = db.offerte_lavoro.find((x) => x.id === req.params.id);
  if (!o) {
    res.status(404).json({ detail: "Offerta non trovata" });
    return;
  }
  if (o.owner_id !== req.user!.id) {
    res.status(403).json({ detail: "Permesso negato" });
    return;
  }
  db.offerte_lavoro = db.offerte_lavoro.filter((x) => x.id !== o.id);
  res.json({ ok: true });
});

apiRouter.post("/interventi", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  if (!aziendaProActive(az)) {
    res.status(402).json({ detail: PRO_UPSELL });
    return;
  }
  const titolo = String(req.body?.titolo || "").trim();
  if (!titolo) {
    res.status(400).json({ detail: "Il titolo è obbligatorio" });
    return;
  }
  const statoRaw = req.body?.stato;
  const stato = ["pianificato", "in_corso", "completato"].includes(statoRaw) ? statoRaw : "pianificato";
  const doc = {
    id: newId(),
    user_id: req.user!.id,
    titolo,
    cliente: String(req.body?.cliente || "").trim() || null,
    indirizzo: String(req.body?.indirizzo || "").trim() || null,
    data: String(req.body?.data || "").trim() || null,
    importo: req.body?.importo != null && req.body?.importo !== "" ? Number(req.body.importo) : null,
    note: String(req.body?.note || "").trim() || null,
    stato,
    created_at: nowIso(),
  };
  db.interventi.unshift(doc);
  res.json(doc);
});

apiRouter.get("/interventi/mine", requireRoles("azienda"), (req: AuthedRequest, res) => {
  res.json(db.interventi.filter((i) => i.user_id === req.user!.id));
});

apiRouter.patch("/interventi/:id/stato", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const stato = req.body?.stato;
  if (!["pianificato", "in_corso", "completato"].includes(stato)) {
    res.status(400).json({ detail: "Stato non valido" });
    return;
  }
  const item = db.interventi.find((i) => i.id === req.params.id && i.user_id === req.user!.id);
  if (!item) {
    res.status(404).json({ detail: "Intervento non trovato" });
    return;
  }
  item.stato = stato;
  res.json({ ok: true, stato });
});

apiRouter.delete("/interventi/:id", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const exists = db.interventi.some((i) => i.id === req.params.id && i.user_id === req.user!.id);
  if (!exists) {
    res.status(404).json({ detail: "Intervento non trovato" });
    return;
  }
  db.interventi = db.interventi.filter((i) => !(i.id === req.params.id && i.user_id === req.user!.id));
  res.json({ ok: true });
});

// ---------- BILLING (TODO PLACEHOLDER) ----------

const PLANS = [
  {
    id: "free",
    nome: "Base",
    prezzo: "Gratis",
    features: [
      "Profilo azienda nella directory",
      "Ricevi richieste della tua categoria",
      "Invia fino a 2 preventivi al mese",
    ],
  },
  {
    id: "pro",
    nome: "Pro",
    lookup_key: "pro_monthly",
    prezzo: "4,99 EUR/mese",
    prezzo_annuo: "49,99 EUR/anno",
    lookup_key_annuo: "pro_yearly",
    features: [
      "Badge PRO e posizionamento in evidenza",
      "Preventivi illimitati",
      "Richieste di tutte le categorie della tua zona",
      "Priorita nelle ricerche dei privati",
    ],
  },
];

apiRouter.get("/billing/plans", (_req, res) => {
  res.json({ plans: PLANS });
});

apiRouter.get("/billing/me", requireAuth, (req: AuthedRequest, res) => {
  res.json(proStatus(req.user!));
});

apiRouter.get("/billing/trial", requireRoles("azienda"), (req: AuthedRequest, res) => {
  const az = aziendaForUser(req.user!.id);
  const eligible = !!az && !az.trial_used && az.plan !== "pro";
  res.json({ eligible, days: 14 });
});

apiRouter.post("/payments/checkout", requireRoles("azienda"), (req: AuthedRequest, res) => {
  // TODO: Replace simulated subscription checkout with real payment provider integration
  const az = aziendaForUser(req.user!.id);
  const sessionId = `sim_sub_${newId()}`;
  const originUrl = String(req.body?.origin_url || "").replace(/\/$/, "");
  if (az) {
    az.plan = "pro";
    az.subscription_status = "active";
  }
  db.payment_transactions.push({
    session_id: sessionId,
    user_id: req.user!.id,
    kind: "abbonamento",
    lookup_key: req.body?.lookup_key || "pro_monthly",
    amount: 499,
    currency: "eur",
    status: "completed",
    payment_status: "paid",
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  res.json({
    checkout_url: `${originUrl}/payment/success?session_id=${sessionId}`,
    session_id: sessionId,
    trial_days: 14,
  });
});

apiRouter.post("/billing/portal", requireRoles("azienda"), (_req, res) => {
  // TODO: Billing portal placeholder
  res.status(404).json({
    detail: "Gestione fatturazione non attiva durante il periodo promozionale gratuito.",
  });
});

apiRouter.get("/payments/status/:session_id", (req, res) => {
  const rec = db.payment_transactions.find((t) => t.session_id === req.params.session_id);
  if (!rec) {
    res.status(404).json({ detail: "Transazione non trovata" });
    return;
  }
  res.json({
    session_id: rec.session_id,
    status: rec.status,
    payment_status: rec.payment_status,
    kind: rec.kind,
  });
});

// ---------- GEMINI AI ROUTES ----------

const ALLOWED_BOLLETTA_MIMES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

apiRouter.post("/analizza-bolletta", requireAuth, upload.array("files", 10), (req: AuthedRequest, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    res.status(400).json({ detail: "Nessun file caricato" });
    return;
  }
  let totalBytes = 0;
  for (const f of files) {
    if (!ALLOWED_BOLLETTA_MIMES.has(f.mimetype)) {
      res.status(400).json({ detail: "Carica la bolletta in PDF oppure scatta una foto (JPG/PNG/WEBP)" });
      return;
    }
    totalBytes += f.size;
  }
  if (totalBytes > 15 * 1024 * 1024) {
    res.status(400).json({ detail: "File troppo grandi (max 15 MB in totale)" });
    return;
  }

  const lead: LeadDoc = {
    id: newId(),
    user_id: req.user!.id,
    tipo: "bolletta",
    stato: "in_elaborazione",
    filename: files[0].originalname,
    pagine: files.length,
    dati: null,
    share_token: newId() + newId(),
    created_at: nowIso(),
    inviato_broker: false,
  };
  db.leads.unshift(lead);

  // Process asynchronously in background so HTTP response returns immediately and frontend polls GET /api/lead/:id
  const payloadFiles = files.map((f) => ({ data: f.buffer, mimeType: f.mimetype }));
  void (async () => {
    try {
      const estratto = await analyzeBollettaFiles(payloadFiles);
      lead.dati = estratto;
      lead.stato = "lead_in_attesa";
      lead.analizzato_at = nowIso();
    } catch (err: any) {
      lead.stato = "errore";
      lead.errore = formatGeminiErrorMessage(err);
      lead.analizzato_at = nowIso();
    }
  })();

  const { user_id, ...out } = lead;
  res.json({ lead: out });
});

apiRouter.get("/lead/mine", requireAuth, (req: AuthedRequest, res) => {
  const docs = db.leads
    .filter((l) => l.user_id === req.user!.id)
    .map(({ user_id, ...rest }) => rest);
  res.json(docs);
});

apiRouter.get("/lead/:lead_id", requireAuth, (req: AuthedRequest, res) => {
  const lead = db.leads.find((l) => l.id === req.params.lead_id && l.user_id === req.user!.id);
  if (!lead) {
    res.status(404).json({ detail: "Analisi non trovata" });
    return;
  }
  const { user_id, ...out } = lead;
  res.json({ lead: out });
});

apiRouter.post("/lead/:lead_id/risparmia", requireAuth, (req: AuthedRequest, res) => {
  const lead = db.leads.find((l) => l.id === req.params.lead_id && l.user_id === req.user!.id);
  if (!lead) {
    res.status(404).json({ detail: "Lead non trovato" });
    return;
  }
  if (lead.inviato_broker) {
    res.status(409).json({ detail: "Pratica gia inviata" });
    return;
  }
  lead.stato = "inviato_broker";
  lead.inviato_broker = true;
  lead.broker_simulato = true;
  lead.inviato_at = nowIso();
  res.json({ ok: true, inviato: true, simulato: true });
});

apiRouter.get("/report/pubblico/:token", (req, res) => {
  const lead = db.leads.find((l) => l.share_token === req.params.token);
  if (!lead) {
    res.status(404).json({ detail: "Report non trovato o scaduto" });
    return;
  }
  const u = db.users.find((x) => x.id === lead.user_id);
  const cliente_nome = (u?.name || "").trim().split(" ")[0] || "";
  const d = lead.dati || {};
  res.json({
    fornitore: d.fornitore ?? null,
    tipo_fornitura: d.tipo_fornitura ?? null,
    consumo_annuo: d.consumo_annuo ?? null,
    unita_consumo: d.unita_consumo ?? null,
    spesa_annua_stimata: d.spesa_annua_stimata ?? null,
    risparmio_stimato_annuo: d.risparmio_stimato_annuo ?? null,
    note: d.note ?? null,
    created_at: lead.created_at,
    cliente_nome,
  });
});

apiRouter.get("/report/pubblico/:token/qr.png", async (req, res) => {
  const lead = db.leads.find((l) => l.share_token === req.params.token);
  if (!lead) {
    res.status(404).json({ detail: "Report non trovato" });
    return;
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
  const targetUrl = `${proto}://${host}/r/${req.params.token}`;
  const pngBuffer = await QRCode.toBuffer(targetUrl, { type: "png", width: 256, margin: 1 });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(pngBuffer);
});

apiRouter.post("/report/pubblico/:token/richiedi", (req, res) => {
  const lead = db.leads.find((l) => l.share_token === req.params.token);
  if (!lead) {
    res.status(404).json({ detail: "Report non trovato o scaduto" });
    return;
  }
  const nome = String(req.body?.nome || "").trim();
  const telefono = String(req.body?.telefono || "").trim();
  if (!nome || !telefono) {
    res.status(400).json({ detail: "Nome e telefono sono obbligatori" });
    return;
  }
  db.leads.unshift({
    id: newId(),
    user_id: lead.user_id,
    tipo: "richiesta_pubblica",
    stato: "lead_in_attesa",
    origine_share_token: req.params.token,
    contatto: {
      nome,
      telefono,
      email: String(req.body?.email || "").trim() || null,
    },
    dati: lead.dati || {},
    created_at: nowIso(),
    inviato_broker: false,
  });
  notifyAdmins(
    "Nuovo lead da report condiviso",
    `${nome} (${telefono}) ha richiesto un'offerta aprendo un report di risparmio condiviso.`
  );
  res.json({ ok: true });
});

apiRouter.post("/analizza-macchinario", requireAuth, upload.single("file"), async (req: AuthedRequest, res) => {
  if (req.user!.role === "privato") {
    res.status(403).json({ detail: "Funzione riservata alle aziende" });
    return;
  }
  const file = req.file;
  if (!file || !ALLOWED_IMG_MIMES[file.mimetype]) {
    res.status(400).json({ detail: "Formato immagine non supportato (JPG, PNG o WEBP)" });
    return;
  }
  try {
    const suggerimenti = await analyzeMacchinarioImage(file.buffer, file.mimetype);
    res.json({ suggerimenti });
  } catch (err: any) {
    res.status(502).json({ detail: formatGeminiErrorMessage(err) });
  }
});

function formatGeminiErrorMessage(err: any): string {
  const msg = String(err?.message || err || "");
  if (msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_INVALID") || msg.includes("403")) {
    return "Chiave API Gemini non valida o mancante. Controlla il pannello Settings > Secrets.";
  }
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
    return "Quota AI esaurita temporaneamente. Riprova tra qualche istante o verifica il piano in Settings > Secrets.";
  }
  return msg || "Analisi AI non riuscita, riprova più tardi.";
}
