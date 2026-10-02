import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
    {
        q: "Quanto costa chiedere preventivi per un privato?",
        a: "Nulla. Raccontare il lavoro da fare, ricevere fino a 5 preventivi e confrontare le aziende è completamente gratuito e senza impegno. Nessuna commissione viene applicata sulle opere.",
    },
    {
        q: "Come vengono verificate le aziende?",
        a: "Ogni azienda invia Partita IVA e DURC: il nostro staff controlla i documenti societari e approva manualmente il badge 'Azienda Verificata' solo dopo l'audit. Puoi riconoscere le aziende verificate dallo scudo verde nella directory.",
    },
    {
        q: "In quanto tempo ricevo le risposte?",
        a: "Le aziende della tua zona vengono notificate subito dopo l'invio della richiesta. Nella maggior parte dei casi i primi preventivi arrivano entro 24-48 ore.",
    },
    {
        q: "In quali città è attivo CasaLavoriPRO?",
        a: "Siamo presenti in tutta Italia: la ricerca funziona per città e province. Se non trovi aziende nella tua zona, scrivici e attiveremo la tua area il prima possibile.",
    },
    {
        q: "Cosa include l'abbonamento PRO per le aziende?",
        a: "Il piano PRO mette in evidenza il tuo profilo nelle ricerche, sblocca i preventivi illimitati e le richieste di tutte le categorie della tua zona. Puoi attivarlo con abbonamento mensile o annuale direttamente dal pannello azienda.",
    },
];

export default function FaqSection() {
    return (
        <section id="faq" className="bg-navy-600/30 border-t border-white/5 py-16 sm:py-24 lg:py-32">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">FAQ</p>
                    <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">
                        Domande frequenti
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mt-8"
                >
                    <Accordion type="single" collapsible className="w-full">
                        {FAQS.map((f, i) => (
                            <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-accordion-item-${i + 1}`} className="border-white/10">
                                <AccordionTrigger className="text-left font-display font-semibold text-white text-base sm:text-lg hover:text-brand hover:no-underline">
                                    {f.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-400 text-sm sm:text-base leading-relaxed">
                                    {f.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    );
}
