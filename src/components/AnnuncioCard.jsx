import { Link } from "react-router-dom";
import { Truck, Recycle, MapPin, Phone, ArrowRight, Star, MessageCircle, Heart, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/pages/Aziende";
import { BlurImage } from "@/components/BlurImage";
import { optimizeRemoteImg } from "@/lib/img";

export const FILES_BASE = "/api/files/";
const PLACEHOLDER = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?crop=entropy&cs=srgb&auto=format&q=70&w=700";

export function annuncioImg(a) {
    if (a?.immagine_url) {
        return optimizeRemoteImg(a.immagine_url, 700);
    }
    if (a?.foto?.length) {
        return `${FILES_BASE}${a.foto[0].path}`;
    }
    return PLACEHOLDER;
}

export function prezzoLabel(a) {
    if (a?.prezzo === undefined || a?.prezzo === null) return "Trattativa privata";
    const n = Number(a.prezzo).toLocaleString("it-IT", { maximumFractionDigits: 2 });
    const isVendita = a.tipo === "vendita" || a.tipo === "usato";
    const unita = a.unita_misura || a.unita;

    if (isVendita || unita === "fisso" || (!unita && isVendita)) {
        return `${n} €`;
    }
    return `da ${n} €/${unita || "giorno"}`;
}

// Costruisce un link WhatsApp wa.me dal numero (assume Italia se manca il prefisso internazionale).
export function waLink(phone, text) {
    if (!phone) return null;
    let d = String(phone).replace(/[^\d]/g, "");
    if (d.startsWith("00")) d = d.slice(2);
    if (d.startsWith("0")) d = d.slice(1);
    if (!d.startsWith("39") && d.length <= 10) d = "39" + d;
    if (!d) return null;
    const q = text ? `?text=${encodeURIComponent(text)}` : "";
    return `https://wa.me/${d}${q}`;
}

export function AnnuncioCard({ a, index = 0, fav = null }) {
    const isNoleggio = a.tipo !== "vendita" && a.tipo !== "usato";
    const telefono = a.contatto_telefono || a.azienda_telefono || a.telefono;
    const comuneRitiro = a.comune || a.zona;
    const haCauzione = a.cauzione !== undefined && a.cauzione !== null && Number(a.cauzione) > 0;

    return (
        <article
            data-testid={`annuncio-card-${a.id}`}
            style={{ animationDelay: `${(index % 4) * 70}ms` }}
            className="group flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-navy-700/60 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-xl hover:shadow-brand/10 transition-[transform,border-color,box-shadow] duration-300 animate-in fade-in slide-in-from-bottom-4"
        >
            <Link
                to={`/annunci/${a.id}`}
                className="relative block h-48 overflow-hidden bg-navy-900"
                data-testid={`annuncio-img-link-${a.id}`}
            >
                <BlurImage
                    src={annuncioImg(a)}
                    alt={a.titolo}
                    loading="lazy"
                    imgClassName="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" aria-hidden="true" />
                
                {/* Badge tipologia / categoria principale */}
                <span
                    className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-md ${
                        isNoleggio ? "bg-brand text-white" : "bg-emerald-500 text-navy"
                    }`}
                >
                    {isNoleggio ? <Truck className="h-3 w-3" /> : <Recycle className="h-3 w-3" />}
                    {a.categoria || (isNoleggio ? "Noleggio" : `Usato · ${a.stato || "Buono"}`)}
                </span>

                {fav?.active && (
                    <button
                        type="button"
                        data-testid={`annuncio-fav-${a.id}`}
                        aria-pressed={fav.saved}
                        aria-label={fav.saved ? "Rimuovi dai preferiti" : "Salva nei preferiti"}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fav.onToggle(a);
                        }}
                        className={`absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors active:scale-90 ${
                            fav.saved
                                ? "bg-brand/90 border-brand text-white"
                                : "bg-navy/70 border-white/15 text-slate-200 hover:text-brand hover:border-brand/50"
                        }`}
                    >
                        <Heart className={`h-4 w-4 ${fav.saved ? "fill-current" : ""}`} />
                    </button>
                )}

                {a.disponibile === false && (
                    <span
                        data-testid={`annuncio-non-disponibile-${a.id}`}
                        className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-red-500/90 text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-lg"
                    >
                        Non disponibile
                    </span>
                )}
                {a.venduto && (
                    <span
                        data-testid={`annuncio-venduto-${a.id}`}
                        className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-red-500 text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-lg"
                    >
                        Venduto
                    </span>
                )}
            </Link>

            <div className="flex flex-col flex-1 p-5">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-white leading-snug line-clamp-2 text-base">
                        {a.titolo}
                    </h3>
                </div>

                {a.recensioni > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-brand-amber" data-testid={`annuncio-rating-${a.id}`}>
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-semibold text-white">{Number(a.rating).toFixed(1)}</span>
                        <span className="text-slate-500">({a.recensioni} {a.recensioni === 1 ? "recensione" : "recensioni"})</span>
                    </p>
                )}

                {a.descrizione && (
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-400 line-clamp-2">
                        {a.descrizione}
                    </p>
                )}

                {/* Dettagli: Comune di ritiro, Categoria / Sottocategoria, Cauzione */}
                <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
                    {comuneRitiro && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                            <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
                            {comuneRitiro}
                        </span>
                    )}

                    {a.categoria && (
                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-slate-300 text-[11px]">
                            {a.categoria}
                        </span>
                    )}

                    {a.sottocategoria && (
                        <span
                            className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-slate-400 text-[11px]"
                            data-testid={`annuncio-sottocategoria-${a.id}`}
                        >
                            {a.sottocategoria}
                        </span>
                    )}

                    {haCauzione && (
                        <span
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300"
                            title="Cauzione richiesta al ritiro"
                        >
                            <ShieldAlert className="h-3 w-3 text-amber-400" />
                            Cauzione: {Number(a.cauzione).toLocaleString("it-IT")} €
                        </span>
                    )}
                </div>

                {/* Prezzo e Pulsanti Rapidi di Contatto */}
                <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-white/5">
                    <div className="flex items-baseline justify-between gap-2">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Tariffa</span>
                            <span
                                className="font-display font-black text-brand text-lg whitespace-nowrap"
                                data-testid={`annuncio-price-${a.id}`}
                            >
                                {prezzoLabel(a)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            asChild
                            size="sm"
                            className="flex-1 rounded-full bg-white/5 border border-white/10 text-white hover:bg-brand hover:border-brand font-semibold text-xs"
                        >
                            <Link to={`/annunci/${a.id}`} data-testid={`annuncio-cta-${a.id}`}>
                                {isNoleggio ? "Scheda attrezzo" : "Dettagli"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                        </Button>

                        {/* Pulsante rapido Chiama (tel:) */}
                        {telefono && (
                            <a
                                href={`tel:${telefono.replace(/\s/g, "")}`}
                                data-testid={`annuncio-call-${a.id}`}
                                onClick={(e) => e.stopPropagation()}
                                title={`Chiama subito: ${telefono}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-colors whitespace-nowrap"
                            >
                                <Phone className="h-3.5 w-3.5" /> Chiama
                            </a>
                        )}

                        {/* Pulsante rapido WhatsApp */}
                        {telefono && (
                            <a
                                href={waLink(
                                    telefono,
                                    `Ciao, ho visto l'annuncio "${a.titolo}" su CasaLavoroPRO (${comuneRitiro ? `ritiro a ${comuneRitiro}` : ""}) e vorrei informazioni sulla disponibilità.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid={`annuncio-whatsapp-${a.id}`}
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Contatta su WhatsApp"
                                title="Scrivi su WhatsApp"
                                className="inline-flex items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

export function ContattoAzienda({ a }) {
    const telefono = a.contatto_telefono || a.azienda_telefono || a.telefono;
    const comuneRitiro = a.comune || a.zona;
    const privato = a.venditore_privato || (!a.azienda_id && !a.azienda_nome);

    return (
        <div className="flex flex-col gap-2 text-sm">
            {privato ? (
                <span data-testid="annuncio-venditore-nome" className="flex items-center gap-2 text-white font-semibold">
                    {a.azienda_nome || "Referente CasaLavoroPRO"}
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {a.tipo === "noleggio" ? "Noleggiatore" : "Venditore"}
                    </span>
                </span>
            ) : (
                <Link
                    to={a.azienda_id ? `/aziende/${a.azienda_id}` : "#"}
                    data-testid="annuncio-azienda-link"
                    className="flex items-center gap-2 text-white font-semibold hover:text-brand transition-colors"
                >
                    {a.azienda_nome} {a.azienda_verified && <VerifiedBadge verified={a.azienda_verified} />}
                </Link>
            )}

            {comuneRitiro && (
                <span className="flex items-center gap-2 text-slate-300 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-brand" /> Comune di ritiro: {comuneRitiro}
                </span>
            )}

            {telefono && (
                <a
                    href={`tel:${telefono.replace(/\s/g, "")}`}
                    data-testid="annuncio-phone-link"
                    className="flex items-center gap-2 text-slate-300 hover:text-brand transition-colors text-xs font-semibold"
                >
                    <Phone className="h-3.5 w-3.5 text-brand" /> {telefono}
                </a>
            )}
        </div>
    );
}
