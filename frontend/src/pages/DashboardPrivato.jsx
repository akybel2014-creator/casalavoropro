import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Bell, FileText, Clock, MapPin, Check, Handshake, MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AziendaAvatar, VerifiedBadge } from "@/pages/Aziende";
import { Stars, StarInput } from "@/components/StarRating";
import ChatDialog from "@/components/ChatDialog";

const STATO_STYLES = {
    aperta: "bg-blue-500/15 text-blue-400",
    in_lavorazione: "bg-amber-500/15 text-amber-400",
    chiusa: "bg-emerald-500/15 text-emerald-400",
};

const STATO_LABELS = { aperta: "Aperta", in_lavorazione: "In lavorazione", chiusa: "Chiusa" };

function RecensioneBox({ richiesta, accettata, onDone }) {
    const [voto, setVoto] = useState(5);
    const [commento, setCommento] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (commento.trim().length < 5) {
            toast.error("Scrivi un commento di almeno 5 caratteri");
            return;
        }
        setBusy(true);
        try {
            await api.post(`/risposte/${accettata.id}/recensione`, { voto, commento: commento.trim() });
            toast.success("Grazie! La tua recensione è stata pubblicata.");
            onDone();
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-2xl border border-brand/40 bg-brand/5 p-5" data-testid={`review-box-${richiesta.id}`}>
            <p className="font-display font-bold text-white text-sm flex items-center gap-2">
                <MessageSquareHeart className="h-4 w-4 text-brand" /> Lavoro completato? Lascia una recensione
            </p>
            <p className="text-xs text-slate-400 mt-1">La tua opinione aiuta altri privati a scegliere con fiducia.</p>
            <div className="mt-3">
                <StarInput value={voto} onChange={setVoto} testPrefix={`review-${richiesta.id}`} />
            </div>
            <Textarea
                rows={2}
                value={commento}
                onChange={(e) => setCommento(e.target.value)}
                data-testid={`review-comment-input-${richiesta.id}`}
                placeholder="Com'è andata l'intervento? Tempi, qualità, prezzo…"
                className="mt-3 bg-navy/70 border-white/10 text-white placeholder:text-slate-500"
            />
            <Button size="sm" disabled={busy} onClick={submit} data-testid={`review-submit-${richiesta.id}`}
                className="mt-3 rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                {busy ? "Pubblicazione…" : "Pubblica recensione"}
            </Button>
        </div>
    );
}

export default function DashboardPrivato() {
    const { user } = useAuth();
    const [richieste, setRichieste] = useState(null);
    const [notifiche, setNotifiche] = useState([]);
    const [unreadChat, setUnreadChat] = useState({});

    const load = useCallback(async () => {
        try {
            const [r, n, u] = await Promise.all([
                api.get("/richieste/mine"), api.get("/notifiche"), api.get("/chat/unread-count"),
            ]);
            setRichieste(r.data);
            setNotifiche(n.data);
            setUnreadChat(u.data.per_risposta || {});
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const accetta = async (rispostaId) => {
        try {
            await api.post(`/risposte/${rispostaId}/accetta`);
            toast.success("Preventivo accettato! L'azienda ti contatterà a breve.");
            load();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const segnaLetta = async (id) => {
        await api.post(`/notifiche/${id}/letta`).catch(() => {});
        load();
    };

    return (
        <div className="min-h-screen bg-navy grid-pattern px-4 py-24" data-testid="dashboard-privato">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Area privati</p>
                        <h1 className="mt-1 font-display font-black text-3xl text-white tracking-tight">Ciao {user?.name}</h1>
                    </div>
                    <Button asChild data-testid="dashboard-new-request-button"
                        className="rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                        <Link to="/nuova-richiesta"><Plus className="h-4 w-4 mr-1.5" /> Nuova richiesta</Link>
                    </Button>
                </div>

                <Tabs defaultValue="richieste" className="mt-8">
                    <TabsList className="bg-navy-700 border border-white/10">
                        <TabsTrigger value="richieste" data-testid="dashboard-privato-tab-requests" className="data-[state=active]:text-white">
                            <FileText className="h-4 w-4 mr-1.5" /> Le mie richieste
                        </TabsTrigger>
                        <TabsTrigger value="notifiche" data-testid="dashboard-privato-tab-notifications" className="data-[state=active]:text-white">
                            <Bell className="h-4 w-4 mr-1.5" /> Notifiche
                            {notifiche.some((n) => !n.letto) && <span className="ml-1.5 h-2 w-2 rounded-full bg-brand inline-block" />}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="richieste" className="mt-6 space-y-6">
                        {richieste && richieste.length === 0 && (
                            <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-10 text-center" data-testid="dashboard-privato-empty">
                                <Handshake className="h-10 w-10 text-slate-500 mx-auto" />
                                <h3 className="mt-4 font-display font-bold text-white text-lg">Nessuna richiesta ancora</h3>
                                <p className="mt-1 text-sm text-slate-400">Crea la prima richiesta: è gratuito e senza impegno.</p>
                                <Button asChild className="mt-5 rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                                    <Link to="/nuova-richiesta">Richiedi un preventivo</Link>
                                </Button>
                            </div>
                        )}
                        {richieste && richieste.map((r) => {
                            const accettata = r.risposte?.find((x) => x.stato === "accettata");
                            return (
                                <div key={r.id} className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-7" data-testid={`richiesta-card-${r.id}`}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-display font-bold text-white text-lg">
                                                {r.titolo}
                                                {r.urgente && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white align-middle"><SirenDot /> URGENTE</span>}
                                            </h3>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" /> {r.zona}</span>
                                                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">{r.categoria}</span>
                                                {r.budget && <span className="flex items-center gap-1">Budget: {r.budget}</span>}
                                            </div>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATO_STYLES[r.stato]}`}>
                                            {STATO_LABELS[r.stato]}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">{r.descrizione}</p>

                                    <div className="mt-5 space-y-3" data-testid={`risposte-list-${r.id}`}>
                                        {r.risposte?.map((ris) => (
                                            <div key={ris.id} className="rounded-2xl border border-white/10 bg-navy/60 p-5" data-testid={`risposta-card-${ris.id}`}>
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <AziendaAvatar nome={ris.azienda_nome} size="h-10 w-10 text-sm" />
                                                        <div>
                                                            <p className="font-semibold text-white text-sm flex items-center gap-2">
                                                                {ris.azienda_nome} <VerifiedBadge verified={ris.azienda_verified} />
                                                            </p>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                <Clock className="h-3 w-3" /> Esecuzione in {ris.durata_giorni} giorni
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-display font-black text-xl text-brand" data-testid={`risposta-price-${ris.id}`}>
                                                            € {ris.prezzo.toLocaleString("it-IT", { minimumFractionDigits: 0 })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-sm text-slate-300">{ris.messaggio}</p>
                                                <div className="mt-4 flex items-center gap-2">
                                                    <ChatDialog rispostaId={ris.id} titolo={r.titolo} counterpart={ris.azienda_nome} senderRole="privato" />
                                                    {unreadChat[ris.id] > 0 && (
                                                        <span data-testid={`unread-badge-card-${ris.id}`} className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand text-white text-[11px] font-bold">
                                                            {unreadChat[ris.id]}
                                                        </span>
                                                    )}
                                                </div>
                                                {ris.stato === "inviata" && r.stato !== "chiusa" && (
                                                    <Button size="sm" data-testid={`accetta-button-${ris.id}`} onClick={() => accetta(ris.id)}
                                                        className="mt-4 rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                                                        <Check className="h-4 w-4 mr-1" /> Accetta preventivo
                                                    </Button>
                                                )}
                                                {ris.stato === "accettata" && <span className="mt-3 inline-block rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-3 py-1">Accettato</span>}
                                                {ris.stato === "rifiutata" && <span className="mt-3 inline-block rounded-full bg-white/5 text-slate-500 text-xs font-semibold px-3 py-1">Non accettato</span>}
                                            </div>
                                        ))}
                                        {r.risposte?.length === 0 && (
                                            <p className="text-sm text-slate-500 border border-dashed border-white/10 rounded-2xl p-5 text-center">
                                                Le aziende della zona stanno valutando la tua richiesta… i preventivi appariranno qui.
                                            </p>
                                        )}
                                    </div>

                                    {r.stato === "chiusa" && accettata && !r.recensione && (
                                        <div className="mt-5">
                                            <RecensioneBox richiesta={r} accettata={accettata} onDone={load} />
                                        </div>
                                    )}
                                    {r.recensione && (
                                        <div className="mt-5 rounded-2xl border border-white/10 bg-navy/60 p-5" data-testid={`review-given-${r.id}`}>
                                            <p className="text-sm font-semibold text-white flex items-center gap-2">
                                                <MessageSquareHeart className="h-4 w-4 text-brand" /> La tua recensione
                                            </p>
                                            <div className="mt-2"><Stars value={r.recensione.voto} /></div>
                                            <p className="mt-2 text-sm text-slate-300">{r.recensione.commento}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="notifiche" className="mt-6 space-y-3" data-testid="dashboard-notifiche-list">
                        {notifiche.length === 0 && <p className="text-sm text-slate-500">Nessuna notifica per ora.</p>}
                        {notifiche.map((n) => (
                            <div key={n.id} className={`rounded-2xl border p-5 flex items-start justify-between gap-4 ${n.letto ? "border-white/5 bg-navy-700/40" : "border-brand/30 bg-brand/5"}`} data-testid={`notifica-card-${n.id}`}>
                                <div>
                                    <p className="font-semibold text-white text-sm">{n.titolo}</p>
                                    <p className="mt-1 text-sm text-slate-400">{n.testo}</p>
                                </div>
                                {!n.letto && (
                                    <Button size="sm" variant="ghost" data-testid={`notifica-read-${n.id}`} onClick={() => segnaLetta(n.id)} className="text-brand hover:text-white shrink-0">
                                        Segna letta
                                    </Button>
                                )}
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function SirenDot() {
    return <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current"><path d="M12 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm7 9a1 1 0 011 1 8 8 0 01-16 0 1 1 0 112 0 6 6 0 0012 0 1 1 0 011-1z" /></svg>;
}
