import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    ShieldCheck, Check, X, Users, Building2, Crown,
    Search, Ban, TrendingUp, UserCog, Loader2, Sparkles, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AziendaAvatar } from "@/pages/Aziende";
import { CreaAziendaDialog, CreaAnnuncioDialog } from "@/components/admin/AdminCreate";

const STATUS_STYLES = {
    none: "bg-white/5 text-slate-400",
    in_attesa: "bg-amber-500/15 text-amber-400",
    verificata: "bg-emerald-500/15 text-emerald-400",
    rifiutata: "bg-red-500/15 text-red-400",
};
const STATUS_LABELS = { none: "Non richiesta", in_attesa: "In attesa", verificata: "Verificata", rifiutata: "Rifiutata" };

const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";
const selectCls = "w-full rounded-xl bg-navy/70 border border-white/10 text-white px-3 py-2.5 text-sm outline-none focus:border-brand";

const SUB_LABELS = {
    active: ["bg-emerald-500/15 text-emerald-400", "PRO attivo"],
    trialing: ["bg-brand/15 text-brand", "In prova"],
    active_trial: ["bg-brand/15 text-brand", "In prova"],
    trial_expired: ["bg-amber-500/15 text-amber-400", "Prova scaduta"],
    none: ["bg-white/5 text-slate-400", "Base / Gratis"],
};

function subInfo(u) {
    if (u.role !== "azienda") return ["bg-white/5 text-slate-400", u.role === "admin" ? "Admin" : "Privato"];
    return SUB_LABELS[u.subscription_status] || SUB_LABELS.none;
}

function UserManageDialog({ u, onDone }) {
    const [open, setOpen] = useState(false);
    const [role, setRole] = useState(u.role || "privato");
    const [busy, setBusy] = useState("");

    const saveRole = async () => {
        setBusy("role");
        try {
            await api.patch(`/admin/users/${u.id}/role`, { role });
            toast.success("Ruolo aggiornato.");
            onDone();
        } catch (e) { toast.error(formatApiError(e)); }
        finally { setBusy(""); }
    };

    const toggleSuspend = async () => {
        setBusy("suspend");
        try {
            const { data } = await api.patch(`/admin/users/${u.id}/suspend`, { suspended: !u.suspended });
            toast.success(data.suspended ? "Account sospeso." : "Account riattivato.");
            onDone();
            setOpen(false);
        } catch (e) { toast.error(formatApiError(e)); }
        finally { setBusy(""); }
    };

    const [sStyle, sLabel] = subInfo(u);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" data-testid={`manage-button-${u.id}`}
                    className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                    <UserCog className="h-3.5 w-3.5 mr-1.5" /> Gestisci
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-h-[90vh] overflow-y-auto" data-testid={`manage-dialog-${u.id}`}>
                <DialogHeader>
                    <DialogTitle className="font-display">{u.name} · {u.email}</DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">Gestisci ruolo e stato dell'account.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Abbonamento (sola lettura) */}
                    <div className="rounded-2xl border border-white/10 bg-navy/50 p-4">
                        <p className="text-sm font-semibold text-white flex items-center gap-2"><Crown className="h-4 w-4 text-brand" /> Abbonamento</p>
                        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${sStyle}`} data-testid={`manage-sub-${u.id}`}>{sLabel}</span>
                    </div>

                    {/* Ruolo */}
                    <div className="rounded-2xl border border-white/10 bg-navy/50 p-4">
                        <p className="text-sm font-semibold text-white flex items-center gap-2"><UserCog className="h-4 w-4 text-brand" /> Tipo account</p>
                        <div className="mt-3 space-y-1.5">
                            <Label className="text-slate-300 text-xs">Role</Label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} data-testid={`manage-role-${u.id}`} className={selectCls}>
                                <option value="privato">Privato</option>
                                <option value="azienda">Azienda</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button onClick={saveRole} disabled={busy === "role"} data-testid={`manage-save-role-${u.id}`}
                            className="mt-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold">
                            {busy === "role" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Salva ruolo
                        </Button>
                    </div>

                    {/* Sospensione */}
                    <div className="rounded-2xl border border-white/10 bg-navy/50 p-4">
                        <p className="text-sm font-semibold text-white flex items-center gap-2"><Ban className="h-4 w-4 text-red-400" /> Stato account</p>
                        <p className="mt-1 text-xs text-slate-400">{u.suspended ? "Account attualmente SOSPESO." : "Account attivo."}</p>
                        <Button onClick={toggleSuspend} disabled={busy === "suspend" || u.role === "admin"} data-testid={`manage-suspend-${u.id}`}
                            variant="outline"
                            className={`mt-3 rounded-xl font-semibold ${u.suspended ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" : "border-red-500/40 text-red-400 hover:bg-red-500/10"}`}>
                            {busy === "suspend" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                            {u.suspended ? "Riattiva account" : "Sospendi / Blocca account"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardAdmin() {
    const { user } = useAuth();
    const [aziende, setAziende] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState(null);
    const [annunci, setAnnunci] = useState(null);
    const [q, setQ] = useState("");
    const [searching, setSearching] = useState(false);

    const loadBase = useCallback(async () => {
        try {
            const [a, m] = await Promise.all([api.get("/admin/aziende"), api.get("/admin/metrics")]);
            setAziende(a.data);
            setMetrics(m.data);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    const loadAnnunci = useCallback(async () => {
        try {
            const { data } = await api.get("/annunci?limit=200");
            setAnnunci(data);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    const loadUsers = useCallback(async (query = "") => {
        setSearching(true);
        try {
            const { data } = await api.get(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
            setUsers(data);
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => { loadBase(); loadUsers(); loadAnnunci(); }, [loadBase, loadUsers, loadAnnunci]);

    const verifica = async (id, azione) => {
        try {
            await api.post(`/admin/aziende/${id}/verifica`, { azione });
            toast.success(azione === "verificata" ? "Azienda verificata e notificata." : "Verifica rifiutata e notificata.");
            loadBase();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const c = metrics?.counts || {};
    const METRIC_CARDS = [
        { label: "MRR (abbonamenti)", value: metrics ? `€${metrics.mrr_eur.toLocaleString("it-IT")}` : "—", sub: metrics ? `${metrics.active_subscriptions} abbonamenti attivi` : "", icon: TrendingUp },
        { label: "Prove PRO in corso", value: metrics ? metrics.trial_subscriptions : "—", sub: "Aziende nei 14 giorni di prova", icon: Sparkles },
        { label: "Utenti totali", value: c.totale ?? "—", sub: `${c.privati ?? 0} privati · ${c.aziende_totali ?? 0} aziende`, icon: Users },
    ];
    const COUNT_CARDS = [
        { label: "Privati", value: c.privati, icon: Users },
        { label: "Aziende PRO", value: c.aziende_pro, icon: Crown },
        { label: "Aziende Base", value: c.aziende_free, icon: Building2 },
    ];

    return (
        <div className="min-h-screen bg-navy grid-pattern px-4 pt-32 pb-24" data-testid="dashboard-admin">
            <div className="max-w-6xl mx-auto">
                <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Pannello Proprietario</p>
                <h1 className="mt-1 font-display font-black text-3xl text-white tracking-tight">Admin · {user?.name}</h1>

                {/* Metriche globali */}
                <h2 className="mt-8 font-display font-bold text-lg text-white">Metriche di business</h2>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="admin-metrics">
                    {METRIC_CARDS.map((s) => (
                        <div key={s.label} className="rounded-2xl border-2 border-brand/40 bg-gradient-to-b from-brand/10 to-navy-700/60 p-5">
                            <s.icon className="h-5 w-5 text-brand" />
                            <p className="mt-2 font-display font-black text-3xl text-white">{s.value}</p>
                            <p className="text-sm text-slate-300">{s.label}</p>
                            {s.sub && <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>}
                        </div>
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                    {COUNT_CARDS.map((s) => (
                        <div key={s.label} className="rounded-2xl border border-white/10 bg-navy-700/60 p-4">
                            <s.icon className="h-4 w-4 text-brand" />
                            <p className="mt-2 font-display font-black text-2xl text-white">{s.value ?? "—"}</p>
                            <p className="text-xs text-slate-400">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Gestione utenti */}
                <h2 className="mt-12 font-display font-bold text-xl text-white flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-brand" /> Gestione utenti
                </h2>
                <form
                    onSubmit={(e) => { e.preventDefault(); loadUsers(q); }}
                    className="mt-4 flex gap-2 max-w-md" data-testid="admin-user-search-form">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per email o nome…"
                            data-testid="admin-user-search-input" className={`${inputCls} pl-9`} />
                    </div>
                    <Button type="submit" disabled={searching} data-testid="admin-user-search-button"
                        className="rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold shrink-0">
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cerca"}
                    </Button>
                </form>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10" data-testid="admin-users-table">
                    <table className="w-full text-sm">
                        <thead className="bg-navy-700/80 text-slate-400">
                            <tr>
                                <th className="text-left font-medium px-5 py-3">Utente</th>
                                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Ruolo</th>
                                <th className="text-left font-medium px-5 py-3">Abbonamento</th>
                                <th className="text-left font-medium px-5 py-3">Stato</th>
                                <th className="text-right font-medium px-5 py-3">Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users && users.map((u) => (
                                <tr key={u.id} className="border-t border-white/5 bg-navy-700/30 hover:bg-navy-700/60 transition-colors" data-testid={`admin-user-row-${u.id}`}>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-white">{u.name}</p>
                                        <p className="text-xs text-slate-500">{u.email}</p>
                                        {u.azienda_nome && <p className="text-xs text-brand">{u.azienda_nome}</p>}
                                    </td>
                                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">
                                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs">{u.role}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {(() => { const [st, lb] = subInfo(u); return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st}`} data-testid={`user-sub-${u.id}`}>{lb}</span>; })()}
                                    </td>
                                    <td className="px-5 py-4">
                                        {u.suspended
                                            ? <span className="rounded-full bg-red-500/15 text-red-400 px-2.5 py-1 text-xs font-semibold" data-testid={`user-suspended-${u.id}`}>Sospeso</span>
                                            : <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-1 text-xs font-semibold">Attivo</span>}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <UserManageDialog u={u} onDone={() => loadUsers(q)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users && users.length === 0 && <p className="p-6 text-slate-400 text-sm">Nessun utente trovato.</p>}
                </div>

                {/* Verifiche aziende */}
                <div className="mt-12 flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-brand" /> Verifiche aziende
                    </h2>
                    <CreaAziendaDialog onCreated={loadBase} />
                </div>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10" data-testid="admin-verification-table">
                    <table className="w-full text-sm">
                        <thead className="bg-navy-700/80 text-slate-400">
                            <tr>
                                <th className="text-left font-medium px-5 py-3">Azienda</th>
                                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Email proprietario</th>
                                <th className="text-left font-medium px-5 py-3">P.IVA / DURC</th>
                                <th className="text-left font-medium px-5 py-3">Stato</th>
                                <th className="text-right font-medium px-5 py-3">Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aziende && aziende.map((a) => (
                                <tr key={a.id} className="border-t border-white/5 bg-navy-700/30 hover:bg-navy-700/60 transition-colors" data-testid={`admin-row-${a.id}`}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <AziendaAvatar nome={a.nome} logo={a.logo} foto={a.foto} size="h-9 w-9 text-xs" />
                                            <div>
                                                <p className="font-semibold text-white">{a.nome}</p>
                                                <p className="text-xs text-slate-500">{a.plan === "pro" ? "Piano PRO" : "Piano Base"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{a.owner_email}</td>
                                    <td className="px-5 py-4 text-slate-400">
                                        <p>{a.piva || "—"}</p>
                                        <p className="text-xs text-slate-500">{a.durc_number || ""}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[a.verification_status]}`}>
                                            {STATUS_LABELS[a.verification_status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" data-testid={`verify-button-${a.id}`} disabled={a.verification_status === "verificata"}
                                                onClick={() => verifica(a.id, "verificata")}
                                                className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white">
                                                <Check className="h-3.5 w-3.5 mr-1" /> Verifica
                                            </Button>
                                            <Button size="sm" variant="outline" data-testid={`reject-button-${a.id}`} disabled={a.verification_status === "rifiutata"}
                                                onClick={() => verifica(a.id, "rifiutata")}
                                                className="rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                                <X className="h-3.5 w-3.5 mr-1" /> Rifiuta
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {aziende && aziende.length === 0 && <p className="p-6 text-slate-400 text-sm">Nessuna azienda registrata.</p>}
                </div>

                {/* Marketplace — Macchinari */}
                <div className="mt-12 flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                        <Truck className="h-5 w-5 text-brand" /> Marketplace · Macchinari
                    </h2>
                    <CreaAnnuncioDialog aziende={aziende} onCreated={loadAnnunci} />
                </div>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10" data-testid="admin-annunci-table">
                    <table className="w-full text-sm">
                        <thead className="bg-navy-700/80 text-slate-400">
                            <tr>
                                <th className="text-left font-medium px-5 py-3">Titolo</th>
                                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Tipo</th>
                                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Categoria</th>
                                <th className="text-left font-medium px-5 py-3">Prezzo</th>
                                <th className="text-left font-medium px-5 py-3">Zona</th>
                                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Azienda</th>
                            </tr>
                        </thead>
                        <tbody>
                            {annunci && annunci.map((a) => (
                                <tr key={a.id} className="border-t border-white/5 bg-navy-700/30 hover:bg-navy-700/60 transition-colors" data-testid={`admin-annuncio-row-${a.id}`}>
                                    <td className="px-5 py-4 font-semibold text-white">{a.titolo}</td>
                                    <td className="px-5 py-4 hidden md:table-cell">
                                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-300 capitalize">{a.tipo}</span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{a.categoria}</td>
                                    <td className="px-5 py-4 text-brand font-semibold whitespace-nowrap">€{a.prezzo}{a.unita && a.unita !== "fisso" ? `/${a.unita}` : ""}</td>
                                    <td className="px-5 py-4 text-slate-400">{a.zona}</td>
                                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{a.azienda_nome || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {annunci && annunci.length === 0 && <p className="p-6 text-slate-400 text-sm">Nessun macchinario pubblicato. Aggiungine uno con il pulsante qui sopra.</p>}
                </div>
            </div>
        </div>
    );
}
