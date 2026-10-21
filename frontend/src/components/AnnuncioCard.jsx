import { Link } from "react-router-dom";
import { Truck, Recycle, MapPin, Phone, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/pages/Aziende";
import { BlurImage } from "@/components/BlurImage";
import { optimizeRemoteImg } from "@/lib/img";

export const FILES_BASE = `${process.env.REACT_APP_BACKEND_URL}/api/files/`;
const PLACEHOLDER = "https://images.unsplash.com/photo-1530191601183-4de2969575ad?crop=entropy&cs=srgb&auto=format&q=70&w=560";

export function annuncioImg(a) {
    if (a.foto?.length) return `${FILES_BASE}${a.foto[0].path}`;
    return optimizeRemoteImg(a.immagine_url || PLACEHOLDER, 700);
}

export function prezzoLabel(a) {
    const n = Number(a.prezzo).toLocaleString("it-IT", { maximumFractionDigits: 2 });
    if (a.tipo === "usato" || a.unita === "fisso") return `${n} €`;
    return `da ${n} €/${a.unita}`;
}

export function AnnuncioCard({ a, index = 0 }) {
    const noleggio = a.tipo === "noleggio";
    return (
        <article data-testid={`annuncio-card-${a.id}`}
            style={{ animationDelay: `${(index % 4) * 70}ms` }}
            className="group flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-navy-700/60 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-xl hover:shadow-brand/10 transition-[transform,border-color,box-shadow] duration-300 animate-in fade-in slide-in-from-bottom-4">
            <Link to={`/annunci/${a.id}`} className="relative block h-44 overflow-hidden" data-testid={`annuncio-img-link-${a.id}`}>
                <BlurImage src={annuncioImg(a)} alt={a.titolo} loading="lazy" imgClassName="h-full w-full object-cover group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" aria-hidden="true" />
                <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${noleggio ? "bg-brand text-white" : "bg-emerald-500 text-navy"}`}>
                    {noleggio ? <Truck className="h-3 w-3" /> : <Recycle className="h-3 w-3" />}
                    {noleggio ? a.categoria : `Usato · ${a.stato || "Buono"}`}
                </span>
            </Link>
            <div className="flex flex-col flex-1 p-5">
                <h3 className="font-display font-bold text-white leading-snug">{a.titolo}</h3>
                {a.recensioni > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-brand-amber" data-testid={`annuncio-rating-${a.id}`}>
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-semibold text-white">{Number(a.rating).toFixed(1)}</span>
                        <span className="text-slate-500">({a.recensioni} {a.recensioni === 1 ? "recensione" : "recensioni"})</span>
                    </p>
                )}
                <p className="mt-1 text-xs sm:text-sm text-slate-400 line-clamp-2">{a.descrizione}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {a.sottocategoria && (
                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-slate-300" data-testid={`annuncio-sottocategoria-${a.id}`}>{a.sottocategoria}</span>
                    )}
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" /> {a.zona}</span>
                    <span className="flex items-center gap-1.5 text-slate-300">{a.azienda_nome} <VerifiedBadge verified={a.azienda_verified} /></span>
                </div>
                <div className="mt-auto pt-4 flex flex-col gap-3">
                    <span className="font-display font-black text-brand text-lg whitespace-nowrap" data-testid={`annuncio-price-${a.id}`}>{prezzoLabel(a)}</span>
                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" className="flex-1 rounded-full bg-white/5 border border-white/10 text-white hover:bg-brand hover:border-brand font-semibold">
                            <Link to={`/annunci/${a.id}`} data-testid={`annuncio-cta-${a.id}`}>
                                {noleggio ? "Richiedi disponibilità" : "Dettagli"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                        </Button>
                        {a.azienda_telefono && (
                            <a href={`tel:${a.azienda_telefono.replace(/\s/g, "")}`} data-testid={`annuncio-call-${a.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-colors whitespace-nowrap">
                                <Phone className="h-3.5 w-3.5" /> Chiama
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

export function ContattoAzienda({ a }) {
    const privato = a.venditore_privato || !a.azienda_id;
    return (
        <div className="flex flex-col gap-2 text-sm">
            {privato ? (
                <span data-testid="annuncio-venditore-nome" className="flex items-center gap-2 text-white font-semibold">
                    {a.azienda_nome || "Venditore privato"}
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">Privato</span>
                </span>
            ) : (
                <Link to={`/aziende/${a.azienda_id}`} data-testid="annuncio-azienda-link" className="flex items-center gap-2 text-white font-semibold hover:text-brand transition-colors">
                    {a.azienda_nome} <VerifiedBadge verified={a.azienda_verified} />
                </Link>
            )}
            {a.azienda_telefono && (
                <a href={`tel:${a.azienda_telefono.replace(/\s/g, "")}`} data-testid="annuncio-phone-link" className="flex items-center gap-2 text-slate-300 hover:text-brand transition-colors">
                    <Phone className="h-4 w-4 text-brand" /> {a.azienda_telefono}
                </a>
            )}
        </div>
    );
}
