import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_FEATURES = [
    "Presenza nella directory",
    "Profilo aziendale completo",
    "Descrizione dei servizi",
    "Recapiti e contatti",
    "Fino a 2 preventivi al mese",
];

const PRO_FEATURES = [
    "Badge PRO e massima visibilità nelle ricerche locali",
    "Preventivi illimitati",
    "Cantieri, annunci noleggio/usato e offerte di lavoro",
    "Più spazio per foto e portfolio",
    "Priorità nelle ricerche dei privati",
    "Supporto prioritario",
];

export default function Prezzi() {
    return (
        <div className="min-h-screen bg-navy grid-pattern pt-32 pb-24" data-testid="prezzi-page">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl"
                >
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Piani e prezzi</p>
                    <h1 className="mt-3 font-display font-black tracking-tight text-4xl sm:text-5xl text-white">
                        L'iscrizione è gratuita per tutti
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-300">
                        Aziende e privati si iscrivono senza alcun costo e senza carta di credito.
                        Oggi tutte le funzioni sono incluse gratis: il Profilo PRO arriverà in futuro, ma per ora non paghi nulla.
                    </p>
                </motion.div>

                {/* Piani */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Base */}
                    <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-7 sm:p-8" data-testid="plan-base">
                        <h2 className="font-display font-bold text-white text-xl">Profilo Base</h2>
                        <p className="mt-2 font-display font-black text-4xl text-white">Gratis</p>
                        <p className="mt-1 text-sm text-slate-400">Gratuito oggi e per sempre.</p>
                        <ul className="mt-6 space-y-3">
                            {BASE_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Button asChild variant="outline" data-testid="plan-base-cta"
                            className="mt-8 w-full rounded-xl border-white/20 text-white hover:bg-white/10 font-semibold">
                            <Link to="/registrati?ruolo=azienda">Inizia gratis</Link>
                        </Button>
                    </div>

                    {/* Pro (mostrato per il futuro: nessun abbonamento attivo oggi) */}
                    <div className="relative rounded-3xl border-2 border-brand bg-gradient-to-b from-brand/15 to-navy-700/70 p-7 sm:p-8 shadow-2xl shadow-brand/10" data-testid="plan-pro">
                        <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">IN ARRIVO</span>
                        <h2 className="font-display font-bold text-white text-xl">Profilo Pro</h2>
                        <p className="mt-2 flex items-baseline gap-2" data-testid="plan-pro-price">
                            <span className="font-display font-black text-3xl text-slate-500 line-through">€4,99/mese</span>
                            <span className="font-display font-black text-3xl text-brand">Gratis ora</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-400">Oggi incluso gratis durante il lancio. Nessun pagamento, nessun abbonamento attivo: lo introdurremo in futuro.</p>
                        <ul className="mt-6 space-y-3">
                            {PRO_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3 text-sm text-slate-200">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Button asChild data-testid="plan-pro-cta"
                            className="mt-8 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                            <Link to="/registrati?ruolo=azienda">Registrati gratis <ArrowRight className="h-4 w-4 ml-1" /></Link>
                        </Button>
                    </div>
                </div>

                {/* Privati */}
                <div className="mt-6 rounded-3xl border border-brand/30 bg-brand/5 p-7 flex flex-col sm:flex-row sm:items-center gap-4" data-testid="plan-privati">
                    <div>
                        <h2 className="font-display font-bold text-white text-xl">Sei un privato?</h2>
                        <p className="mt-1 text-sm text-slate-300">Cercare professionisti e analizzare le bollette è sempre gratis, senza costi nascosti.</p>
                    </div>
                    <Button asChild data-testid="plan-privati-cta"
                        className="sm:ml-auto rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                        <Link to="/registrati?ruolo=privato">Registrati Gratis come Privato (Nessun costo nascosto)</Link>
                    </Button>
                </div>

                {/* Condizioni */}
                <div className="mt-14 rounded-2xl border border-white/10 bg-navy-700/50 p-6" data-testid="prezzi-condizioni">
                    <h3 className="font-display font-semibold text-white">Condizioni</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        L'iscrizione alla piattaforma è gratuita sia per i privati sia per le aziende, senza costi né
                        carta di credito. Al momento tutte le funzioni sono incluse gratuitamente. Il Profilo PRO è
                        mostrato come anteprima di una futura offerta premium: non è attivo alcun abbonamento e non è
                        previsto alcun addebito. Dati, documenti e contenuti pubblicati dall'utente devono essere veritieri,
                        aggiornati e conformi alla normativa applicabile.
                    </p>
                </div>
            </div>
        </div>
    );
}
