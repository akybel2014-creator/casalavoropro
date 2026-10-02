import { motion } from "framer-motion";

const STEPS = [
    {
        n: "01",
        title: "Per i Privati",
        desc: "Inserisci la tua richiesta specificando la città e la tipologia di lavoro. Ricevi fino a 5 preventivi trasparenti dalle migliori aziende vicine a te.",
        badge: "Gratuito al 100%",
        id: "come-funziona-step-1",
    },
    {
        n: "02",
        title: "Per le Aziende",
        desc: "Crea il profilo professionale della tua impresa, carica certificazioni e portfolio. Ricevi richieste qualificate direttamente dai clienti della tua zona.",
        badge: "Nuovi Clienti",
        id: "come-funziona-step-2",
    },
    {
        n: "03",
        title: "Un solo intermediario",
        desc: "CasaLavoriPRO gestisce messaggistica, verifiche e preventivi su una singola piattaforma intuitiva, senza costi nascosti o commissioni sulle opere.",
        badge: "Semplice & Diretto",
        id: "come-funziona-step-3",
    },
    {
        n: "04",
        title: "Sicurezza e Garanzia",
        desc: "Tutte le aziende del network superano un audit con verifica di Partita IVA, DURC e recensioni reali inviate solo da utenti con lavori completati.",
        badge: "Certificato PRO",
        id: "come-funziona-step-4",
    },
];

export default function HowItWorks() {
    return (
        <section id="come-funziona" className="relative bg-navy-600/30 border-y border-white/5 py-16 sm:py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden="true" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl"
                >
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Come funziona</p>
                    <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">
                        Dalla richiesta al cantiere, in quattro passi
                    </h2>
                </motion.div>

                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.n}
                            data-testid={s.id}
                            initial={{ opacity: 0, y: 32 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="relative h-full rounded-2xl border border-white/10 bg-navy/80 p-6 hover:border-brand/40 transition-colors duration-300"
                        >
                            <span className="font-display font-black text-5xl text-stroke">{s.n}</span>
                            <h3 className="mt-4 font-display font-bold text-white text-lg">{s.title}</h3>
                            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                            <span className="mt-4 inline-block rounded-full bg-brand/15 text-brand text-xs font-semibold px-3 py-1">
                                {s.badge}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
