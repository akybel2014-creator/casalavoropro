import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";

const LINE_EASE = [0.22, 1, 0.36, 1];

function RevealLine({ children, delay = 0 }) {
    return (
        <span className="mask-line">
            <motion.span
                className="block"
                initial={{ y: "112%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay, ease: LINE_EASE }}
            >
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
    const fileRef = useRef(null);
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

    const analizza = async (file) => {
        if (!file) return;
        if (file.type !== "application/pdf") {
            toast.error("Carica la bolletta in formato PDF");
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
            fd.append("file", file);
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
        analizza(e.dataTransfer?.files?.[0]);
    };

    return (
        <section className="relative overflow-hidden bg-navy" data-testid="hero-section">
            <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
            <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full bg-brand/25 blur-[160px] glow-orange" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-amber/10 blur-[120px]" aria-hidden="true" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 lg:pb-28">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    {/* Colonna sinistra: testo */}
                    <div className="lg:col-span-6">
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.05 }}
                            className="text-xs uppercase tracking-[0.24em] font-semibold text-brand"
                        >
                            Il marketplace dei lavori in casa
                        </motion.p>

                        <h1 className="mt-4 font-display font-black tracking-tight leading-[1.02] text-4xl sm:text-5xl lg:text-6xl">
                            <RevealLine delay={0.15}>Analizza la bolletta</RevealLine>
                            <RevealLine delay={0.28}>
                                o trova la tua <span className="text-brand">azienda</span>
                            </RevealLine>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.55 }}
                            className="mt-6 max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed"
                        >
                            Scopri in pochi secondi quanto puoi risparmiare sulle utenze con l'assistente AI,
                            oppure trova professionisti edili e artigiani verificati in tutta Italia.
                        </motion.p>
                    </div>

                    {/* Colonna destra: i due blocchi, entrambi visibili */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.6 }}
                        className="lg:col-span-6 mx-auto w-full max-w-[520px] space-y-5"
                        data-testid="hero-widget"
                    >
                        {/* Blocco 1 — Analisi Bolletta */}
                        <div
                            className="rounded-2xl border border-white/10 bg-navy-700/70 backdrop-blur-xl p-4 sm:p-5 shadow-2xl"
                            data-testid="hero-block-bolletta"
                        >
                            <p className="text-sm font-display font-bold text-white">Analisi Bolletta Gratis</p>
                            <p className="mt-0.5 text-xs text-slate-400">Carica la bolletta e scopri subito quanto puoi risparmiare.</p>

                            {uploading ? (
                                <div className="py-6 mt-3" data-testid="hero-bolletta-progress">
                                    <p className="text-sm font-semibold text-white text-center">L'assistente AI sta analizzando i tuoi consumi...</p>
                                    <div className="mt-4 h-3 w-full rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 transition-[width] duration-500 ease-out"
                                            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-400 text-center">{Math.min(100, Math.round(progress))}%</p>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={onDrop}
                                    data-testid="hero-bolletta-dropzone"
                                    className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-brand bg-brand/10" : "border-white/20 hover:border-brand/50"}`}
                                >
                                    <p className="text-sm font-semibold text-white">Trascina qui la tua Bolletta (PDF)</p>
                                    <p className="mt-1 text-xs text-slate-400">oppure</p>
                                    <Button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                                        data-testid="hero-carica-pdf-button"
                                        className="mt-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25"
                                    >
                                        Carica PDF
                                    </Button>
                                    <p className="mt-3 text-[11px] text-slate-500">Analisi gratuita - PDF, max 15 MB</p>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        data-testid="hero-bolletta-file-input"
                                        onChange={(e) => analizza(e.target.files?.[0])}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Blocco 2 — Trova Professionista */}
                        <div
                            className="rounded-2xl border border-white/10 bg-navy-700/70 backdrop-blur-xl p-4 sm:p-5 shadow-2xl"
                            data-testid="hero-block-cerca"
                        >
                            <p className="text-sm font-display font-bold text-white">Trova Professionista</p>
                            <p className="mt-0.5 text-xs text-slate-400">Cerca aziende e artigiani verificati nella tua zona.</p>

                            <form onSubmit={submitSearch} className="mt-3 space-y-3" data-testid="hero-search-form">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400">Trova categoria</label>
                                    <Input
                                        ref={cosaRef}
                                        data-testid="hero-search-category-input"
                                        placeholder="Es. Idraulico, Elettricista"
                                        className="mt-1 bg-navy border-white/15 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400">Locazione</label>
                                    <Input
                                        ref={doveRef}
                                        data-testid="hero-search-location-input"
                                        placeholder="Vicenza"
                                        className="mt-1 bg-navy border-white/15 text-white placeholder:text-slate-500"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    data-testid="hero-search-submit-button"
                                    className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25"
                                >
                                    Avvia Ricerca
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
