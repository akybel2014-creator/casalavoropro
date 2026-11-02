import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Stars, StarInput } from "@/components/StarRating";
import { api, formatApiError } from "@/lib/api";
import { CalendarDays, Check, X, Ban, Truck, CreditCard, ShieldCheck, RotateCcw, MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATO = {
    richiesta: ["bg-amber-500/15 text-amber-400", "In attesa"],
    confermata: ["bg-emerald-500/15 text-emerald-400", "Confermata"],
    rifiutata: ["bg-red-500/15 text-red-400", "Rifiutata"],
    annullata: ["bg-white/5 text-slate-500", "Annullata"],
};

const eur = (n) => Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const dIt = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

const oggi = () => new Date().toISOString().slice(0, 10);
export const puoRecensire = (p) => p.stato === "confermata" && p.al < oggi() && !p.recensione;

function RecensioneNoleggioBox({ p, onDone }) {
    const [mezzo, setMezzo] = useState(5);
    const [azienda, setAzienda] = useState(5);
    const [commento, setCommento] = useState("");
    const [busy, setBusy] = useState(false);
    const submit = async () => {
        if (commento.trim().length < 5) return toast.error("Scrivi un commento di almeno 5 caratteri");
        setBusy(true);
        try {
            await api.post(`/prenotazioni/${p.id}/recensione`, { voto_mezzo: mezzo, voto_azienda: azienda, commento: commento.trim() });
            toast.success("Grazie! La tua recensione è online.");
            onDone?.(p.id, { voto_mezzo: mezzo, voto_azienda: azienda, commento: commento.trim() });
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="mt-4 rounded-2xl border border-brand/40 bg-brand/5 p-4" data-testid={`noleggio-review-box-${p.id}`}>
            <p className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquareHeart className="h-4 w-4 text-brand" /> Noleggio terminato: com'è andata?</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-400 mb-1">Il mezzo</p><StarInput value={mezzo} onChange={setMezzo} testPrefix={`noleggio-review-mezzo-${p.id}`} /></div>
                <div><p className="text-xs text-slate-400 mb-1">L'azienda</p><StarInput value={azienda} onChange={setAzienda} testPrefix={`noleggio-review-azienda-${p.id}`} /></div>
            </div>
            <Textarea rows={2} value={commento} onChange={(e) => setCommento(e.target.value)} data-testid={`noleggio-review-comment-${p.id}`}
                placeholder="Stato del mezzo, puntualità della consegna, disponibilità dell'azienda…" className="mt-3 bg-navy/70 border-white/10 text-white placeholder:text-slate-500" />
            <Button size="sm" disabled={busy} onClick={submit} data-testid={`noleggio-review-submit-${p.id}`} className="mt-3 rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                {busy ? "Pubblicazione…" : "Pubblica recensione"}
            </Button>
        </div>
    );
}

function CaparraBadge({ p }) {
    if (!p.caparra_importo) return null;
    if (p.caparra_stato === "rimborsata") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-sky-500/15 text-sky-300" data-testid={`prenotazione-caparra-${p.id}`}>
                <RotateCcw className="h-3 w-3" /> Caparra rimborsata {eur(p.caparra_importo)}
            </span>
        );
    }
    if (p.stato !== "confermata") return null;
    const pagata = p.caparra_stato === "pagata";
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${pagata ? "bg-emerald-500/15 text-emerald-400" : "bg-brand/15 text-brand"}`} data-testid={`prenotazione-caparra-${p.id}`}>
            {pagata ? <ShieldCheck className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
            {pagata ? `Caparra pagata ${eur(p.caparra_importo)}` : `Caparra da pagare ${eur(p.caparra_importo)}`}
        </span>
    );
}

export function PrenotazioniList({ items, ruolo, onStato, onAnnulla, onAnnullaAzienda, onPagaCaparra, payingId, onRecensita }) {
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
                            <CaparraBadge p={p} />
                        </div>
                        <p className="mt-1 text-sm text-slate-300">
                            <CalendarDays className="h-3.5 w-3.5 inline text-brand mr-1" />
                            {dIt(p.dal)} → {dIt(p.al)} · {p.giorni} gg · <span className="font-semibold text-brand">{eur(p.totale)}</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {ruolo === "privato" ? `Azienda: ${p.azienda_nome}` : `Cliente: ${p.client_name}`}
                            {p.nota && <> · Nota: “{p.nota}”</>}
                            {p.stato === "annullata" && p.annullata_da === "azienda" && <> · Annullato dall'azienda{p.motivo_annullamento && <>: “{p.motivo_annullamento}”</>}</>}
                        </p>
                        {p.recensione && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400" data-testid={`prenotazione-recensione-${p.id}`}>
                                <span className="flex items-center gap-1.5">Mezzo <Stars value={p.recensione.voto_mezzo} className="h-3.5 w-3.5" /></span>
                                <span className="flex items-center gap-1.5">Azienda <Stars value={p.recensione.voto_azienda} className="h-3.5 w-3.5" /></span>
                            </div>
                        )}
                        {ruolo === "privato" && puoRecensire(p) && <RecensioneNoleggioBox p={p} onDone={onRecensita} />}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {ruolo === "azienda" && p.stato === "confermata" && p.al >= oggi() && (
                            <Button size="sm" variant="ghost" onClick={() => onAnnullaAzienda(p.id)} data-testid={`prenotazione-annulla-azienda-${p.id}`} className="rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5">
                                <Ban className="h-4 w-4 mr-1" /> {p.caparra_stato === "pagata" ? "Annulla e rimborsa" : "Annulla"}
                            </Button>
                        )}
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
                        {ruolo === "privato" && p.stato === "confermata" && p.caparra_stato === "da_pagare" && (
                            <Button size="sm" disabled={payingId === p.id} onClick={() => onPagaCaparra(p.id)} data-testid={`prenotazione-paga-caparra-${p.id}`}
                                className="rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/20">
                                <CreditCard className="h-4 w-4 mr-1.5" /> {payingId === p.id ? "Apertura…" : `Paga caparra ${eur(p.caparra_importo)}`}
                            </Button>
                        )}
                        {ruolo === "privato" && (p.stato === "richiesta" || (p.stato === "confermata" && p.caparra_stato !== "pagata")) && (
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
