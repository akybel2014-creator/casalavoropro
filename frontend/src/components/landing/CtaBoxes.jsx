import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIVATO = {
    title: "Sei un Privato?",
    subtitle: "Devi ristrutturare casa o fare un intervento urgente?",
    bullets: [
        "Richiedi preventivi in 2 minuti",
        "Nessun costo e nessun vincolo",
        "Confronta recensioni ed esperienze reali",
        "Assistenza telefonica e chat integrata",
    ],
    cta: "Richiedi Preventivo Gratuito",
    to: "/registrati?ruolo=privato",
    testid: "cta-privato-button",
};

const AZIENDA = {
    title: "Sei un'Azienda o un Professionista?",
    subtitle: "Iscrizione gratuita, senza costi né carta di credito. Oggi tutte le funzioni sono incluse gratis.",
    bullets: [
        "Preventivi illimitati su tutte le categorie della tua zona",
        "Gestione cantieri con promemoria automatici",
        "Annunci noleggio, usato e offerte di lavoro",
        "Badge PRO e massima visibilità nelle ricerche locali",
    ],
    cta: "Registrati gratis",
    to: "/registrati?ruolo=azienda",
    testid: "cta-azienda-button",
    gestionaleCta: "Scopri il Gestionale per Artigiani",
    gestionaleTo: "/registrati?ruolo=azienda",
};

function CtaCard({ data, variant }) {
    const navigate = useNavigate();
    const orange = variant === "orange";
    return (
        <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className={`relative h-full overflow-hidden rounded-3xl p-7 sm:p-10 ${
                orange
                    ? "bg-gradient-to-br from-orange-600 via-brand to-amber-500 text-white shadow-2xl shadow-brand/25"
                    : "border border-white/10 bg-navy-700/70 text-white"
            }`}
        >
            {orange && <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />}
            <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight">{data.title}</h3>
            <p className={`mt-2 text-sm sm:text-base ${orange ? "text-white/90" : "text-slate-400"}`}>{data.subtitle}</p>
            <ul className="mt-6 space-y-3">
                {data.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm sm:text-base">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${orange ? "bg-navy text-white" : "bg-brand/20 text-brand"}`}>
                            <Check className="h-3 w-3" />
                        </span>
                        {b}
                    </li>
                ))}
            </ul>
            {orange && (
                <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-navy/80 text-white text-sm font-semibold px-4 py-2">
                    <Check className="h-4 w-4" /> Iscrizione gratuita · nessun abbonamento
                </p>
            )}
            <Button
                data-testid={data.testid}
                onClick={() => navigate(data.to)}
                className={`mt-8 rounded-full px-6 font-semibold ${
                    orange
                        ? "bg-navy text-white hover:bg-navy-600"
                        : "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25"
                }`}
            >
                {data.cta} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            {data.gestionaleCta && (
                <Button
                    data-testid="gestionale-cta-button"
                    onClick={() => navigate(data.gestionaleTo)}
                    className="mt-3 w-full rounded-full px-6 font-semibold bg-navy/80 text-white hover:bg-navy-600 border border-white/20"
                >
                    {data.gestionaleCta} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            )}
        </motion.div>
    );
}

export default function CtaBoxes() {
    return (
        <section id="per-le-aziende" className="bg-navy py-16 sm:py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl"
                >
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Per le aziende</p>
                    <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">
                        Iscrizione gratuita per le aziende
                    </h2>
                    <p className="mt-4 text-base sm:text-lg font-semibold text-white" style={{ color: "#FFFFFF" }} data-testid="offerta-lancio-subtitle">
                        Registrati senza costi e sblocca cantieri, annunci noleggio/usato, offerte di lavoro e preventivi illimitati. Nessun abbonamento, nessuna carta di credito.
                    </p>
                </motion.div>
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <CtaCard data={PRIVATO} variant="dark" />
                    <CtaCard data={AZIENDA} variant="orange" />
                </div>
            </div>
        </section>
    );
}
