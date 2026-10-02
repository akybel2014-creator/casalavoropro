const ITEMS = [
    "Preventivi gratuiti",
    "Aziende verificate",
    "Ristrutturazioni chiavi in mano",
    "Imprese edili",
    "Idraulici qualificati",
    "Elettricisti H24",
    "Pavimenti & rivestimenti",
];

function Track({ hidden }) {
    return (
        <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
            {ITEMS.map((item, i) => (
                <span key={`${item}-${i}`} className="flex items-center shrink-0">
                    <span className="font-display font-extrabold uppercase tracking-wide text-2xl sm:text-4xl lg:text-5xl px-6 sm:px-10 text-slate-200/90 whitespace-nowrap">
                        {item}
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full bg-brand shrink-0" />
                </span>
            ))}
        </div>
    );
}

export default function Marquee() {
    return (
        <section className="marquee relative border-y border-white/10 bg-navy-600/40 py-8 sm:py-10 overflow-hidden">
            <div className="marquee-track">
                <Track />
                <Track hidden />
            </div>
        </section>
    );
}
