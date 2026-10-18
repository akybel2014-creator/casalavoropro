import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UploadCloud, Camera, Search, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";

const LINE_EASE = [0.22, 1, 0.36, 1];
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

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

export default function Hero() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pending, setPending] = useState([]);
    const fileRef = useRef(null);
    const cameraRef = useRef(null);
    const cosaRef = useRef(null);
    const doveRef = useRef(null);
    const timer = useRef(null);

    const submitSearch = (e) => {
        e.preventDefault();
        const cosa = (cosaRef.current?.value || "").trim();
        const dove = (doveRef.current?.value || "").trim();
        const params = new URLSearchParams();
        if (cosa) params.set("q", cosa);
        if (dove) params.set("zona", dove);
        navigate(`/aziende?${params.toString()}`);
    };

    const addFiles = (list) => {
        const arr = Array.from(list || []).filter((f) => ALLOWED.includes(f.type));
        if (arr.length === 0) {
            toast.error("Formati validi: PDF, JPG o PNG");
            return;
        }
        setPending((p) => [...p, ...arr]);
    };

    const removePending = (idx) => setPending((p) => p.filter((_, i) => i !== idx));

    const avviaAnalisi = async () => {
        if (pending.length === 0) {
            toast.error("Aggiungi almeno una pagina della bolletta");
            return;
        }
        setUploading(true);
        setProgress(8);
        timer.current = setInterval(() => setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 12)), 500);

        if (!user) {
            setTimeout(() => {
                clearInterval(timer.current);
                setUploading(false);
                setProgress(0);
                toast.info("Crea un account gratuito per vedere subito il tuo risparmio stimato.");
                navigate("/registrati");
            }, 1200);
            return;
        }
        try {
            const fd = new FormData();
            pending.forEach((f) => fd.append("files", f));
            const { data } = await api.post("/analizza-bolletta", fd, { headers: { "Content-Type": "multipart/form-data" } });
            clearInterval(timer.current);
            setProgress(100);
            sessionStorage.setItem("analisi_lead", JSON.stringify(data.lead));
            setTimeout(() => navigate("/analisi-energetica"), 300);
        } catch (err) {
            clearInterval(timer.current);
            setUploading(false);
            setProgress(0);
            toast.error(formatApiError(err));
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer?.files);
    };

    return (
        <section className="relative overflow-hidden bg-navy" data-testid="hero-section">
            <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
            <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full bg-brand/25 blur-[160px] glow-orange" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-amber/10 blur-[120px]" aria-hidden="true" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24">
                {/* Intestazione */}
                <div className="max-w-3xl">
                    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
                        className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">
                        Il marketplace dei lavori in casa
                    </motion.p>
                    <h1 className="mt-4 font-display font-black tracking-tight leading-[1.02] text-4xl sm:text-5xl lg:text-6xl">
                        <RevealLine delay={0.15}>Analizza la bolletta</RevealLine>
                        <RevealLine delay={0.28}>o trova la tua <span className="text-brand">azienda</span></RevealLine>
                    </h1>
                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                        className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
                        Tutto per la tua casa in un unico posto: scopri quanto risparmi sulle bollette e trova artigiani
                        verificati per ristrutturazioni, impianti, riparazioni e piccoli lavori di casa in tutta Italia.
                    </motion.p>
                </div>

                {/* Due ricerche separate */}
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ricerca 1: Analisi Bolletta */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}
                        className="rounded-2xl border border-white/10 bg-navy-700/70 backdrop-blur-xl p-5 sm:p-6 shadow-2xl" data-testid="hero-block-bolletta">
                        <p className="font-display font-bold text-white text-lg">Analisi Bolletta Gratis</p>
                        <p className="mt-1 text-sm text-slate-400">Carica o fotografa la tua bolletta: l'assistente AI ti dice subito quanto puoi risparmiare.</p>

                        {uploading ? (
                            <div className="py-6 mt-4" data-testid="hero-bolletta-progress">
                                <p className="text-sm font-semibold text-white text-center">Analisi dei consumi in corso…</p>
                                <div className="mt-4 h-3 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 transition-[width] duration-500 ease-out"
                                        style={{ width: `${Math.min(100, Math.round(progress))}%` }} />
                                </div>
                                <p className="mt-2 text-xs text-slate-400 text-center">{Math.min(100, Math.round(progress))}%</p>
                            </div>
                        ) : (
                            <>
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={onDrop}
                                    data-testid="hero-bolletta-dropzone"
                                    className={`mt-4 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-brand bg-brand/10" : "border-white/20 hover:border-brand/50"}`}
                                >
                                    <UploadCloud className="h-7 w-7 text-brand mx-auto" />
                                    <p className="mt-2 text-sm font-semibold text-white">Trascina qui le pagine (PDF o foto)</p>
                                    <p className="mt-1 text-xs text-slate-500">Puoi aggiungere più pagine · PDF, JPG o PNG</p>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <Button type="button" onClick={() => fileRef.current?.click()} data-testid="hero-carica-pdf-button"
                                        variant="outline" className="rounded-xl border-white/20 text-white hover:bg-white/10 font-semibold">
                                        <UploadCloud className="h-4 w-4 mr-1.5" /> Carica file
                                    </Button>
                                    <Button type="button" onClick={() => cameraRef.current?.click()} data-testid="hero-scatta-foto-button"
                                        variant="outline" className="rounded-xl border-brand text-brand hover:bg-brand hover:text-white font-semibold">
                                        <Camera className="h-4 w-4 mr-1.5" /> Scatta foto
                                    </Button>
                                </div>

                                {pending.length > 0 && (
                                    <div className="mt-4 space-y-2" data-testid="hero-bolletta-pending">
                                        {pending.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 rounded-lg bg-navy/60 border border-white/10 px-3 py-2">
                                                <FileText className="h-4 w-4 text-brand shrink-0" />
                                                <span className="flex-1 truncate text-xs text-slate-300">{f.name || `Pagina ${i + 1}`}</span>
                                                <button type="button" onClick={() => removePending(i)} aria-label="Rimuovi pagina"
                                                    data-testid={`hero-bolletta-remove-${i}`} className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        <Button type="button" onClick={avviaAnalisi} data-testid="hero-analizza-button"
                                            className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                                            Analizza {pending.length} {pending.length === 1 ? "pagina" : "pagine"}
                                        </Button>
                                    </div>
                                )}

                                <input ref={fileRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden"
                                    data-testid="hero-bolletta-file-input" onChange={(e) => addFiles(e.target.files)} />
                                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                                    data-testid="hero-bolletta-camera-input" onChange={(e) => addFiles(e.target.files)} />
                            </>
                        )}
                    </motion.div>

                    {/* Ricerca 2: Trova Professionista */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.65 }}
                        className="rounded-2xl border border-white/10 bg-navy-700/70 backdrop-blur-xl p-5 sm:p-6 shadow-2xl" data-testid="hero-block-cerca">
                        <p className="font-display font-bold text-white text-lg">Trova Professionista</p>
                        <p className="mt-1 text-sm text-slate-400">Cerca aziende e artigiani verificati nella tua zona e richiedi un preventivo gratuito.</p>

                        <form onSubmit={submitSearch} className="mt-4 space-y-3" data-testid="hero-search-form">
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
                            <Button type="submit" data-testid="hero-search-submit-button"
                                className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                                <Search className="h-4 w-4 mr-1.5" /> Avvia Ricerca
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
