import { Link } from "react-router-dom";
import { CalendarDays, Check, X, Ban, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATO = {
    richiesta: ["bg-amber-500/15 text-amber-400", "In attesa"],
    confermata: ["bg-emerald-500/15 text-emerald-400", "Confermata"],
    rifiutata: ["bg-red-500/15 text-red-400", "Rifiutata"],
    annullata: ["bg-white/5 text-slate-500", "Annullata"],
};

const eur = (n) => Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const dIt = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

export function PrenotazioniList({ items, ruolo, onStato, onAnnulla }) {
    if (items === null) return <p className="text-sm text-slate-500">Caricamento prenotazioni…</p>;
    if (items.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center" data-testid="prenotazioni-empty">
                <CalendarDays className="h-10 w-10 text-slate-500 mx-auto" />
                <p className="mt-3 text-sm text-slate-400">
                    {ruolo === "privato" ? "Nessun noleggio prenotato. Scegli un mezzo e le date dal Noleggio Attrezzi." : "Nessuna richiesta di noleggio ricevuta per ora."}
                </p>
                {ruolo === "privato" && (
                    <Button asChild className="mt-5 rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                        <Link to="/noleggio" data-testid="prenotazioni-browse-link">Vai al Noleggio Attrezzi</Link>
                    </Button>
                )}
            </div>
        );
    }
    return (
        <div className="space-y-3" data-testid="prenotazioni-list">
            {items.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5 flex flex-col sm:flex-row sm:items-center gap-4" data-testid={`prenotazione-card-${p.id}`}>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Link to={`/annunci/${p.annuncio_id}`} className="font-display font-bold text-white hover:text-brand transition-colors truncate flex items-center gap-1.5">
                                <Truck className="h-4 w-4 text-brand shrink-0" /> {p.annuncio_titolo}
                            </Link>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATO[p.stato]?.[0]}`} data-testid={`prenotazione-stato-${p.id}`}>{STATO[p.stato]?.[1]}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-300">
                            <CalendarDays className="h-3.5 w-3.5 inline text-brand mr-1" />
                            {dIt(p.dal)} → {dIt(p.al)} · {p.giorni} gg · <span className="font-semibold text-brand">{eur(p.totale)}</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {ruolo === "privato" ? `Azienda: ${p.azienda_nome}` : `Cliente: ${p.client_name}`}
                            {p.nota && <> · Nota: “{p.nota}”</>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {ruolo === "azienda" && p.stato === "richiesta" && (
                            <>
                                <Button size="sm" onClick={() => onStato(p.id, "confermata")} data-testid={`prenotazione-conferma-${p.id}`} className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-navy font-semibold">
                                    <Check className="h-4 w-4 mr-1" /> Conferma
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => onStato(p.id, "rifiutata")} data-testid={`prenotazione-rifiuta-${p.id}`} className="rounded-full text-red-400 hover:text-red-300 hover:bg-white/5">
                                    <X className="h-4 w-4 mr-1" /> Rifiuta
                                </Button>
                            </>
                        )}
                        {ruolo === "privato" && (p.stato === "richiesta" || p.stato === "confermata") && (
                            <Button size="sm" variant="ghost" onClick={() => onAnnulla(p.id)} data-testid={`prenotazione-annulla-${p.id}`} className="rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5">
                                <Ban className="h-4 w-4 mr-1" /> Annulla
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
