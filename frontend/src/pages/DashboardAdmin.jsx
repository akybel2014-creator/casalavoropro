import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Check, X, Users, Building2, FileText, MessageSquare, Crown, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AziendaAvatar } from "@/pages/Aziende";

const STATUS_STYLES = {
    none: "bg-white/5 text-slate-400",
    in_attesa: "bg-amber-500/15 text-amber-400",
    verificata: "bg-emerald-500/15 text-emerald-400",
    rifiutata: "bg-red-500/15 text-red-400",
};
const STATUS_LABELS = { none: "Non richiesta", in_attesa: "In attesa", verificata: "Verificata", rifiutata: "Rifiutata" };

export default function DashboardAdmin() {
    const { user } = useAuth();
    const [aziende, setAziende] = useState(null);
    const [stats, setStats] = useState(null);

    const load = useCallback(async () => {
        try {
            const [a, s] = await Promise.all([api.get("/admin/aziende"), api.get("/admin/stats")]);
            setAziende(a.data);
            setStats(s.data);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const verifica = async (id, azione) => {
        try {
            await api.post(`/admin/aziende/${id}/verifica`, { azione });
            toast.success(azione === "verificata" ? "Azienda verificata e notificata." : "Verifica rifiutata e notificata.");
            load();
        } catch (e) {
            toast.error(formatApiError(e));
        }
    };

    const STAT_CARDS = [
        { label: "Utenti", value: stats?.utenti, icon: Users },
        { label: "Aziende", value: stats?.aziende, icon: Building2 },
        { label: "Verificate", value: stats?.aziende_verificate, icon: BadgeCheck },
        { label: "Richieste", value: stats?.richieste, icon: FileText },
        { label: "Preventivi", value: stats?.risposte, icon: MessageSquare },
        { label: "Abbonati PRO", value: stats?.abbonamenti_pro, icon: Crown },
    ];

    return (
        <div className="min-h-screen bg-navy grid-pattern px-4 py-24" data-testid="dashboard-admin">
            <div className="max-w-6xl mx-auto">
                <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Amministrazione</p>
                <h1 className="mt-1 font-display font-black text-3xl text-white tracking-tight">Ciao {user?.name}</h1>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {STAT_CARDS.map((s) => (
                        <div key={s.label} className="rounded-2xl border border-white/10 bg-navy-700/60 p-4">
                            <s.icon className="h-4 w-4 text-brand" />
                            <p className="mt-2 font-display font-black text-2xl text-white">{s.value ?? "—"}</p>
                            <p className="text-xs text-slate-400">{s.label}</p>
                        </div>
                    ))}
                </div>

                <h2 className="mt-12 font-display font-bold text-xl text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand" /> Verifiche aziende
                </h2>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10" data-testid="admin-verification-table">
                    <table className="w-full text-sm">
                        <thead className="bg-navy-700/80 text-slate-400">
                            <tr>
                                <th className="text-left font-medium px-5 py-3">Azienda</th>
                                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Email proprietario</th>
                                <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Categorie</th>
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
                                            <AziendaAvatar nome={a.nome} size="h-9 w-9 text-xs" />
                                            <div>
                                                <p className="font-semibold text-white">{a.nome}</p>
                                                <p className="text-xs text-slate-500">{a.plan === "pro" ? "Piano PRO" : "Piano Base"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{a.owner_email}</td>
                                    <td className="px-5 py-4 text-slate-400 hidden lg:table-cell">{a.categorie?.join(", ")}</td>
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
            </div>
        </div>
    );
}
