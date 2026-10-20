import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Building2, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import LaunchBanner from "@/components/site/LaunchBanner";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { SERVICE_CATEGORIES } from "@/components/landing/CategoryGrid";

export default function Registrati() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { register } = useAuth();
    const [ruolo, setRuolo] = useState(params.get("ruolo") === "azienda" ? "azienda" : "privato");
    const [form, setForm] = useState({ name: "", email: "", password: "", nome: "", zone: "", piva: "", descrizione: "" });
    const [categorie, setCategorie] = useState([]);
    const [plan] = useState("base");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const toggleCat = (c) => setCategorie((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const payload = {
                name: form.name, email: form.email, password: form.password, ruolo,
            };
            if (ruolo === "azienda") {
                payload.azienda = {
                    nome: form.nome || form.name,
                    categorie,
                    zone: form.zone.split(",").map((z) => z.trim()).filter(Boolean),
                    piva: form.piva || undefined,
                    descrizione: form.descrizione || undefined,
                };
            }
            const { user, azienda } = await register(payload);
            toast.success(`Benvenuto su CasaLavoroPRO, ${user.name}!`);
            // Offerta Fondatori: le prime 50 aziende hanno gia il PRO gratis -> nessun pagamento.
            if (ruolo === "azienda" && azienda?.founder50) {
                toast.success("Sei tra le prime 50 aziende: PRO attivato GRATIS per sempre!");
                navigate(dashboardPathFor(user.role));
                return;
            }
            if (ruolo === "azienda" && plan !== "base") {
                try {
                    const { data } = await api.post("/payments/checkout", { lookup_key: plan, origin_url: window.location.origin });
                    window.location.href = data.checkout_url;
                    return;
                } catch (err) {
                    toast.error("Account creato! Puoi attivare il piano PRO dalla tua dashboard (Profilo → Abbonamento).");
                }
            }
            navigate(dashboardPathFor(user.role));
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";

    return (
        <div className="min-h-screen bg-navy grid-pattern flex items-center justify-center px-4 pt-32 pb-24">
            <div className="fixed top-0 inset-x-0 z-50"><LaunchBanner /></div>
            <div className="w-full max-w-lg">
                <div className="flex justify-center">
                    <Link to="/" data-testid="register-logo"><Logo size={44} /></Link>
                </div>
                <div className="mt-8 rounded-3xl border border-white/10 bg-navy-700/70 p-7 sm:p-9 shadow-2xl">
                    <h1 className="font-display font-black text-2xl text-white tracking-tight">Crea il tuo account</h1>
                    <p className="mt-1 text-sm text-slate-400">Gratis, senza vincoli. Scegli chi sei.</p>

                    <div className="mt-6 grid grid-cols-2 gap-3" data-testid="register-role-toggle">
                        {[
                            { v: "privato", label: "Sono un Privato", icon: User, t: "register-role-privato" },
                            { v: "azienda", label: "Sono un'Azienda", icon: Building2, t: "register-role-azienda" },
                        ].map((o) => (
                            <button key={o.v} type="button" data-testid={o.t} onClick={() => setRuolo(o.v)}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                                    ruolo === o.v
                                        ? "border-brand bg-brand/15 text-brand shadow-lg shadow-brand/10"
                                        : "border-white/10 text-slate-400 hover:border-white/25 hover:text-white"
                                }`}>
                                <o.icon className="h-4 w-4" /> {o.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="mt-6 space-y-4" data-testid="register-form">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Il tuo nome {ruolo === "azienda" ? "(referente)" : ""}</Label>
                            <Input required data-testid="register-name-input" value={form.name} onChange={set("name")} placeholder="Mario Rossi" className={inputCls} />
                        </div>

                        {ruolo === "azienda" && (
                            <>
                                <div data-testid="register-free-note"
                                    className="rounded-xl border border-brand/40 bg-brand/10 p-4 flex items-start gap-3">
                                    <Sparkles className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-white font-semibold">Iscrizione gratuita, senza costi né carta di credito.</p>
                                        <p className="mt-1 text-xs text-slate-300">
                                            Oggi tutte le funzioni sono incluse gratis. Il{" "}
                                            <span className="line-through text-slate-400">Profilo PRO €4,99/mese</span>{" "}
                                            <span className="font-semibold text-brand">arriverà in futuro</span>: per ora non paghi nulla.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Nome dell'azienda</Label>
                                    <Input required data-testid="register-company-name-input" value={form.nome} onChange={set("nome")} placeholder="EdilNuova Srl" className={inputCls} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Categorie di lavoro</Label>
                                    <div className="flex flex-wrap gap-1.5" data-testid="register-categories">
                                        {SERVICE_CATEGORIES.map((c) => (
                                            <button key={c} type="button" onClick={() => toggleCat(c)}
                                                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                                                    categorie.includes(c)
                                                        ? "border-brand bg-brand/15 text-brand"
                                                        : "border-white/15 text-slate-400 hover:text-white"
                                                }`}>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Zone (separate da virgola)</Label>
                                        <Input data-testid="register-zone-input" value={form.zone} onChange={set("zone")} placeholder="Milano, Monza" className={inputCls} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Partita IVA</Label>
                                        <Input data-testid="register-piva-input" value={form.piva} onChange={set("piva")} placeholder="IT01234567890" className={inputCls} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Descrizione azienda</Label>
                                    <Textarea data-testid="register-descrizione-input" value={form.descrizione} onChange={set("descrizione")} rows={3}
                                        placeholder="Cosa fa la tua azienda, esperienze, servizi offerti…" className={`${inputCls} placeholder:text-slate-500`} />
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Email</Label>
                                <Input required type="email" data-testid="register-email-input" value={form.email} onChange={set("email")} placeholder="tu@email.it" className={inputCls} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Password (min 8 caratteri)</Label>
                                <Input required type="password" minLength={8} data-testid="register-password-input" value={form.password} onChange={set("password")} placeholder="••••••••" className={inputCls} />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-400" data-testid="register-error">{error}</p>}

                        <Button type="submit" disabled={busy} data-testid="register-submit-button"
                            className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                            {busy ? "Creazione…" : ruolo === "azienda" ? "Crea Account Azienda Gratis" : "Registrati Gratis come Privato (Nessun costo nascosto)"}
                        </Button>
                        {ruolo === "azienda" && (
                            <p className="text-xs text-slate-400 text-center" data-testid="register-plan-note">
                                L'iscrizione è completamente gratuita: profilo in directory, preventivi, cantieri, annunci e offerte di lavoro inclusi.
                                Nessun abbonamento e nessuna carta di credito. Il Profilo PRO verrà introdotto in futuro.
                            </p>
                        )}
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Hai già un account? <Link to="/login" data-testid="register-to-login-link" className="text-brand font-semibold hover:underline">Accedi</Link>
                </p>
            </div>
        </div>
    );
}
