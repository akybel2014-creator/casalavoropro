import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Search, ShieldCheck, Star, MapPin, Camera,
    ImagePlus, X, Loader2, Send, FileText
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { optimizeRemoteImg } from "@/lib/img";
import { SERVICE_CATEGORIES } from "@/components/landing/CategoryGrid";

const LINE_EASE = [0.22, 1, 0.36, 1];
const HERO_IMG = "https://images.pexels.com/photos/6473978/pexels-photo-6473978.jpeg?auto=compress&cs=tinysrgb&w=1200";
const CATS = ["Idraulico", "Elettricista", "Imbianchino", "Climatizzazione", "Fabbro", "Muratore"];
const FILES_BASE = "/api/files/";
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

// URL del vero logo/foto dell'artigiano (se disponibile), altrimenti null -> iniziali.
function avatarUrl(a) {
    if (a?.logo) {
        if (a.logo.startsWith("http") || a.logo.startsWith("/")) return a.logo;
        return `${FILES_BASE}${a.logo}`;
    }
    const f = a?.foto?.[0];
    if (f?.path) return `${FILES_BASE}${f.path}`;
    return null;
}

function AvatarCircle({ a }) {
    const [err, setErr] = useState(false);
    const url = avatarUrl(a);
    if (url && !err) {
        return (
            <img src={url} alt={a.nome} title={a.nome} onError={() => setErr(true)} loading="lazy"
                className="h-10 w-10 rounded-full border-2 border-navy object-cover bg-navy shadow-md" />
        );
    }
    return (
        <div title={a.nome}
            className="h-10 w-10 rounded-full border-2 border-navy bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {(a.nome || "?").trim().charAt(0).toUpperCase()}
        </div>
    );
}

function RevealLine({ children, delay = 0 }) {
    return (
        <span className="mask-line">
            <motion.span className="block" initial={{ y: "112%" }} animate={{ y: 0 }}
                transition={{ duration: 1, delay, ease: LINE_EASE }}>
                {children}
            </motion.span>
        </span>
    );
}

const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ data: reader.result, name: file.name, mime: file.type, size: file.size });
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export default function Hero() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const cosaRef = useRef(null);
    const doveRef = useRef(null);
    const fileInputRef = useRef(null);

    const [aziende, setAziende] = useState([]);
    const [descrizione, setDescrizione] = useState("");
    const [photos, setPhotos] = useState([]); // { id, file, previewUrl, name, size }
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Prova sociale: artigiani verificati reali (endpoint pubblico, best-effort).
        api.get("/aziende?verificate=true")
            .then(({ data }) => setAziende(Array.isArray(data) ? data : []))
            .catch(() => { /* silenzioso */ });
    }, []);

    const verifiedCount = aziende.length;
    const rated = aziende.filter((a) => a.rating);
    const avgRating = rated.length ? rated.reduce((s, a) => s + (a.rating || 0), 0) / rated.length : 0;
    const totalRecensioni = aziende.reduce((s, a) => s + (a.recensioni || 0), 0);
    const avatars = aziende.slice(0, 5);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (photos.length + files.length > 4) {
            toast.error("Puoi caricare al massimo 4 fotografie del lavoro");
            return;
        }

        const validPhotos = [];
        for (const file of files) {
            if (!ALLOWED_MIMES.includes(file.type)) {
                toast.error(`Formato non supportato per "${file.name}". Usa solo JPG, PNG o WEBP`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`La foto "${file.name}" supera il limite di 5 MB`);
                continue;
            }
            validPhotos.push({
                id: `photo-${Date.now()}-${Math.random()}`,
                file,
                previewUrl: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            });
        }

        setPhotos((prev) => [...prev, ...validPhotos].slice(0, 4));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removePhoto = (id) => {
        setPhotos((prev) => {
            const removed = prev.find((p) => p.id === id);
            if (removed?.previewUrl && removed.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(removed.previewUrl);
            }
            return prev.filter((p) => p.id !== id);
        });
    };

    // Ricerca semplice nella directory aziende (quando non si invia richiesta o su richiesta specifica)
    const submitPlainSearch = () => {
        const cosa = (cosaRef.current?.value || "").trim();
        const dove = (doveRef.current?.value || "").trim();
        const params = new URLSearchParams();
        if (cosa) params.set("q", cosa);
        if (dove) params.set("zona", dove);
        navigate(`/aziende?${params.toString()}`);
    };

    // Invio intelligente: se l'utente ha inserito una descrizione o foto, invia richiesta reale di preventivo
    const handleSubmit = async (e) => {
        e.preventDefault();
        const cosa = (cosaRef.current?.value || "").trim();
        const dove = (doveRef.current?.value || "").trim();
        const desc = descrizione.trim();

        // Se non c'è descrizione e non ci sono foto, esegue la ricerca semplice delle aziende
        if (!desc && photos.length === 0) {
            submitPlainSearch();
            return;
        }

        // L'utente vuole inviare una richiesta con dettagli del lavoro / foto
        setSubmitting(true);
        try {
            // Se l'utente è autenticato come privato, invia direttamente la richiesta reale
            if (user && user.role === "privato") {
                const fd = new FormData();
                const titolo = cosa ? `Richiesta: ${cosa}` : (desc.length > 50 ? `${desc.slice(0, 47)}...` : desc);
                const mappedCat = SERVICE_CATEGORIES.find((c) => c.toLowerCase() === cosa.toLowerCase()) || cosa || "Altri Servizi";

                fd.append("titolo", titolo);
                fd.append("categoria", mappedCat);
                fd.append("zona", dove || "Italia");
                fd.append("descrizione", desc || `Lavoro da realizzare in zona ${dove || "da concordare"}`);
                photos.forEach((p) => fd.append("files", p.file));

                await api.post("/richieste", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                toast.success(
                    photos.length > 0
                        ? `Richiesta inviata con ${photos.length} foto! Gli artigiani della tua zona sono stati avvisati.`
                        : "Richiesta inviata! Gli artigiani della tua zona sono stati avvisati."
                );
                navigate("/area-privato");
                return;
            }

            // Se l'utente non è loggato (o non è privato): salviamo in modo sicuro la bozza
            // compresi i file convertiti in base64 e accompagniamo l'utente al flusso di accesso
            const base64Photos = await Promise.all(photos.map((p) => fileToBase64(p.file)));
            const draft = {
                cosa,
                dove,
                descrizione: desc,
                foto_base64: base64Photos,
            };
            sessionStorage.setItem("clpro_pending_richiesta", JSON.stringify(draft));

            toast.info("Accedi o registrati come privato per completare l'invio della tua richiesta con foto.");
            navigate("/login", { state: { from: "/nuova-richiesta", has_pending: true } });
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const cercaCategoria = (cat) => navigate(`/aziende?q=${encodeURIComponent(cat)}`);

    const hasWorkDetails = descrizione.trim().length > 0 || photos.length > 0;

    return (
        <section className="relative overflow-hidden bg-navy" data-testid="hero-section">
            <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
            <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full bg-brand/25 blur-[160px] glow-orange" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-amber/10 blur-[120px]" aria-hidden="true" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                    {/* Colonna sinistra: testo + ricerca */}
                    <div>
                        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
                            className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">
                            Il marketplace dei lavori in casa
                        </motion.p>
                        <h1 className="mt-4 font-display font-black tracking-tight leading-[1.02] text-4xl sm:text-5xl lg:text-6xl">
                            <RevealLine delay={0.15}>Trova l'artigiano</RevealLine>
                            <RevealLine delay={0.28}>giusto per <span className="text-brand">casa tua</span></RevealLine>
                        </h1>
                        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                            className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                            Aziende e artigiani verificati per ristrutturazioni, impianti, riparazioni e piccoli lavori di casa
                            in tutta Italia. Cerca nella tua zona e richiedi un preventivo gratuito in pochi minuti.
                        </motion.p>

                        {/* Ricerca: Trova Professionista con descrizione e foto */}
                        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
                            className="mt-8 rounded-2xl border border-white/10 bg-navy-700/70 backdrop-blur-xl p-5 sm:p-6 shadow-2xl" data-testid="hero-block-cerca">
                            <p className="font-display font-bold text-white text-lg">Trova Professionista</p>
                            <p className="mt-1 text-sm text-slate-400">Cerca aziende e artigiani verificati nella tua zona e richiedi un preventivo gratuito.</p>

                            <form onSubmit={handleSubmit} className="mt-4 space-y-3" data-testid="hero-search-form">
                                {/* Riga 1: Cosa cerchi e Dove */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400">Cosa cerchi</label>
                                        <Input ref={cosaRef} data-testid="hero-search-category-input" placeholder="Es. Idraulico, Elettricista"
                                            className="mt-1 bg-navy border-white/15 text-white placeholder:text-slate-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400">Dove</label>
                                        <Input ref={doveRef} data-testid="hero-search-location-input" placeholder="Vicenza"
                                            className="mt-1 bg-navy border-white/15 text-white placeholder:text-slate-500" />
                                    </div>
                                </div>

                                {/* Riga 2: Descrivi il lavoro da fare (facoltativo) */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                                        <span>Descrivi il lavoro da fare <span className="text-slate-500 font-normal">(facoltativo)</span></span>
                                    </label>
                                    <Input
                                        value={descrizione}
                                        onChange={(e) => setDescrizione(e.target.value)}
                                        data-testid="hero-search-descrizione-input"
                                        placeholder="Spiega brevemente cosa bisogna sistemare o realizzare"
                                        className="mt-1 bg-navy border-white/15 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Riga 3: Carica foto del lavoro da fare */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                            <Camera className="h-3.5 w-3.5 text-brand" />
                                            Carica foto del lavoro da fare <span className="text-slate-500 font-normal hidden sm:inline">(max 4 foto, JPG/PNG/WEBP fino a 5 MB)</span>
                                        </label>
                                        {photos.length > 0 && (
                                            <span className="text-[11px] text-brand font-semibold">
                                                {photos.length}/4 foto
                                            </span>
                                        )}
                                    </div>

                                    {/* Input file nascosto */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                        data-testid="hero-photo-input"
                                    />

                                    {photos.length < 4 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            data-testid="hero-photo-upload-button"
                                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-white/20 hover:border-brand/60 bg-navy/40 hover:bg-navy/70 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                                        >
                                            <ImagePlus className="h-4 w-4 text-brand" />
                                            <span>
                                                {photos.length === 0
                                                    ? "Carica foto del lavoro da fare (anteprima prima dell'invio)"
                                                    : "Aggiungi altra foto"}
                                            </span>
                                        </button>
                                    )}

                                    {/* Anteprima miniature con possibilità di rimozione prima dell'invio */}
                                    {photos.length > 0 && (
                                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="hero-photo-previews">
                                            {photos.map((p, idx) => (
                                                <div
                                                    key={p.id}
                                                    data-testid={`hero-photo-preview-${idx}`}
                                                    className="relative group rounded-xl border border-white/10 bg-navy p-1.5 flex items-center gap-2 overflow-hidden"
                                                >
                                                    <img
                                                        src={p.previewUrl}
                                                        alt={p.name}
                                                        className="h-10 w-10 rounded-lg object-cover bg-navy-800 shrink-0"
                                                    />
                                                    <div className="min-w-0 flex-1 pr-5">
                                                        <p className="text-[11px] font-medium text-white truncate">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400">{(p.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(p.id)}
                                                        data-testid={`hero-photo-remove-${idx}`}
                                                        title="Rimuovi questa foto"
                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-colors"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pulsante di invio/ricerca */}
                                <div className="pt-1">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        data-testid="hero-search-submit-button"
                                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25 h-11"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Invio richiesta in corso...
                                            </>
                                        ) : hasWorkDetails ? (
                                            <>
                                                <Send className="h-4 w-4 mr-1.5" />
                                                Invia richiesta preventivo {photos.length > 0 ? `(${photos.length} foto)` : ""}
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-4 w-4 mr-1.5" />
                                                Avvia Ricerca
                                            </>
                                        )}
                                    </Button>

                                    {hasWorkDetails && (
                                        <div className="mt-2 text-center">
                                            <button
                                                type="button"
                                                onClick={submitPlainSearch}
                                                className="text-xs text-slate-400 hover:text-white underline transition-colors"
                                            >
                                                oppure cerca solo nella directory aziende →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Categorie in evidenza: ricerca con un tap */}
                            <div className="mt-4" data-testid="hero-quick-categories">
                                <p className="text-xs font-semibold text-slate-400 mb-2">Categorie più richieste</p>
                                <div className="flex flex-wrap gap-2">
                                    {CATS.map((c) => (
                                        <button key={c} type="button" onClick={() => cercaCategoria(c)}
                                            data-testid={`hero-cat-${c.toLowerCase()}`}
                                            className="rounded-full border border-white/15 bg-navy/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-brand hover:text-white hover:bg-brand/10 transition-colors">
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Prova sociale: artigiani verificati reali + rating */}
                        {verifiedCount > 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.8 }}
                                className="mt-6 flex items-center gap-4" data-testid="hero-social-proof">
                                <div className="flex -space-x-3">
                                    {avatars.map((a, i) => (
                                        <AvatarCircle key={a.id || i} a={a} />
                                    ))}
                                </div>
                                <div>
                                    {avgRating > 0 && (
                                        <div className="flex items-center gap-0.5" data-testid="hero-social-rating">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <Star key={n} className={`h-4 w-4 ${n <= Math.round(avgRating) ? "text-brand fill-current" : "text-slate-600"}`} />
                                            ))}
                                            <span className="ml-1.5 text-sm font-bold text-white">{avgRating.toFixed(1)}</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-400">
                                        {verifiedCount}+ artigiani verificati{totalRecensioni > 0 ? ` · ${totalRecensioni}+ recensioni` : ""}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.8 }}
                                className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> Artigiani verificati</span>
                                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> In tutta Italia</span>
                                <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-brand" /> Preventivi gratuiti</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Colonna destra: immagine esplicativa */}
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.4, ease: LINE_EASE }}
                        className="relative hidden lg:block" data-testid="hero-image">
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                            <img src={optimizeRemoteImg(HERO_IMG, 1200)} alt="Artigiano al lavoro durante una ristrutturazione di casa"
                                className="w-full h-[460px] object-cover" loading="eager" fetchPriority="high" decoding="async" width="1200" height="920" />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/10 to-transparent" aria-hidden="true" />
                        </div>
                        {/* Badge flottante: numero reale di aziende verificate */}
                        {verifiedCount > 0 && (
                            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-navy-700/90 backdrop-blur-xl px-5 py-4 shadow-2xl" data-testid="hero-verified-badge">
                                <p className="font-display font-black text-2xl text-white">{verifiedCount}</p>
                                <p className="text-xs text-slate-400">{verifiedCount === 1 ? "azienda verificata" : "aziende verificate"}</p>
                            </div>
                        )}
                        <div className="absolute -top-4 right-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                            <ShieldCheck className="h-3.5 w-3.5" /> Profili controllati
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
