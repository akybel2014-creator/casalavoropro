import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Recycle, ShieldCheck, Clock, Tag, ArrowRight, BadgeCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { AnnuncioCard } from "@/components/AnnuncioCard";

const fade = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.55 },
};

function BlockHeader({ eyebrow, title, text, perks, to, linkLabel }) {
    return (
        <motion.div {...fade} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">{eyebrow}</p>
                <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">{title}</h2>
                <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">{text}</p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-3">
                <ul className="flex flex-wrap gap-2">
                    {perks.map((p) => (
                        <li key={p.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
                            <p.icon className="h-3.5 w-3.5 text-brand" /> {p.label}
                        </li>
                    ))}
                </ul>
                <Link to={to} data-testid={`home-link-${to.replace("/", "")}`} className="text-sm font-semibold text-brand hover:text-white transition-colors inline-flex items-center gap-1.5">
                    {linkLabel} <ArrowUpRight className="h-4 w-4" />
                </Link>
            </div>
        </motion.div>
    );
}

function Grid({ items, emptyText }) {
    if (items === null) return <p className="mt-10 text-sm text-slate-500">Caricamento annunci…</p>;
    if (items.length === 0) return <p className="mt-10 text-sm text-slate-500 border border-dashed border-white/10 rounded-2xl p-8 text-center">{emptyText}</p>;
    return (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((a, i) => <AnnuncioCard key={a.id} a={a} index={i} />)}
        </div>
    );
}

export default function NoleggioUsato() {
    const [noleggio, setNoleggio] = useState(null);
    const [usato, setUsato] = useState(null);

    useEffect(() => {
        api.get("/annunci?tipo=noleggio&limit=4").then(({ data }) => setNoleggio(data)).catch(() => setNoleggio([]));
        api.get("/annunci?tipo=usato&limit=4").then(({ data }) => setUsato(data)).catch(() => setUsato([]));
    }, []);

    return (
        <>
            <section id="noleggio-attrezzi" className="relative bg-navy-600/30 border-y border-white/5 py-16 sm:py-24 lg:py-32" data-testid="section-noleggio">
                <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden="true" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <BlockHeader
                        eyebrow="Noleggio Attrezzi"
                        title="I macchinari giusti, solo per il tempo che serve"
                        text="Le aziende abbonate mettono a disposizione il proprio parco macchine: prenoti il mezzo, lo ricevi in cantiere e paghi solo i giorni di utilizzo."
                        perks={[
                            { icon: ShieldCheck, label: "Mezzi revisionati e assicurati" },
                            { icon: Clock, label: "Consegna in 24/48h" },
                            { icon: Tag, label: "Tariffe giornaliere chiare" },
                        ]}
                        to="/noleggio" linkLabel="Vedi tutti i mezzi a noleggio"
                    />
                    <Grid items={noleggio} emptyText="Nessun mezzo a noleggio pubblicato al momento." />
                </div>
            </section>

            <section id="mercatino-usato" className="relative bg-navy py-16 sm:py-24 lg:py-32" data-testid="section-mercatino">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <BlockHeader
                        eyebrow="Mercatino Usato"
                        title="Attrezzatura professionale di seconda mano, verificata"
                        text="Le imprese del network vendono utensili e macchinari che non usano più: prezzi onesti, stato dichiarato e venditore verificato dallo staff PRO."
                        perks={[
                            { icon: BadgeCheck, label: "Venditori verificati" },
                            { icon: Recycle, label: "Stato dichiarato e foto reali" },
                            { icon: Tag, label: "Fino al 60% in meno del nuovo" },
                        ]}
                        to="/mercatino" linkLabel="Vedi tutto il mercatino"
                    />
                    <Grid items={usato} emptyText="Nessun articolo usato pubblicato al momento." />
                    <motion.div {...fade} className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-6">
                        <p className="flex-1 text-sm text-slate-300">
                            <span className="font-semibold text-white">Sei un'azienda abbonata?</span> Pubblica dalla tua dashboard i mezzi a noleggio e gli utensili usati: raggiungi privati e imprese della tua provincia.
                        </p>
                        <Button asChild className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold shrink-0">
                            <Link to="/registrati?ruolo=azienda" data-testid="mercatino-azienda-cta">Pubblica un annuncio <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
                        </Button>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
