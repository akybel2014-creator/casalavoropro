import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { CATEGORIES } from "@/components/landing/CategoryGrid";

export default function Registrati() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { register } = useAuth();
    const [ruolo, setRuolo] = useState(params.get("ruolo") === "azienda" ? "azienda" : "privato");
    const [form, setForm] = useState({ name: "", email: "", password: "", nome: "", zone: "", piva: "", descrizione: "" });
    const [categorie, setCategorie] = useState([]);
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
            const { user } = await register(payload);
            toast.success(`Benvenuto su CasaLavoriPRO, ${user.name}!`);
            navigate(dashboardPathFor(user.role));
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";

    return (
        <div className="min-h-screen bg-navy grid-pattern flex items-center justify-center px-4 py-24">
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
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Nome dell'azienda</Label>
                                    <Input required data-testid="register-company-name-input" value={form.nome} onChange={set("nome")} placeholder="EdilNuova Srl" className={inputCls} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Categorie di lavoro</Label>
                                    <div className="flex flex-wrap gap-1.5" data-testid="register-categories">
                                        {CATEGORIES.map((c) => (
                                            <button key={c.name} type="button" onClick={() => toggleCat(c.name)}
                                                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                                                    categorie.includes(c.name)
                                                        ? "border-brand bg-brand/15 text-brand"
                                                        : "border-white/15 text-slate-400 hover:text-white"
                                                }`}>
                                                {c.name}
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
                            {busy ? "Creazione…" : ruolo === "azienda" ? "Registra la tua azienda" : "Crea account gratuito"}
                        </Button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Hai già un account? <Link to="/login" data-testid="register-to-login-link" className="text-brand font-semibold hover:underline">Accedi</Link>
                </p>
            </div>
        </div>
    );
}
