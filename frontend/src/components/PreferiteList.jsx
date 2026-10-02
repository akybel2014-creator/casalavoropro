import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Siren, ArrowRight, Zap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AziendaAvatar, VerifiedBadge } from "@/pages/Aziende";

function quoteLink(a) {
    const q = new URLSearchParams();
    if (a.categorie?.[0]) q.set("categoria", a.categorie[0]);
    if (a.zone?.[0]) q.set("zona", a.zone[0]);
    return `/nuova-richiesta?${q.toString()}`;
}

export function PreferiteList({ items, onRemove }) {
    if (items === null) return <p className="text-sm text-slate-500">Caricamento preferite…</p>;

    if (items.length === 0) {
        return (
            <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-10 text-center" data-testid="preferite-empty">
                <Heart className="h-10 w-10 text-slate-500 mx-auto" />
                <h3 className="mt-4 font-display font-bold text-white text-lg">Nessuna azienda preferita</h3>
                <p className="mt-1 text-sm text-slate-400">Salva le aziende che ti convincono con il cuore: le ritroverai qui per ricontattarle al volo.</p>
                <Button asChild className="mt-5 rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                    <Link to="/aziende" data-testid="preferite-browse-link">Esplora le aziende</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="preferite-list">
            {items.map((a) => (
                <div key={a.id} data-testid={`preferita-card-${a.id}`}
                    className="flex flex-col rounded-3xl border border-white/10 bg-navy-700/60 p-6 hover:border-brand/40 transition-colors">
                    <div className="flex items-start gap-4">
                        <AziendaAvatar nome={a.nome} />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display font-bold text-white truncate">{a.nome}</h3>
                                <VerifiedBadge verified={a.verified} />
                                {a.emergenze && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                                        <Siren className="h-3 w-3" /> Emergenze
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-brand-amber">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                <span className="font-semibold text-white">{a.rating > 0 ? a.rating.toFixed(1) : "Nuova"}</span>
                                {a.recensioni > 0 && <span className="text-slate-500">({a.recensioni})</span>}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="h-3.5 w-3.5 text-brand" /> {a.zone?.join(" · ")}
                            </div>
                        </div>
                        <button type="button" onClick={() => onRemove(a.id, a.nome)} data-testid={`preferita-remove-${a.id}`}
                            title="Rimuovi dalle preferite" aria-label="Rimuovi dalle preferite"
                            className="shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:border-red-400/40 transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {a.categorie?.slice(0, 3).map((c) => (
                            <span key={c} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-slate-300">{c}</span>
                        ))}
                    </div>
                    <div className="mt-auto pt-5 flex flex-col sm:flex-row gap-2">
                        <Button asChild className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/20">
                            <Link to={quoteLink(a)} data-testid={`preferita-quote-${a.id}`}>
                                <Zap className="h-4 w-4 mr-1.5" /> Ricontatta al volo
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                            <Link to={`/aziende/${a.id}`} data-testid={`preferita-view-${a.id}`}>
                                Profilo <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
