import { motion } from "framer-motion";
import { ShieldCheck, FileText, Headphones, Award } from "lucide-react";

const BADGES = [
    {
        id: "badge-aziende-verificate",
        icon: ShieldCheck,
        title: "Aziende Verificate",
        desc: "Documenti societari, DURC e P.IVA controllati dallo staff CasaLavoriPRO.",
    },
    {
        id: "badge-preventivi-gratuiti",
        icon: FileText,
        title: "Preventivi Gratuiti",
        desc: "Confronta fino a 5 offerte trasparenti senza alcun impegno.",
    },
    {
        id: "badge-assistenza-dedicata",
        icon: Headphones,
        title: "Assistenza Dedicata",
        desc: "Un consulente ti segue dalla richiesta al completamento dei lavori.",
    },
    {
        id: "badge-piu-scelta",
        icon: Award,
        title: "Più Scelta in Italia",
        desc: "Oltre 12.000 aziende edili e professionisti registrati sul territorio.",
    },
];

export default function ValueBadges() {
    return (
        <section className="relative bg-navy py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {BADGES.map((b, i) => (
                        <motion.div
                            key={b.id}
                            data-testid={b.id}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="group rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl transition-all duration-300"
                        >
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand group-hover:scale-110 transition-transform duration-300">
                                <b.icon className="h-5 w-5" />
                            </span>
                            <h3 className="mt-4 font-display font-bold text-white text-base sm:text-lg">{b.title}</h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">{b.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
