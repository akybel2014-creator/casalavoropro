import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Recycle, ShieldCheck, Clock, Tag, ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const IMG = {
    escavatore: "https://images.unsplash.com/photo-1759950345011-ee5a96640e00?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    betoniera: "https://images.unsplash.com/photo-1770822662967-7f66605f9103?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    ponteggio: "https://images.unsplash.com/photo-1616320999187-3c004dad4f0b?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    piattaforma: "https://images.pexels.com/photos/34297398/pexels-photo-34297398.jpeg?auto=compress&cs=tinysrgb&w=800",
    trapano: "https://images.unsplash.com/photo-1546827209-a218e99fdbe9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    smerigliatrice: "https://images.unsplash.com/photo-1518709414768-a88981a4515d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    demolitore: "https://images.unsplash.com/photo-1689935421853-cb23a0bc92e4?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    officina: "https://images.unsplash.com/photo-1530191601183-4de2969575ad?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
};

export const NOLEGGIO = [
    { id: "miniescavatore", nome: "Miniescavatore 1,8 t", specs: "Cingolato · benna 40 cm · patente B", prezzo: "da 140 €/giorno", img: IMG.escavatore, tag: "Movimento terra" },
    { id: "betoniera", nome: "Betoniera 350 L", specs: "Elettrica 230V · trasporto incluso", prezzo: "da 35 €/giorno", img: IMG.betoniera, tag: "Edilizia" },
    { id: "ponteggio", nome: "Ponteggio modulare", specs: "Fino a 12 m · montaggio certificato", prezzo: "da 9 €/m² mese", img: IMG.ponteggio, tag: "Facciate" },
    { id: "piattaforma", nome: "Piattaforma aerea 14 m", specs: "Semovente · operatore opzionale", prezzo: "da 190 €/giorno", img: IMG.piattaforma, tag: "Lavori in quota" },
];

export const USATO = [
    { id: "trapani", nome: "Kit trapani a batteria 18V", specs: "2 batterie · caricatore · valigetta", prezzo: "180 €", stato: "Ottimo", img: IMG.trapano },
    { id: "smerigliatrice", nome: "Smerigliatrice angolare 125 mm", specs: "1.200 W · dischi inclusi", prezzo: "55 €", stato: "Buono", img: IMG.smerigliatrice },
    { id: "demolitore", nome: "Martello demolitore 11 kg", specs: "SDS-Max · 25 J · revisionato", prezzo: "320 €", stato: "Revisionato", img: IMG.demolitore },
    { id: "banco", nome: "Banco da lavoro con morsa", specs: "Piano in acciaio 150 cm · 2 cassetti", prezzo: "240 €", stato: "Ottimo", img: IMG.officina },
];

const fade = (i) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.55, delay: (i % 4) * 0.08 },
});

function MacchinaCard({ m, i, kind }) {
    const noleggio = kind === "noleggio";
    return (
        <motion.article {...fade(i)} data-testid={`${kind}-card-${m.id}`}
            className="group flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-navy-700/60 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-xl hover:shadow-brand/10 transition-all duration-300">
            <div className="relative h-44 overflow-hidden">
                <img src={m.img} alt={m.nome} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" aria-hidden="true" />
                <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${noleggio ? "bg-brand text-white" : "bg-emerald-500 text-navy"}`}>
                    {noleggio ? <Truck className="h-3 w-3" /> : <Recycle className="h-3 w-3" />}
                    {noleggio ? m.tag : `Usato · ${m.stato}`}
                </span>
            </div>
            <div className="flex flex-col flex-1 p-5">
                <h3 className="font-display font-bold text-white">{m.nome}</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">{m.specs}</p>
                <div className="mt-auto pt-4 flex flex-col gap-3">
                    <span className="font-display font-black text-brand text-lg whitespace-nowrap" data-testid={`${kind}-price-${m.id}`}>{m.prezzo}</span>
                    <Button asChild size="sm" className="w-full rounded-full bg-white/5 border border-white/10 text-white hover:bg-brand hover:border-brand font-semibold">
                        <Link to="/registrati?ruolo=privato" data-testid={`${kind}-cta-${m.id}`}>
                            {noleggio ? "Richiedi disponibilità" : "Contatta"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                    </Button>
                </div>
            </div>
        </motion.article>
    );
}

function BlockHeader({ eyebrow, title, text, perks }) {
    return (
        <motion.div {...fade(0)} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">{eyebrow}</p>
                <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">{title}</h2>
                <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">{text}</p>
            </div>
            <ul className="flex flex-wrap gap-2">
                {perks.map((p) => (
                    <li key={p.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
                        <p.icon className="h-3.5 w-3.5 text-brand" /> {p.label}
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

export default function NoleggioUsato() {
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
                    />
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {NOLEGGIO.map((m, i) => <MacchinaCard key={m.id} m={m} i={i} kind="noleggio" />)}
                    </div>
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
                    />
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {USATO.map((m, i) => <MacchinaCard key={m.id} m={m} i={i} kind="usato" />)}
                    </div>
                    <motion.div {...fade(1)} className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-6">
                        <p className="flex-1 text-sm text-slate-300">
                            <span className="font-semibold text-white">Sei un'azienda abbonata?</span> Pubblica gratis i tuoi mezzi a noleggio e gli utensili usati: raggiungi privati e imprese della tua provincia.
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
