import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    ShieldCheck, Check, X, Users, Building2, Crown,
    Search, Ban, TrendingUp, UserCog, Loader2, Sparkles, Truck, Pencil, Trash2,
    RefreshCw, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
    Clock, LayoutDashboard, Layers, XCircle, Info, ArrowRight
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
    none: "bg-white/5 text-slate-400 border border-white/10",
    in_attesa: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    verificata: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    rifiutata: "bg-red-500/15 text-red-400 border border-red-500/30",
};
const STATUS_LABELS = { none: "Non richiesta", in_attesa: "In attesa", verificata: "Verificata", rifiutata: "Rifiutata" };

const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";
const selectCls = "rounded-xl bg-navy/70 border border-white/10 text-white px-3 py-2 text-xs sm:text-sm outline-none focus:border-brand";

const SUB_LABELS = {
    active: ["bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", "PRO attivo"],
    trialing: ["bg-brand/15 text-brand border border-brand/20", "In prova"],
    active_trial: ["bg-brand/15 text-brand border border-brand/20", "In prova"],
    trial_expired: ["bg-amber-500/15 text-amber-400 border border-amber-500/20", "Prova scaduta"],
    none: ["bg-white/5 text-slate-400 border border-white/10", "Base / Gratis"],
};

function subInfo(u) {
    if (u.role !== "azienda") return ["bg-white/5 text-slate-400 border border-white/10", u.role === "admin" ? "Admin" : "Privato"];
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
                    className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold text-xs h-8 px-3">
                    <UserCog className="h-3.5 w-3.5 mr-1" /> Gestisci
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
                            <Label className="text-slate-300 text-xs">Ruolo</Label>
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

const ITEMS_PER_PAGE = 15;

export default function DashboardAdmin() {
    const { user } = useAuth();
    const [currentTab, setCurrentTab] = useState("panoramica"); // "panoramica" | "utenti" | "verifiche" | "marketplace"
    const [aziende, setAziende] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState(null);
    const [annunci, setAnnunci] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Filtri e paginazione Utenti
    const [userQuery, setUserQuery] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState("tutti");
    const [userPlanFilter, setUserPlanFilter] = useState("tutti");
    const [userStatusFilter, setUserStatusFilter] = useState("tutti");
    const [userPage, setUserPage] = useState(1);
    const [searchingUsers, setSearchingUsers] = useState(false);

    // Filtri Verifiche Aziende
    const [verificaTab, setVerificaTab] = useState("in_attesa"); // "in_attesa" | "verificata" | "rifiutata" | "tutti"
    const [aziendaQuery, setAziendaQuery] = useState("");

    // Filtri Marketplace
    const [annunciQuery, setAnnunciQuery] = useState("");
    const [annunciTipoFilter, setAnnunciTipoFilter] = useState("tutti");
    const [annunciCategoriaFilter, setAnnunciCategoriaFilter] = useState("tutti");
    const [annunciZonaFilter, setAnnunciZonaFilter] = useState("");
    const [annunciPage, setAnnunciPage] = useState(1);

    const loadBase = useCallback(async () => {
        try {
            const [a, m] = await Promise.all([api.get("/admin/aziende"), api.get("/admin/metrics")]);
            setAziende(a.data);
            setMetrics(m.data);
            setLastSync(new Date());
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

    const delAzienda = async (id) => {
        try {
            await api.delete(`/admin/aziende/${id}`);
            toast.success("Azienda eliminata.");
            loadBase();
            loadAnnunci();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const delAnnuncio = async (id) => {
        try {
            await api.delete(`/admin/annunci/${id}`);
            toast.success("Macchinario eliminato.");
            loadAnnunci();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const loadUsers = useCallback(async (query = "") => {
        setSearchingUsers(true);
        try {
            const { data } = await api.get(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
            setUsers(data);
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setSearchingUsers(false);
        }
    }, []);

    const refreshAll = async () => {
        setRefreshing(true);
        try {
            await Promise.all([loadBase(), loadUsers(userQuery), loadAnnunci()]);
            toast.success("Dati aggiornati con successo.");
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBase();
        loadUsers();
        loadAnnunci();
    }, [loadBase, loadUsers, loadAnnunci]);

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

    // Calcolo contatori precisi
    const adminAccountsCount = useMemo(() => {
        if (!users) return 0;
        return users.filter((u) => u.role === "admin").length;
    }, [users]);

    const aziendeInAttesaCount = useMemo(() => {
        if (!aziende) return 0;
        return aziende.filter((a) => a.verification_status === "in_attesa").length;
    }, [aziende]);

    const aziendeVerificateCount = useMemo(() => {
        if (!aziende) return 0;
        return aziende.filter((a) => a.verification_status === "verificata").length;
    }, [aziende]);

    const aziendeRifiutateCount = useMemo(() => {
        if (!aziende) return 0;
        return aziende.filter((a) => a.verification_status === "rifiutata").length;
    }, [aziende]);

    // Filtro utenti in tabella
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter((u) => {
            // Ricerca testuale locale per sicurezza
            const q = userQuery.toLowerCase().trim();
            const matchesQuery = !q ||
                (u.name && u.name.toLowerCase().includes(q)) ||
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.azienda_nome && u.azienda_nome.toLowerCase().includes(q));

            // Ruolo
            const matchesRole = userRoleFilter === "tutti" || u.role === userRoleFilter;

            // Piano
            let matchesPlan = true;
            if (userPlanFilter === "pro") {
                matchesPlan = u.subscription_status === "active";
            } else if (userPlanFilter === "trial") {
                matchesPlan = u.subscription_status === "trialing" || u.subscription_status === "active_trial";
            } else if (userPlanFilter === "trial_expired") {
                matchesPlan = u.subscription_status === "trial_expired";
            } else if (userPlanFilter === "base") {
                matchesPlan = !u.subscription_status || u.subscription_status === "none";
            }

            // Stato sospensione
            let matchesStatus = true;
            if (userStatusFilter === "attivo") matchesStatus = !u.suspended;
            else if (userStatusFilter === "sospeso") matchesStatus = !!u.suspended;

            return matchesQuery && matchesRole && matchesPlan && matchesStatus;
        });
    }, [users, userQuery, userRoleFilter, userPlanFilter, userStatusFilter]);

    // Paginazione Utenti
    const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
    const paginatedUsers = useMemo(() => {
        const start = (userPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, userPage]);

    // Filtro Aziende / Verifiche (con le in attesa in cima di default)
    const filteredAziende = useMemo(() => {
        if (!aziende) return [];
        let list = [...aziende];

        if (verificaTab !== "tutti") {
            list = list.filter((a) => a.verification_status === verificaTab);
        }

        if (aziendaQuery.trim()) {
            const q = aziendaQuery.toLowerCase().trim();
            list = list.filter((a) =>
                (a.nome && a.nome.toLowerCase().includes(q)) ||
                (a.owner_email && a.owner_email.toLowerCase().includes(q)) ||
                (a.piva && a.piva.toLowerCase().includes(q))
            );
        }

        // Ordinamento: sempre le "in_attesa" per prime
        return list.sort((a, b) => {
            if (a.verification_status === "in_attesa" && b.verification_status !== "in_attesa") return -1;
            if (b.verification_status === "in_attesa" && a.verification_status !== "in_attesa") return 1;
            return (a.nome || "").localeCompare(b.nome || "");
        });
    }, [aziende, verificaTab, aziendaQuery]);

    // Categorie uniche annunci per filtro
    const annunciCategories = useMemo(() => {
        if (!annunci) return [];
        const set = new Set();
        annunci.forEach((a) => {
            if (a.categoria) set.add(a.categoria);
        });
        return Array.from(set).sort();
    }, [annunci]);

    // Filtro Annunci Marketplace
    const filteredAnnunci = useMemo(() => {
        if (!annunci) return [];
        return annunci.filter((a) => {
            const q = annunciQuery.toLowerCase().trim();
            const matchesQuery = !q ||
                (a.titolo && a.titolo.toLowerCase().includes(q)) ||
                (a.azienda_nome && a.azienda_nome.toLowerCase().includes(q)) ||
                (a.descrizione && a.descrizione.toLowerCase().includes(q));

            const matchesTipo = annunciTipoFilter === "tutti" || a.tipo === annunciTipoFilter;
            const matchesCategoria = annunciCategoriaFilter === "tutti" || a.categoria === annunciCategoriaFilter;
            const matchesZona = !annunciZonaFilter || (a.zona && a.zona.toLowerCase().includes(annunciZonaFilter.toLowerCase().trim()));

            return matchesQuery && matchesTipo && matchesCategoria && matchesZona;
        });
    }, [annunci, annunciQuery, annunciTipoFilter, annunciCategoriaFilter, annunciZonaFilter]);

    // Paginazione Annunci
    const totalAnnunciPages = Math.max(1, Math.ceil(filteredAnnunci.length / ITEMS_PER_PAGE));
    const paginatedAnnunci = useMemo(() => {
        const start = (annunciPage - 1) * ITEMS_PER_PAGE;
        return filteredAnnunci.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAnnunci, annunciPage]);

    return (
        <div className="min-h-screen bg-navy grid-pattern px-4 pt-28 sm:pt-32 pb-24" data-testid="dashboard-admin">
            <div className="max-w-6xl mx-auto">
                {/* Header amministrativo con indicatore di stato */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">
                                Pannello di Controllo
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand/15 text-brand border border-brand/30">
                                Amministrazione
                            </span>
                        </div>
                        <h1 className="mt-1 font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                            Admin · {user?.name || "Operatore"}
                        </h1>
                        <p className="mt-1 text-xs text-slate-400">
                            Gestione centralizzata di metriche, utenti, verifiche documentali e marketplace.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastSync && (
                            <span className="text-xs text-slate-400 hidden md:inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                Ultima sincronizzazione: {lastSync.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                        )}
                        <Button
                            onClick={refreshAll}
                            disabled={refreshing}
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-white/15 bg-navy-700/60 hover:bg-white/10 text-slate-200 text-xs h-9 px-3"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-brand" : "text-slate-400"}`} />
                            {refreshing ? "Aggiornamento..." : "Aggiorna dati"}
                        </Button>
                    </div>
                </div>

                {/* Navigazione Amministrativa a Schede (Tabs) */}
                <nav aria-label="Sezioni amministrative" className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
                    <button
                        type="button"
                        onClick={() => setCurrentTab("panoramica")}
                        data-testid="admin-nav-panoramica"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                            currentTab === "panoramica"
                                ? "bg-brand text-white shadow-lg shadow-brand/20 font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Panoramica
                    </button>

                    <button
                        type="button"
                        onClick={() => setCurrentTab("utenti")}
                        data-testid="admin-nav-utenti"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                            currentTab === "utenti"
                                ? "bg-brand text-white shadow-lg shadow-brand/20 font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <UserCog className="h-4 w-4" />
                        Utenti
                        {users && (
                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                                currentTab === "utenti" ? "bg-white/20 text-white" : "bg-white/10 text-slate-300"
                            }`}>
                                {users.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setCurrentTab("verifiche")}
                        data-testid="admin-nav-verifiche"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                            currentTab === "verifiche"
                                ? "bg-brand text-white shadow-lg shadow-brand/20 font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Verifiche aziende
                        {aziendeInAttesaCount > 0 ? (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-amber-500 text-navy font-bold animate-pulse">
                                {aziendeInAttesaCount} in attesa
                            </span>
                        ) : aziende ? (
                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                                currentTab === "verifiche" ? "bg-white/20 text-white" : "bg-white/10 text-slate-300"
                            }`}>
                                {aziende.length}
                            </span>
                        ) : null}
                    </button>

                    <button
                        type="button"
                        onClick={() => setCurrentTab("marketplace")}
                        data-testid="admin-nav-marketplace"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                            currentTab === "marketplace"
                                ? "bg-brand text-white shadow-lg shadow-brand/20 font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Truck className="h-4 w-4" />
                        Marketplace
                        {annunci && (
                            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                                currentTab === "marketplace" ? "bg-white/20 text-white" : "bg-white/10 text-slate-300"
                            }`}>
                                {annunci.length}
                            </span>
                        )}
                    </button>
                </nav>

                {/* ============================================================ */}
                {/* 1. SEZIONE PANORAMICA                                        */}
                {/* ============================================================ */}
                {currentTab === "panoramica" && (
                    <div className="mt-8 space-y-8 animate-in fade-in-50 duration-200">
                        {/* Metriche primarie di business */}
                        <div>
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-brand" />
                                    Indicatori di business & abbonamenti
                                </h2>
                                <span className="text-xs text-slate-400">
                                    Calcolo aggiornato in tempo reale
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="admin-metrics">
                                {/* Card MRR */}
                                <div className="rounded-2xl border-2 border-brand/40 bg-gradient-to-b from-brand/10 to-navy-700/60 p-5">
                                    <div className="flex items-center justify-between">
                                        <TrendingUp className="h-5 w-5 text-brand" />
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mensile</span>
                                    </div>
                                    <p className="mt-3 font-display font-black text-3xl sm:text-4xl text-white">
                                        {metrics ? `€${metrics.mrr_eur.toLocaleString("it-IT")}` : "—"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-200">MRR (Ricavo Ricorrente Mensile)</p>
                                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                        Conteggia {metrics?.active_subscriptions ?? 0} abbonamenti PRO attivi a tariffa ordinaria (€3,99/mese).
                                    </p>
                                </div>

                                {/* Card Prove PRO */}
                                <div className="rounded-2xl border-2 border-brand/40 bg-gradient-to-b from-brand/10 to-navy-700/60 p-5">
                                    <div className="flex items-center justify-between">
                                        <Sparkles className="h-5 w-5 text-amber-400" />
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">14 Giorni</span>
                                    </div>
                                    <p className="mt-3 font-display font-black text-3xl sm:text-4xl text-white">
                                        {metrics?.trial_subscriptions ?? "—"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-200">Aziende in prova gratuita</p>
                                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                        Aziende attualmente nel periodo di prova gratuito di 14 giorni (senza addebito immediato).
                                    </p>
                                </div>

                                {/* Card Utenti Privati */}
                                <div className="rounded-2xl border-2 border-brand/40 bg-gradient-to-b from-brand/10 to-navy-700/60 p-5 sm:col-span-2 lg:col-span-1">
                                    <div className="flex items-center justify-between">
                                        <Users className="h-5 w-5 text-brand" />
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Clienti</span>
                                    </div>
                                    <p className="mt-3 font-display font-black text-3xl sm:text-4xl text-white">
                                        {c.privati ?? "—"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-200">Utenti privati registrati</p>
                                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                        Privati registrati per richiedere preventivi gratuiti o consultare il marketplace.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Metriche secondarie / Conteggio segmentato */}
                        <div>
                            <h3 className="font-display font-semibold text-sm text-slate-300 uppercase tracking-wider mb-3">
                                Distribuzione account & censimento
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <Building2 className="h-4 w-4 text-brand" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Account</span>
                                    </div>
                                    <p className="mt-2 font-display font-black text-2xl text-white">{c.aziende_totali ?? "—"}</p>
                                    <p className="text-xs font-semibold text-slate-300">Account aziende registrati</p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        {c.aziende_pro ?? 0} PRO · {c.aziende_trial ?? 0} in prova · {c.aziende_free ?? 0} base
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Directory</span>
                                    </div>
                                    <p className="mt-2 font-display font-black text-2xl text-white">{aziende ? aziende.length : "—"}</p>
                                    <p className="text-xs font-semibold text-slate-300">Schede aziendali in directory</p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        {aziendeVerificateCount} verificate · {aziendeInAttesaCount} in attesa
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <Truck className="h-4 w-4 text-amber-400" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Marketplace</span>
                                    </div>
                                    <p className="mt-2 font-display font-black text-2xl text-white">{annunci ? annunci.length : "—"}</p>
                                    <p className="text-xs font-semibold text-slate-300">Annunci macchinari</p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Attrezzature a noleggio e usato
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <Users className="h-4 w-4 text-purple-400" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Totale Sistema</span>
                                    </div>
                                    <p className="mt-2 font-display font-black text-2xl text-white">{c.totale ?? "—"}</p>
                                    <p className="text-xs font-semibold text-slate-300">Utenti totali nel database</p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Include {adminAccountsCount} account admin di sistema
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Avviso trasparenza e confronto metriche */}
                        <div className="rounded-2xl border border-white/10 bg-navy-800/40 p-5 text-xs text-slate-300 space-y-2">
                            <div className="flex items-center gap-2 font-semibold text-white">
                                <Info className="h-4 w-4 text-brand shrink-0" />
                                <span>Criteri di conteggio e distinzione tra account e schede:</span>
                            </div>
                            <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                <li>
                                    <strong>Totale utenti ({c.totale ?? 0}):</strong> comprende sia gli account clienti ({c.privati ?? 0} privati e {c.aziende_totali ?? 0} aziende), sia {adminAccountsCount} account amministratore abilitati alla gestione.
                                </li>
                                <li>
                                    <strong>Aziende censite ({aziende ? aziende.length : 0}) vs Account aziende ({c.aziende_totali ?? 0}):</strong> il primo dato conta le schede profilo presenti nella directory pubblica (anche create dall'amministrazione), mentre il secondo conta gli utenti fisicamente registrati con credenziali e ruolo 'azienda'.
                                </li>
                            </ul>
                        </div>

                        {/* Accesso rapido alle aree operative */}
                        <div className="pt-4 border-t border-white/10">
                            <h3 className="font-display font-semibold text-sm text-slate-300 uppercase tracking-wider mb-3">
                                Azioni e code di lavoro
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCurrentTab("verifiche")}
                                    className="p-4 rounded-xl border border-white/10 bg-navy-700/50 hover:border-brand/40 hover:bg-navy-700 text-left transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white text-sm">Coda Verifiche Aziende</span>
                                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition-colors" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {aziendeInAttesaCount > 0
                                            ? `${aziendeInAttesaCount} aziende attendono la revisione di DURC e P.IVA`
                                            : "Nessuna azienda in attesa di verifica"}
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentTab("utenti")}
                                    className="p-4 rounded-xl border border-white/10 bg-navy-700/50 hover:border-brand/40 hover:bg-navy-700 text-left transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white text-sm">Gestione Utenti</span>
                                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition-colors" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Cerca per email o nome, modifica ruoli o gestisci sospensioni
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentTab("marketplace")}
                                    className="p-4 rounded-xl border border-white/10 bg-navy-700/50 hover:border-brand/40 hover:bg-navy-700 text-left transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white text-sm">Catalogo Marketplace</span>
                                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition-colors" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {annunci ? `${annunci.length} annunci macchinari a noleggio o in vendita` : "Caricamento annunci..."}
                                    </p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* 2. SEZIONE UTENTI                                            */}
                {/* ============================================================ */}
                {currentTab === "utenti" && (
                    <div className="mt-8 space-y-6 animate-in fade-in-50 duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                                    <UserCog className="h-5 w-5 text-brand" /> Gestione utenti
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Elenco completo degli account registrati con strumenti di ricerca, filtraggio e gestione ruoli.
                                </p>
                            </div>

                            <span className="text-xs text-slate-400">
                                Mostrati <strong>{filteredUsers.length}</strong> di <strong>{users ? users.length : 0}</strong> utenti
                            </span>
                        </div>

                        {/* Barra di ricerca e filtri multipli */}
                        <div className="rounded-2xl border border-white/10 bg-navy-700/50 p-4 space-y-3">
                            <form
                                onSubmit={(e) => { e.preventDefault(); loadUsers(userQuery); setUserPage(1); }}
                                className="flex flex-col sm:flex-row gap-2"
                                data-testid="admin-user-search-form"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        value={userQuery}
                                        onChange={(e) => { setUserQuery(e.target.value); setUserPage(1); }}
                                        placeholder="Cerca per nome, email o azienda associata..."
                                        data-testid="admin-user-search-input"
                                        className={`${inputCls} pl-9 h-10`}
                                    />
                                    {userQuery && (
                                        <button
                                            type="button"
                                            onClick={() => { setUserQuery(""); loadUsers(""); setUserPage(1); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={searchingUsers}
                                    data-testid="admin-user-search-button"
                                    className="rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold shrink-0 h-10 px-5"
                                >
                                    {searchingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cerca"}
                                </Button>
                            </form>

                            {/* Filtri rapidi per Ruolo, Piano e Stato */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">Ruolo:</span>
                                    <select
                                        value={userRoleFilter}
                                        onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                                        className={selectCls}
                                    >
                                        <option value="tutti">Tutti i ruoli</option>
                                        <option value="privato">Privati</option>
                                        <option value="azienda">Aziende</option>
                                        <option value="admin">Amministratori</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">Piano:</span>
                                    <select
                                        value={userPlanFilter}
                                        onChange={(e) => { setUserPlanFilter(e.target.value); setUserPage(1); }}
                                        className={selectCls}
                                    >
                                        <option value="tutti">Tutti i piani</option>
                                        <option value="pro">PRO attivo</option>
                                        <option value="trial">In prova (14 gg)</option>
                                        <option value="trial_expired">Prova scaduta</option>
                                        <option value="base">Base / Gratis</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">Stato:</span>
                                    <select
                                        value={userStatusFilter}
                                        onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                                        className={selectCls}
                                    >
                                        <option value="tutti">Tutti gli stati</option>
                                        <option value="attivo">Solo Attivi</option>
                                        <option value="sospeso">Solo Sospesi</option>
                                    </select>
                                </div>

                                {(userRoleFilter !== "tutti" || userPlanFilter !== "tutti" || userStatusFilter !== "tutti" || userQuery) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserQuery("");
                                            setUserRoleFilter("tutti");
                                            setUserPlanFilter("tutti");
                                            setUserStatusFilter("tutti");
                                            setUserPage(1);
                                            loadUsers("");
                                        }}
                                        className="text-xs text-brand hover:underline font-semibold ml-auto"
                                    >
                                        Azzera filtri
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabella Utenti */}
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-700/20" data-testid="admin-users-table">
                            <table className="w-full text-sm">
                                <thead className="bg-navy-700/80 text-slate-400 text-xs">
                                    <tr>
                                        <th className="text-left font-medium px-5 py-3">Utente</th>
                                        <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Ruolo</th>
                                        <th className="text-left font-medium px-5 py-3">Abbonamento</th>
                                        <th className="text-left font-medium px-5 py-3">Stato</th>
                                        <th className="text-right font-medium px-5 py-3">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUsers.map((u) => {
                                        const isDemo = u.is_demo || /demo|test/i.test(u.email || "") || /demo|test/i.test(u.name || "");
                                        return (
                                            <tr key={u.id} className="border-t border-white/5 bg-navy-700/30 hover:bg-navy-700/60 transition-colors" data-testid={`admin-user-row-${u.id}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-white">{u.name}</p>
                                                        {isDemo && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                                Demo/Test
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{u.email}</p>
                                                    {u.azienda_nome && (
                                                        <p className="text-xs text-brand mt-0.5 flex items-center gap-1">
                                                            <Building2 className="h-3 w-3" />
                                                            {u.azienda_nome}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-slate-400 hidden md:table-cell">
                                                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                        u.role === "admin"
                                                            ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                                            : u.role === "azienda"
                                                            ? "bg-brand/15 text-brand border-brand/30"
                                                            : "bg-white/5 text-slate-300 border-white/10"
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {(() => {
                                                        const [st, lb] = subInfo(u);
                                                        return (
                                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st}`} data-testid={`user-sub-${u.id}`}>
                                                                {lb}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {u.suspended ? (
                                                        <span className="rounded-full bg-red-500/15 text-red-400 border border-red-500/30 px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1" data-testid={`user-suspended-${u.id}`}>
                                                            <Ban className="h-3 w-3" /> Sospeso
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Attivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <UserManageDialog u={u} onDone={() => loadUsers(userQuery)} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {filteredUsers.length === 0 && (
                                <div className="p-8 text-center">
                                    <Users className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                    <p className="text-slate-300 font-medium text-sm">Nessun utente trovato</p>
                                    <p className="text-slate-500 text-xs mt-1">Prova a modificare i termini di ricerca o a reimpostare i filtri.</p>
                                </div>
                            )}
                        </div>

                        {/* Paginazione progressiva utenti */}
                        {totalUserPages > 1 && (
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                                <span>
                                    Pagina {userPage} di {totalUserPages} ({filteredUsers.length} utenti filtrati)
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                                        disabled={userPage <= 1}
                                        className="h-8 px-2.5 rounded-lg border-white/10 hover:bg-white/10 text-slate-300"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Precedente
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                                        disabled={userPage >= totalUserPages}
                                        className="h-8 px-2.5 rounded-lg border-white/10 hover:bg-white/10 text-slate-300"
                                    >
                                        Successiva <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================================ */}
                {/* 3. SEZIONE VERIFICHE AZIENDE                                 */}
                {/* ============================================================ */}
                {currentTab === "verifiche" && (
                    <div className="mt-8 space-y-6 animate-in fade-in-50 duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-brand" /> Coda Verifiche & Directory Aziende
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Revisione della documentazione aziendale (DURC, Partita IVA) con priorità per le richieste in attesa.
                                </p>
                            </div>

                            <CreaAziendaDialog onCreated={loadBase} />
                        </div>

                        {/* Schede di stato con contatori */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button
                                type="button"
                                onClick={() => setVerificaTab("in_attesa")}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    verificaTab === "in_attesa"
                                        ? "border-amber-500/50 bg-amber-500/10 text-white shadow-lg"
                                        : "border-white/10 bg-navy-700/40 text-slate-400 hover:bg-navy-700/70"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">In attesa</span>
                                    <Clock className="h-4 w-4 text-amber-400" />
                                </div>
                                <p className="mt-2 font-display font-black text-2xl text-amber-400">
                                    {aziendeInAttesaCount}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Da verificare</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setVerificaTab("verificata")}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    verificaTab === "verificata"
                                        ? "border-emerald-500/50 bg-emerald-500/10 text-white shadow-lg"
                                        : "border-white/10 bg-navy-700/40 text-slate-400 hover:bg-navy-700/70"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Verificate</span>
                                    <Check className="h-4 w-4 text-emerald-400" />
                                </div>
                                <p className="mt-2 font-display font-black text-2xl text-emerald-400">
                                    {aziendeVerificateCount}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Convalidate con badge</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setVerificaTab("rifiutata")}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    verificaTab === "rifiutata"
                                        ? "border-red-500/50 bg-red-500/10 text-white shadow-lg"
                                        : "border-white/10 bg-navy-700/40 text-slate-400 hover:bg-navy-700/70"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Rifiutate</span>
                                    <X className="h-4 w-4 text-red-400" />
                                </div>
                                <p className="mt-2 font-display font-black text-2xl text-red-400">
                                    {aziendeRifiutateCount}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Documenti non conformi</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setVerificaTab("tutti")}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    verificaTab === "tutti"
                                        ? "border-brand/50 bg-brand/10 text-white shadow-lg"
                                        : "border-white/10 bg-navy-700/40 text-slate-400 hover:bg-navy-700/70"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Tutte le aziende</span>
                                    <Building2 className="h-4 w-4 text-brand" />
                                </div>
                                <p className="mt-2 font-display font-black text-2xl text-white">
                                    {aziende ? aziende.length : 0}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Totale censite</p>
                            </button>
                        </div>

                        {/* Barra di ricerca per nome o P.IVA */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    value={aziendaQuery}
                                    onChange={(e) => setAziendaQuery(e.target.value)}
                                    placeholder="Cerca per nome azienda, email o P.IVA..."
                                    className={`${inputCls} pl-9 h-10`}
                                />
                                {aziendaQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setAziendaQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messaggio esplicito quando la coda è vuota */}
                        {verificaTab === "in_attesa" && aziendeInAttesaCount === 0 && (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                                <p className="mt-3 font-display font-bold text-white text-base">
                                    Nessuna azienda in attesa di verifica
                                </p>
                                <p className="mt-1 text-xs text-slate-300 max-w-md mx-auto">
                                    Tutte le richieste di verifica documentale arrivate finora sono state esaminate e completate.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setVerificaTab("tutti")}
                                    className="mt-4 rounded-xl border-white/20 text-slate-200 text-xs"
                                >
                                    Visualizza l'archivio completo di tutte le aziende
                                </Button>
                            </div>
                        )}

                        {/* Tabella Verifiche */}
                        {(verificaTab !== "in_attesa" || aziendeInAttesaCount > 0) && (
                            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-700/20" data-testid="admin-verification-table">
                                <table className="w-full text-sm">
                                    <thead className="bg-navy-700/80 text-slate-400 text-xs">
                                        <tr>
                                            <th className="text-left font-medium px-5 py-3">Azienda</th>
                                            <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Email proprietario</th>
                                            <th className="text-left font-medium px-5 py-3">P.IVA / DURC</th>
                                            <th className="text-left font-medium px-5 py-3">Stato</th>
                                            <th className="text-right font-medium px-5 py-3">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAziende.map((a) => (
                                            <tr key={a.id} className="border-t border-white/5 bg-navy-700/30 hover:bg-navy-700/60 transition-colors" data-testid={`admin-row-${a.id}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <AziendaAvatar nome={a.nome} logo={a.logo} foto={a.foto} size="h-9 w-9 text-xs" />
                                                        <div>
                                                            <p className="font-semibold text-white">{a.nome}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {a.plan === "pro" ? "Piano PRO" : "Piano Base"}
                                                                {a.zone && a.zone.length > 0 && ` · ${a.zone.slice(0, 2).join(", ")}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-slate-400 hidden md:table-cell text-xs">{a.owner_email || "—"}</td>
                                                <td className="px-5 py-4 text-slate-300 text-xs">
                                                    <p className="font-mono">{a.piva || "—"}</p>
                                                    {a.durc_number && (
                                                        <p className="text-[11px] text-slate-500">DURC: {a.durc_number}</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[a.verification_status] || STATUS_STYLES.none}`}>
                                                        {STATUS_LABELS[a.verification_status] || a.verification_status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex justify-end gap-1.5 flex-wrap">
                                                        <Button
                                                            size="sm"
                                                            data-testid={`verify-button-${a.id}`}
                                                            disabled={a.verification_status === "verificata"}
                                                            onClick={() => verifica(a.id, "verificata")}
                                                            className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                                                        >
                                                            <Check className="h-3.5 w-3.5 mr-1" /> Verifica
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            data-testid={`reject-button-${a.id}`}
                                                            disabled={a.verification_status === "rifiutata"}
                                                            onClick={() => verifica(a.id, "rifiutata")}
                                                            className="rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-8 px-3"
                                                        >
                                                            <X className="h-3.5 w-3.5 mr-1" /> Rifiuta
                                                        </Button>
                                                        <CreaAziendaDialog
                                                            record={a}
                                                            onCreated={loadBase}
                                                            trigger={
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    data-testid={`edit-azienda-${a.id}`}
                                                                    className="rounded-full border-white/20 text-slate-300 hover:bg-white/10 h-8 w-8 p-0"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                            }
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            data-testid={`delete-azienda-${a.id}`}
                                                            onClick={() => delAzienda(a.id)}
                                                            className="rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredAziende.length === 0 && (
                                    <p className="p-6 text-slate-400 text-sm text-center">Nessuna azienda corrisponde ai criteri selezionati.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================================ */}
                {/* 4. SEZIONE MARKETPLACE                                       */}
                {/* ============================================================ */}
                {currentTab === "marketplace" && (
                    <div className="mt-8 space-y-6 animate-in fade-in-50 duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-brand" /> Catalogo Marketplace · Noleggio e Usato
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Supervisione dei macchinari e delle attrezzature edili pubblicate da aziende e privati.
                                </p>
                            </div>

                            <CreaAnnuncioDialog aziende={aziende} onCreated={loadAnnunci} />
                        </div>

                        {/* Barra ricerca e filtri Marketplace */}
                        <div className="rounded-2xl border border-white/10 bg-navy-700/50 p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        value={annunciQuery}
                                        onChange={(e) => { setAnnunciQuery(e.target.value); setAnnunciPage(1); }}
                                        placeholder="Cerca per titolo macchinario, azienda o parola chiave..."
                                        className={`${inputCls} pl-9 h-10`}
                                    />
                                    {annunciQuery && (
                                        <button
                                            type="button"
                                            onClick={() => { setAnnunciQuery(""); setAnnunciPage(1); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">Tipo:</span>
                                    <select
                                        value={annunciTipoFilter}
                                        onChange={(e) => { setAnnunciTipoFilter(e.target.value); setAnnunciPage(1); }}
                                        className={selectCls}
                                    >
                                        <option value="tutti">Tutti i tipi</option>
                                        <option value="noleggio">Noleggio</option>
                                        <option value="usato">Usato / Vendita</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">Categoria:</span>
                                    <select
                                        value={annunciCategoriaFilter}
                                        onChange={(e) => { setAnnunciCategoriaFilter(e.target.value); setAnnunciPage(1); }}
                                        className={selectCls}
                                    >
                                        <option value="tutti">Tutte le categorie</option>
                                        {annunciCategories.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">Zona:</span>
                                    <Input
                                        value={annunciZonaFilter}
                                        onChange={(e) => { setAnnunciZonaFilter(e.target.value); setAnnunciPage(1); }}
                                        placeholder="Filtra per città/provincia..."
                                        className={`${inputCls} h-8 text-xs w-40`}
                                    />
                                </div>

                                {(annunciQuery || annunciTipoFilter !== "tutti" || annunciCategoriaFilter !== "tutti" || annunciZonaFilter) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAnnunciQuery("");
                                            setAnnunciTipoFilter("tutti");
                                            setAnnunciCategoriaFilter("tutti");
                                            setAnnunciZonaFilter("");
                                            setAnnunciPage(1);
                                        }}
                                        className="text-xs text-brand hover:underline font-semibold ml-auto"
                                    >
                                        Azzera filtri
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabella Annunci */}
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-700/20" data-testid="admin-annunci-table">
                            <table className="w-full text-sm">
                                <thead className="bg-navy-700/80 text-slate-400 text-xs">
                                    <tr>
                                        <th className="text-left font-medium px-5 py-3">Titolo</th>
                                        <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Tipo</th>
                                        <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Categoria</th>
                                        <th className="text-left font-medium px-5 py-3">Prezzo</th>
                                        <th className="text-left font-medium px-5 py-3">Zona</th>
                                        <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Azienda</th>
                                        <th className="text-right font-medium px-5 py-3">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedAnnunci.map((a) => (
                                        <tr key={a.id} className="border-t border-white/5 bg-navy-700/30 hover:bg-navy-700/60 transition-colors" data-testid={`admin-annuncio-row-${a.id}`}>
                                            <td className="px-5 py-4 font-semibold text-white">{a.titolo}</td>
                                            <td className="px-5 py-4 hidden md:table-cell">
                                                <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${
                                                    a.tipo === "noleggio"
                                                        ? "bg-brand/15 text-brand border-brand/30"
                                                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                }`}>
                                                    {a.tipo}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 hidden md:table-cell text-xs">{a.categoria}</td>
                                            <td className="px-5 py-4 text-brand font-semibold whitespace-nowrap">
                                                €{a.prezzo}{a.unita && a.unita !== "fisso" ? `/${a.unita}` : ""}
                                            </td>
                                            <td className="px-5 py-4 text-slate-300 text-xs">{a.zona}</td>
                                            <td className="px-5 py-4 text-slate-400 hidden md:table-cell text-xs">{a.azienda_nome || "—"}</td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <CreaAnnuncioDialog
                                                        aziende={aziende}
                                                        record={a}
                                                        onCreated={loadAnnunci}
                                                        trigger={
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                data-testid={`edit-annuncio-${a.id}`}
                                                                className="rounded-full border-white/20 text-slate-300 hover:bg-white/10 h-8 w-8 p-0"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        }
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        data-testid={`delete-annuncio-${a.id}`}
                                                        onClick={() => delAnnuncio(a.id)}
                                                        className="rounded-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredAnnunci.length === 0 && (
                                <p className="p-6 text-slate-400 text-sm text-center">
                                    Nessun macchinario trovato con i filtri applicati.
                                </p>
                            )}
                        </div>

                        {/* Paginazione Marketplace */}
                        {totalAnnunciPages > 1 && (
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                                <span>
                                    Pagina {annunciPage} di {totalAnnunciPages} ({filteredAnnunci.length} annunci filtrati)
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAnnunciPage((p) => Math.max(1, p - 1))}
                                        disabled={annunciPage <= 1}
                                        className="h-8 px-2.5 rounded-lg border-white/10 hover:bg-white/10 text-slate-300"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Precedente
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAnnunciPage((p) => Math.min(totalAnnunciPages, p + 1))}
                                        disabled={annunciPage >= totalAnnunciPages}
                                        className="h-8 px-2.5 rounded-lg border-white/10 hover:bg-white/10 text-slate-300"
                                    >
                                        Successiva <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
