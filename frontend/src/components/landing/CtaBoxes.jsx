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
    title: "Sei un'Azienda?",
    subtitle: "Vuoi aumentare il tuo fatturato ed acquisire nuovi cantieri?",
    bullets: [
        "Ricevi richieste lavorative nella tua provincia",
        "Pagina profilo indicizzata su Google con portfolio",
        "Sistema di gestione preventivi e chat cliente",
        "Piani di abbonamento flessibili e rimborso crediti",
    ],
    cta: "Registra la tua Azienda",
    to: "/registrati?ruolo=azienda",
    testid: "cta-azienda-button",
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
                    className="max-w-2xl"
                >
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Scegli il tuo lato</p>
                    <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">
                        Due posti a tavola, uno stesso obiettivo
                    </h2>
                </motion.div>
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <CtaCard data={PRIVATO} variant="dark" />
                    <CtaCard data={AZIENDA} variant="orange" />
                </div>
            </div>
        </section>
    );
}
