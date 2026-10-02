import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, Building2, ShieldCheck, CreditCard, MapPin, Send, Check, Loader2, Siren, PhoneCall } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/components/landing/CategoryGrid";

const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";

function RispondiDialog({ richiesta, onDone }) {
    const [open, setOpen] = useState(false);
    const [prezzo, setPrezzo] = useState("");
    const [durata, setDurata] = useState("3");
    const [messaggio, setMessaggio] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post(`/richieste/${richiesta.id}/risposte`, {
                prezzo: parseFloat(prezzo), messaggio, durata_giorni: parseInt(durata, 10),
            });
            toast.success("Preventivo inviato al cliente!");
            setOpen(false);
            setPrezzo(""); setDurata("3"); setMessaggio("");
            onDone();
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" data-testid={`respond-button-${richiesta.id}`}
                    className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Invia preventivo
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-h-[90vh] overflow-y-auto" data-testid={`respond-dialog-${richiesta.id}`}>
                <DialogHeader>
                    <DialogTitle className="font-display">Preventivo per: {richiesta.titolo}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4" data-testid="respond-form">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Prezzo (EUR)</Label>
                            <Input required type="number" step="0.01" min="1" data-testid="respond-price-input" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} placeholder="2450" className={inputCls} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Durata (giorni)</Label>
                            <Input required type="number" min="1" max="365" data-testid="respond-duration-input" value={durata} onChange={(e) => setDurata(e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Messaggio per il cliente</Label>
                        <Textarea required minLength={10} rows={4} data-testid="respond-message-input" value={messaggio} onChange={(e) => setMessaggio(e.target.value)}
                            placeholder="Descrivi cosa include il tuo preventivo: materiali, tempi, garanzie…" className={inputCls} />
                    </div>
                    <Button type="submit" disabled={busy} data-testid="respond-submit-button"
                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold">
                        {busy ? "Invio…" : "Invia preventivo"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardAzienda() {
    const { user, azienda, refreshMe } = useAuth();
    const [mine, setMine] = useState(azienda);
    const [feed, setFeed] = useState(null);
    const [busy, setBusy] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);

    const load = useCallback(async () => {
        try {
            const [m, f] = await Promise.all([api.get("/aziende/mine"), api.get("/richieste/feed")]);
            setMine(m.data);
            setFeed(f.data);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const saveProfile = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const body = {
                nome: mine.nome, descrizione: mine.descrizione, telefono: mine.telefono || "",
                sito: mine.sito || "", piva: mine.piva || "", durc_number: mine.durc_number || "",
                categorie: mine.categorie || [], zone: mine.zone || [],
            };
            const { data } = await api.put("/aziende/mine", body);
            setMine(data);
            toast.success("Profilo aggiornato!");
            refreshMe();
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    const richiediVerifica = async () => {
        try {
            await api.post("/aziende/mine/verifica");
            toast.success("Richiesta di verifica inviata: il nostro staff controllera i documenti.");
            load();
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };

    const saveEmergenze = async () => {
        try {
            const { data } = await api.put("/aziende/mine", {
                emergenze: !!mine.emergenze,
                emergenze_weekend: !!mine.emergenze_weekend,
                emergenze_notturno: !!mine.emergenze_notturno,
                emergenze_telefono: mine.emergenze_telefono || "",
            });
            setMine(data);
            toast.success("Disponibilità emergenze aggiornata!");
            refreshMe();
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };

    const checkout = async (lookupKey) => {
        setCheckingOut(true);
        try {
            const { data } = await api.post("/payments/checkout", {
                lookup_key: lookupKey, origin_url: window.location.origin,
            });
            window.location.href = data.checkout_url;
        } catch (err) {
            toast.error(formatApiError(err));
            setCheckingOut(false);
        }
    };

    const toggleCat = (c) => setMine((m) => ({ ...m, categorie: m.categorie?.includes(c) ? m.categorie.filter((x) => x !== c) : [...(m.categorie || []), c] }));

    const VER_STYLES = {
        none: ["bg-white/5 text-slate-400", "Non richiesta"],
        in_attesa: ["bg-amber-500/15 text-amber-400", "In attesa di revisione"],
        verificata: ["bg-emerald-500/15 text-emerald-400", "Verificata PRO"],
        rifiutata: ["bg-red-500/15 text-red-400", "Non superata"],
    };

    return (
        <div className="min-h-screen bg-navy grid-pattern px-4 py-24" data-testid="dashboard-azienda">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Area aziende</p>
                        <h1 className="mt-1 font-display font-black text-3xl text-white tracking-tight">{mine?.nome}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {mine?.plan === "pro" && <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-brand uppercase tracking-wide">Abbonamento PRO</span>}
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VER_STYLES[mine?.verification_status]?.[0]}`}>
                            {VER_STYLES[mine?.verification_status]?.[1]}
                        </span>
                    </div>
                </div>

                <Tabs defaultValue="leads" className="mt-8">
                    <TabsList className="bg-navy-700 border border-white/10 flex-wrap h-auto">
                        <TabsTrigger value="leads" data-testid="dashboard-azienda-tab-leads" className="data-[state=active]:text-white">
                            <Briefcase className="h-4 w-4 mr-1.5" /> Richieste in arrivo
                        </TabsTrigger>
                        <TabsTrigger value="profilo" className="data-[state=active]:text-white">
                            <Building2 className="h-4 w-4 mr-1.5" /> Profilo
                        </TabsTrigger>
                        <TabsTrigger value="verifica" className="data-[state=active]:text-white">
                            <ShieldCheck className="h-4 w-4 mr-1.5" /> Verifica
                        </TabsTrigger>
                        <TabsTrigger value="emergenze" data-testid="dashboard-azienda-tab-emergenze" className="data-[state=active]:text-white">
                            <Siren className="h-4 w-4 mr-1.5" /> Emergenze
                        </TabsTrigger>
                        <TabsTrigger value="abbonamento" className="data-[state=active]:text-white">
                            <CreditCard className="h-4 w-4 mr-1.5" /> Abbonamento
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="leads" className="mt-6 space-y-4" data-testid="azienda-leads-list">
                        {feed && feed.length === 0 && (
                            <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-10 text-center">
                                <Briefcase className="h-10 w-10 text-slate-500 mx-auto" />
                                <h3 className="mt-4 font-display font-bold text-white text-lg">Nessuna richiesta aperta nella tua zona</h3>
                                <p className="mt-1 text-sm text-slate-400">Le richieste della tua categoria appariranno qui. Aggiorna le categorie nel profilo per riceverne di piu.</p>
                            </div>
                        )}
                        {feed && feed.map((r) => (
                            <div key={r.id} className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-7" data-testid={`lead-card-${r.id}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-display font-bold text-white text-lg">{r.titolo}</h3>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" /> {r.zona}</span>
                                            <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">{r.categoria}</span>
                                            {r.budget && <span>Budget: {r.budget}</span>}
                                            <span>Cliente: {r.client_name}</span>
                                        </div>
                                    </div>
                                    {r.risposto ? (
                                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-3 py-1.5" data-testid={`lead-responded-${r.id}`}>
                                            <Check className="h-3.5 w-3.5 inline mr-1" /> Preventivo inviato
                                        </span>
                                    ) : (
                                        <RispondiDialog richiesta={r} onDone={load} />
                                    )}
                                </div>
                                <p className="mt-3 text-sm text-slate-300 leading-relaxed">{r.descrizione}</p>
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="profilo" className="mt-6">
                        {mine && (
                            <form onSubmit={saveProfile} data-testid="azienda-profile-form" className="rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Nome azienda</Label>
                                        <Input required value={mine.nome || ""} onChange={(e) => setMine((m) => ({ ...m, nome: e.target.value }))} data-testid="profile-name-input" className={inputCls} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Telefono</Label>
                                        <Input value={mine.telefono || ""} onChange={(e) => setMine((m) => ({ ...m, telefono: e.target.value }))} data-testid="profile-phone-input" placeholder="+39 …" className={inputCls} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Sito web</Label>
                                        <Input value={mine.sito || ""} onChange={(e) => setMine((m) => ({ ...m, sito: e.target.value }))} data-testid="profile-website-input" placeholder="https://…" className={inputCls} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Zone di servizio (separate da virgola)</Label>
                                        <Input value={(mine.zone || []).join(", ")} onChange={(e) => setMine((m) => ({ ...m, zone: e.target.value.split(",").map((z) => z.trim()).filter(Boolean) }))} data-testid="profile-zone-input" className={inputCls} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Categorie</Label>
                                    <div className="flex flex-wrap gap-1.5" data-testid="profile-categories">
                                        {CATEGORIES.map((c) => (
                                            <button key={c.name} type="button" onClick={() => toggleCat(c.name)}
                                                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                                                    mine.categorie?.includes(c.name)
                                                        ? "border-brand bg-brand/15 text-brand"
                                                        : "border-white/15 text-slate-400 hover:text-white"
                                                }`}>
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Descrizione</Label>
                                    <Textarea rows={4} value={mine.descrizione || ""} onChange={(e) => setMine((m) => ({ ...m, descrizione: e.target.value }))} data-testid="profile-description-input" className={inputCls} />
                                </div>
                                <Button type="submit" disabled={busy} data-testid="profile-save-button"
                                    className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold">
                                    {busy ? "Salvataggio…" : "Salva profilo"}
                                </Button>
                            </form>
                        )}
                    </TabsContent>

                    <TabsContent value="verifica" className="mt-6">
                        {mine && (
                            <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8" data-testid="verification-panel">
                                <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-brand" /> Verifica Azienda PRO
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Inserisci Partita IVA e numero DURC: il nostro staff controlla i documenti e attiva il badge "Azienda Verificata".
                                </p>
                                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Partita IVA</Label>
                                        <Input value={mine.piva || ""} onChange={(e) => setMine((m) => ({ ...m, piva: e.target.value }))} data-testid="verification-piva-input" placeholder="IT01234567890" className={inputCls} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Numero DURC</Label>
                                        <Input value={mine.durc_number || ""} onChange={(e) => setMine((m) => ({ ...m, durc_number: e.target.value }))} data-testid="verification-durc-input" placeholder="DURC-…" className={inputCls} />
                                    </div>
                                </div>
                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    <Button type="button" onClick={richiediVerifica} data-testid="verification-submit-button"
                                        className="rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold">
                                        Invia richiesta di verifica
                                    </Button>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${VER_STYLES[mine.verification_status]?.[0]}`}>
                                        {VER_STYLES[mine.verification_status]?.[1]}
                                    </span>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="emergenze" className="mt-6" data-testid="emergency-panel">
                        {mine && (
                            <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8">
                                <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                    <Siren className="h-5 w-5 text-brand" /> Disponibilità emergenze 24/7
                                </h3>
                                <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                                    Dichiara se intervieni in emergenza, nel weekend e in orario notturno: comparirai nella ricerca
                                    "Emergenze 24/7" e sul tuo profilo pubblico con il numero dedicato.
                                </p>

                                <div className="mt-6 space-y-4" data-testid="emergency-toggles">
                                    {[
                                        { key: "emergenze", label: "Interventi d'emergenza", desc: "Accetti guasti urgenti fuori orario", t: "emergency-toggle-main" },
                                        { key: "emergenze_weekend", label: "Disponibilità nel weekend", desc: "Sabato e domenica", t: "emergency-toggle-weekend" },
                                        { key: "emergenze_notturno", label: "Disponibilità notturna", desc: "Interventi nelle ore 22:00 – 6:00", t: "emergency-toggle-night" },
                                    ].map((row) => (
                                        <div key={row.key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-navy/60 p-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{row.label}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{row.desc}</p>
                                            </div>
                                            <Switch
                                                data-testid={row.t}
                                                checked={!!mine[row.key]}
                                                onCheckedChange={(v) => setMine((m) => ({ ...m, [row.key]: v }))}
                                                className="data-[state=checked]:bg-brand"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 max-w-sm space-y-2">
                                    <Label className="text-slate-300">Telefono dedicato emergenze</Label>
                                    <Input
                                        value={mine.emergenze_telefono || ""}
                                        onChange={(e) => setMine((m) => ({ ...m, emergenze_telefono: e.target.value }))}
                                        data-testid="emergency-phone-input"
                                        placeholder="+39 335 000 0000"
                                        className={inputCls}
                                    />
                                    <p className="text-xs text-slate-500">Visibile sul profilo pubblico solo se attivi gli interventi d'emergenza.</p>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <Button type="button" onClick={saveEmergenze} data-testid="emergency-save-button"
                                        className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                                        Salva disponibilità
                                    </Button>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mine.emergenze ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-slate-400"}`} data-testid="emergency-status-badge">
                                        {mine.emergenze ? "Emergenze 24/7 attive sul profilo" : "Emergenze non dichiarate"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="abbonamento" className="mt-6" data-testid="subscription-panel">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-7">
                                <h3 className="font-display font-bold text-white text-xl">Base</h3>
                                <p className="mt-1 font-display font-black text-3xl text-white">Gratis</p>
                                <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                                    {["Profilo azienda nella directory", "Ricevi richieste della tua categoria", "Invia fino a 2 preventivi al mese"].map((f) => (
                                        <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-slate-500" /> {f}</li>
                                    ))}
                                </ul>
                                {mine?.plan !== "pro" && <p className="mt-6 text-xs text-slate-500">Il tuo piano attuale</p>}
                            </div>

                            <div className="relative rounded-3xl border-2 border-brand bg-gradient-to-b from-brand/15 to-navy-700/70 p-7 shadow-2xl shadow-brand/10">
                                <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">CONSIGLIATO</span>
                                <h3 className="font-display font-bold text-white text-xl">Pro</h3>
                                <p className="mt-1 font-display font-black text-3xl text-white">€29<span className="text-base font-semibold text-slate-400">/mese</span></p>
                                <p className="text-xs text-slate-400">oppure €290/anno</p>
                                <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                                    {["Badge PRO e posizionamento in evidenza", "Preventivi illimitati", "Richieste di tutte le categorie della tua zona", "Priorita nelle ricerche dei privati"].map((f) => (
                                        <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> {f}</li>
                                    ))}
                                </ul>
                                {mine?.plan === "pro" ? (
                                    <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-semibold px-4 py-2" data-testid="subscription-active-badge">
                                        <Check className="h-4 w-4" /> Abbonamento attivo
                                    </p>
                                ) : (
                                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                        <Button onClick={() => checkout("pro_monthly")} disabled={checkingOut} data-testid="checkout-monthly-button"
                                            className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                                            {checkingOut && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Attiva mensile
                                        </Button>
                                        <Button onClick={() => checkout("pro_yearly")} disabled={checkingOut} data-testid="checkout-yearly-button" variant="outline"
                                            className="flex-1 rounded-xl border-brand text-brand hover:bg-brand hover:text-navy font-semibold">
                                            Attiva annuale
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
