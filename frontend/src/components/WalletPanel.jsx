import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Coins, Sparkles, ShoppingCart, Loader2, Clock, Infinity as InfinityIcon, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatApiError } from "@/lib/api";

const ACTION_LABELS = {
    analisi_bolletta: "Scansione Bolletta",
    bolletta_extra: "Scansione Bolletta",
    annuncio_standard: "Annuncio Lavoro Standard",
    annuncio_urgente: "Annuncio In Evidenza",
    sblocco_contatto: "Sblocco Contatto",
    ricarica_stripe: "Acquisto Pacchetto",
    bonus_iniziale: "Bonus di Benvenuto",
    bonus_mensile: "Bonus Mensile",
};

const PKG_HINT = {
    prod_entry_15: "Ideale per iniziare",
    prod_growth_50: "Il miglior rapporto qualità/prezzo",
    prod_enterprise_120: "Per chi lavora ad alto volume",
};

function actionLabel(m) {
    if (m.action === "sblocco_contatto" && m.meta?.tipo) {
        return m.meta.tipo === "operaio" ? "Sblocco Operaio" : "Sblocco Macchinario";
    }
    return ACTION_LABELS[m.action] || m.action;
}

function fmtEuro(cent) {
    return `€${(cent / 100).toFixed(2).replace(".", ",")}`;
}

function fmtDate(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return iso.slice(0, 10);
    }
}

export function WalletPanel() {
    const [wallet, setWallet] = useState(null);
    const [pacchetti, setPacchetti] = useState([]);
    const [movimenti, setMovimenti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(null);

    const load = useCallback(async () => {
        try {
            const [w, c, m] = await Promise.all([
                api.get("/crediti/wallet"),
                api.get("/crediti/costi"),
                api.get("/crediti/movimenti"),
            ]);
            setWallet(w.data);
            setPacchetti(c.data.pacchetti || []);
            setMovimenti(m.data || []);
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Saldo residuo per riga: calcolato a ritroso dal saldo attuale (movimenti dal più recente).
    const righe = useMemo(() => {
        let running = wallet?.saldo_crediti ?? 0;
        return movimenti.map((m) => {
            const residuo = running;
            running -= (m.delta || 0);
            return { ...m, residuo };
        });
    }, [movimenti, wallet]);

    const acquista = async (packageId) => {
        setBuying(packageId);
        try {
            const { data } = await api.post("/stripe/create-checkout-session", {
                package_id: packageId, origin_url: window.location.origin,
            });
            window.location.href = data.checkout_url;
        } catch (err) {
            toast.error(formatApiError(err));
            setBuying(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-400" data-testid="wallet-loading">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Caricamento wallet…
            </div>
        );
    }

    const bonus = wallet?.bonus_credits ?? 0;
    const acquistati = wallet?.purchased_credits ?? 0;
    const totale = wallet?.saldo_crediti ?? 0;

    return (
        <div className="space-y-8" data-testid="wallet-panel">
            {/* Saldo Totale in evidenza */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-brand bg-gradient-to-b from-brand/15 to-navy-700/70 p-7 sm:p-9 shadow-2xl shadow-brand/10">
                <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
                <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Il tuo wallet</p>
                <div className="mt-3 flex items-center gap-3">
                    <Coins className="h-10 w-10 text-brand" />
                    <span className="font-display font-black text-5xl sm:text-6xl text-white tracking-tight" data-testid="wallet-total-balance">
                        {totale}
                    </span>
                    <span className="font-display font-bold text-2xl text-slate-300 self-end mb-1">Crediti</span>
                </div>

                {/* Sotto-pannello trasparente con il dettaglio */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4" data-testid="wallet-bonus-detail">
                        <div className="flex items-center gap-2 text-amber-300">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-semibold">Crediti Bonus Mensili</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">Scadenza 30gg</p>
                        <p className="mt-2 font-display font-black text-3xl text-white" data-testid="wallet-bonus-value">{bonus}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4" data-testid="wallet-purchased-detail">
                        <div className="flex items-center gap-2 text-emerald-300">
                            <InfinityIcon className="h-4 w-4" />
                            <span className="text-xs font-semibold">Crediti Acquistati</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">Senza scadenza</p>
                        <p className="mt-2 font-display font-black text-3xl text-white" data-testid="wallet-purchased-value">{acquistati}</p>
                    </div>
                </div>
            </div>

            {/* Griglia pacchetti ricarica */}
            <div>
                <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand" /> Ricarica il tuo wallet
                </h3>
                <p className="mt-1 text-sm text-slate-400">Acquista crediti per sbloccare contatti, pubblicare annunci in evidenza e analizzare bollette extra.</p>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="wallet-packages-grid">
                    {pacchetti.map((p) => {
                        const consigliato = p.id === "prod_growth_50";
                        return (
                            <div key={p.id}
                                data-testid={`wallet-package-${p.id}`}
                                className={`relative rounded-3xl p-7 flex flex-col ${
                                    consigliato
                                        ? "border-2 border-brand bg-gradient-to-b from-brand/15 to-navy-700/70 shadow-2xl shadow-brand/10"
                                        : "border border-white/10 bg-navy-700/70"
                                }`}>
                                {consigliato && (
                                    <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white" data-testid="wallet-package-recommended">
                                        CONSIGLIATO
                                    </span>
                                )}
                                <h4 className="font-display font-bold text-white text-lg">Pacchetto {p.nome}</h4>
                                <div className="mt-3 flex items-baseline gap-2">
                                    <Coins className="h-5 w-5 text-brand self-center" />
                                    <span className="font-display font-black text-4xl text-white">{p.crediti}</span>
                                    <span className="text-sm font-semibold text-slate-400">crediti</span>
                                </div>
                                <p className="mt-2 font-display font-black text-2xl text-brand">{fmtEuro(p.prezzo_cent)}</p>
                                <p className="mt-1 text-xs text-slate-400">{PKG_HINT[p.id] || ""}</p>
                                <Button
                                    onClick={() => acquista(p.id)}
                                    disabled={!!buying}
                                    data-testid={`wallet-buy-${p.id}`}
                                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                                    {buying === p.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                                    {buying === p.id ? "Reindirizzamento…" : "Acquista Ora"}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Storico attività wallet */}
            <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8" data-testid="wallet-history">
                <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
                    <History className="h-5 w-5 text-brand" /> Storico Attività Wallet
                </h3>

                {righe.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center">
                        <Coins className="h-10 w-10 text-slate-500 mx-auto" />
                        <p className="mt-3 text-sm text-slate-400">Nessuna transazione ancora. Le tue attività con i crediti compariranno qui.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: schede impilate */}
                        <div className="mt-5 space-y-3 sm:hidden" data-testid="wallet-history-mobile">
                            {righe.map((m, i) => (
                                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid={`wallet-history-card-${i}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-200 font-semibold text-sm">{actionLabel(m)}</span>
                                        <span className={`font-bold ${m.delta >= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                                            {m.delta >= 0 ? `+${m.delta}` : m.delta}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-slate-400">{fmtDate(m.created_at)}</span>
                                        <span className="inline-flex items-center gap-1 text-white font-semibold">
                                            <Coins className="h-3.5 w-3.5 text-brand" />{m.residuo} residui
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: tabella */}
                        <div className="mt-5 overflow-x-auto hidden sm:block">
                            <table className="w-full text-sm" data-testid="wallet-history-table">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-white/10">
                                        <th className="py-3 pr-4 font-semibold">Data</th>
                                        <th className="py-3 pr-4 font-semibold">Tipo Azione</th>
                                        <th className="py-3 pr-4 font-semibold text-right">Crediti</th>
                                        <th className="py-3 font-semibold text-right">Saldo Residuo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {righe.map((m, i) => (
                                        <tr key={i} className="border-b border-white/5 last:border-0" data-testid={`wallet-history-row-${i}`}>
                                            <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{fmtDate(m.created_at)}</td>
                                            <td className="py-3 pr-4 text-slate-200">{actionLabel(m)}</td>
                                            <td className={`py-3 pr-4 text-right font-bold ${m.delta >= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                                                {m.delta >= 0 ? `+${m.delta}` : m.delta}
                                            </td>
                                            <td className="py-3 text-right font-semibold text-white">
                                                <span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-brand" />{m.residuo}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
