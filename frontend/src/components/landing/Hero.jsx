import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES_QUICK = ["Idraulica", "Elettricità", "Edilizia", "Imbiancatura"];

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
    const imgRef = useRef(null);
    const cosaRef = useRef(null);
    const doveRef = useRef(null);

    const submit = (e) => {
        e.preventDefault();
        const cosa = (cosaRef.current?.value || "").trim();
        const dove = (doveRef.current?.value || "").trim();
        const params = new URLSearchParams();
        const match = ["idraulica", "termoidraulica", "elettricita", "elettricità", "edilizia", "imbiancatura", "giardinaggio", "pavimenti"]
            .find((c) => cosa.toLowerCase().includes(c));
        if (match) params.set("categoria", match.charAt(0).toUpperCase() + match.slice(1).replace("elettricita", "elettricità"));
        else if (cosa) params.set("q", cosa);
        if (dove) params.set("zona", dove);
        navigate(`/aziende?${params.toString()}`);
    };

    return (
        <section className="relative overflow-hidden bg-navy" data-testid="hero-section">
            <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
            <div className="absolute -top-40 -right-40 h-[560px] w-[560px] rounded-full bg-brand/25 blur-[160px] glow-orange" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-amber/10 blur-[120px]" aria-hidden="true" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 lg:pb-28">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    <div className="lg:col-span-7">
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.05 }}
                            className="text-xs uppercase tracking-[0.24em] font-semibold text-brand"
                        >
                            Il marketplace dei lavori in casa
                        </motion.p>

                        <h1 className="mt-4 font-display font-black tracking-tight leading-[1.02] text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
                            <RevealLine delay={0.15}>Trova le migliori</RevealLine>
                            <RevealLine delay={0.28}>
                                <span className="text-brand">aziende</span>&nbsp;per i tuoi
                            </RevealLine>
                            <RevealLine delay={0.41}>lavori in casa.</RevealLine>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.65 }}
                            className="mt-6 max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed"
                        >
                            Colleghiamo i migliori professionisti edili, idraulici, elettricisti e
                            artigiani con i privati in tutta Italia. Preventivi gratuiti e aziende verificate.
                        </motion.p>

                        <motion.form
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.8 }}
                            onSubmit={submit}
                            data-testid="hero-search-form"
                            className="mt-8 backdrop-blur-2xl bg-white/95 border border-white/60 shadow-2xl rounded-2xl p-3 sm:p-4 max-w-2xl"
                        >
                            <div className="flex flex-col md:flex-row gap-2 md:items-stretch">
                                <label className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200">
                                    <MapPin className="h-4 w-4 text-brand shrink-0" />
                                    <Input
                                        ref={doveRef}
                                        data-testid="hero-search-location-input"
                                        placeholder="Dove? Città o CAP"
                                        className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0 text-slate-900 placeholder:text-slate-500"
                                    />
                                </label>
                                <label className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200">
                                    <Search className="h-4 w-4 text-brand shrink-0" />
                                    <Input
                                        ref={cosaRef}
                                        data-testid="hero-search-category-input"
                                        placeholder="Cosa ti serve? Lavoro o categoria"
                                        className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0 text-slate-900 placeholder:text-slate-500"
                                    />
                                </label>
                                <Button
                                    type="submit"
                                    data-testid="hero-search-submit-button"
                                    className="md:px-7 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/30 font-semibold"
                                >
                                    Cerca <ArrowRight className="h-4 w-4 ml-1.5" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
                                <span className="text-xs text-slate-500 font-medium">Popolari:</span>
                                {CATEGORIES_QUICK.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => navigate(`/aziende?categoria=${encodeURIComponent(c)}`)}
                                        className="text-xs font-medium px-3 py-1 rounded-full border border-slate-300 text-slate-700 hover:border-brand hover:text-brand transition-colors"
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </motion.form>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease: LINE_EASE }}
                        className="lg:col-span-5 relative"
                        ref={imgRef}
                    >
                        <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1722421492323-eaf9c401befe?q=85&w=1400&auto=format&fit=crop"
                                alt="Casa moderna ristrutturata"
                                className="w-full h-[320px] sm:h-[420px] lg:h-[520px] object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
                        </div>

                        <div className="floaty absolute -left-4 sm:-left-8 top-10 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-2xl border border-white/60">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-brand font-bold">4.9</span>
                                <div>
                                    <div className="flex items-center gap-0.5 text-brand-amber">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium mt-0.5">Media recensioni privati</p>
                                </div>
                            </div>
                        </div>

                        <div className="floaty absolute -right-3 sm:-right-6 bottom-12 rounded-2xl bg-navy-700/95 backdrop-blur px-4 py-3 shadow-2xl border border-white/15" style={{ animationDelay: "1.4s" }}>
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck className="h-8 w-8 text-brand" />
                                <div>
                                    <p className="text-sm font-bold text-white">Aziende verificate</p>
                                    <p className="text-xs text-slate-400">P.IVA e DURC controllati</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
