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
    const [tab, setTab] = useState("bolletta");
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
                    {/* Colonna sinistra */}
                    <div className="lg:col-span-7">
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

                        {/* Contenitore interattivo a schede */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.75 }}
                            className="mt-8 w-full max-w-[450px] rounded-2xl border border-white/10 bg-navy-700/70 backdrop-blur-xl p-2 shadow-2xl"
                            data-testid="hero-widget"
                        >
                            <div className="grid grid-cols-2 gap-1 rounded-xl bg-navy p-1">
                                <button
                                    type="button"
                                    onClick={() => setTab("bolletta")}
                                    data-testid="hero-tab-bolletta"
                                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${tab === "bolletta" ? "bg-brand text-white" : "text-slate-300 hover:text-white"}`}
                                >
                                    Analisi Bolletta Gratis
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTab("cerca")}
                                    data-testid="hero-tab-cerca"
                                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${tab === "cerca" ? "bg-brand text-white" : "text-slate-300 hover:text-white"}`}
                                >
                                    Trova Professionista
                                </button>
                            </div>

                            <div className="p-3 sm:p-4">
                                {tab === "bolletta" ? (
                                    uploading ? (
                                        <div className="py-6" data-testid="hero-bolletta-progress">
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
                                            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-brand bg-brand/10" : "border-white/20 hover:border-brand/50"}`}
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
                                    )
                                ) : (
                                    <form onSubmit={submitSearch} className="space-y-3" data-testid="hero-search-form">
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
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Colonna destra: anteprima Dashboard Azienda + Wallet */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease: LINE_EASE }}
                        className="lg:col-span-5 relative"
                        data-testid="hero-wallet-preview"
                    >
                        <div className="rounded-3xl border border-white/10 bg-navy-700/80 backdrop-blur-xl shadow-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">Area Aziende</p>
                                    <p className="mt-1 font-display font-bold text-white text-lg">Dashboard</p>
                                </div>
                                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand">PRO</span>
                            </div>

                            <div className="mt-5 rounded-2xl border-2 border-brand bg-gradient-to-b from-brand/15 to-transparent p-5">
                                <p className="text-xs uppercase tracking-wide text-brand font-semibold">Wallet: 42 crediti</p>
                                <div className="mt-2 flex items-end gap-3">
                                    <span className="font-display font-black text-4xl text-white">42</span>
                                    <span className="font-display font-bold text-slate-300 mb-1">Crediti</span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-2">
                                        <p className="text-slate-400">Bonus mensili</p>
                                        <p className="font-bold text-white mt-0.5">5</p>
                                    </div>
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-2">
                                        <p className="text-slate-400">Acquistati</p>
                                        <p className="font-bold text-white mt-0.5">37</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {[["Richieste in arrivo", "3 nuove"], ["Annunci attivi", "5"], ["Offerte di lavoro", "2"]].map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                        <span className="text-sm text-slate-300">{k}</span>
                                        <span className="text-sm font-semibold text-white">{v}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 text-center text-xs text-slate-500">Anteprima: cosi appare la tua area azienda.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
