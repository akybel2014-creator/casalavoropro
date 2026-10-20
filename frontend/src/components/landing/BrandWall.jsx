import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

const FILES_BASE = `${process.env.REACT_APP_BACKEND_URL}/api/files/`;

// URL del logo reale dell'azienda (se disponibile), altrimenti null.
function logoUrl(a) {
    if (a?.logo) return a.logo.startsWith("http") ? a.logo : `${FILES_BASE}${a.logo}`;
    const f = a?.foto?.[0];
    if (f?.path) return `${FILES_BASE}${f.path}`;
    return null;
}

function LogoTrack({ items, hidden }) {
    return (
        <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
            {items.map((a, i) => (
                <Link
                    key={`${a.id}-${i}`}
                    to={`/aziende/${a.id}`}
                    className="group flex items-center gap-3 shrink-0 px-6 sm:px-8"
                    data-testid={hidden ? undefined : `brand-wall-logo-${a.id}`}
                >
                    <img
                        src={logoUrl(a)}
                        alt={a.nome}
                        title={a.nome}
                        loading="lazy"
                        className="h-14 w-14 rounded-2xl object-cover border border-white/10 bg-navy group-hover:border-brand/60 transition-colors"
                    />
                    <div className="whitespace-nowrap">
                        <p className="font-display font-bold text-white text-sm group-hover:text-brand transition-colors">{a.nome}</p>
                        <p className="inline-flex items-center gap-1 text-xs text-brand">
                            <ShieldCheck className="h-3 w-3" /> Verificata
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// Muro di brand: loghi delle aziende verificate in scorrimento continuo (prova sociale).
export default function BrandWall() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        api.get("/aziende?verificate=true")
            .then(({ data }) => setItems((Array.isArray(data) ? data : []).filter(logoUrl)))
            .catch(() => { /* silenzioso */ });
    }, []);

    if (items.length === 0) return null;

    // Ripete gli elementi per riempire la larghezza e avere uno scorrimento continuo senza vuoti.
    const repeat = Math.max(1, Math.ceil(10 / items.length));
    const loop = Array.from({ length: repeat }).flatMap(() => items);

    return (
        <section className="marquee relative border-y border-white/10 bg-navy-600/30 py-8 sm:py-10 overflow-hidden" data-testid="brand-wall">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand text-center">
                    Aziende verificate su CasaLavoroPRO
                </p>
            </div>
            <div className="marquee-track">
                <LogoTrack items={loop} />
                <LogoTrack items={loop} hidden />
            </div>
        </section>
    );
}
