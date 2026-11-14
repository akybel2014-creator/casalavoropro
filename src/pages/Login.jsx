import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import LaunchBanner from "@/components/site/LaunchBanner";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotSent, setForgotSent] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const { user } = await login(email, password);
            toast.success(`Bentornato, ${user.name}!`);
            navigate(dashboardPathFor(user.role));
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    const sendForgot = async (e) => {
        e.preventDefault();
        try {
            await api.post("/auth/forgot-password", { email });
            setForgotSent(true);
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };

    return (
        <div className="min-h-screen bg-navy grid-pattern flex items-center justify-center px-4 pt-32 pb-24">
            <div className="fixed top-0 inset-x-0 z-50"><LaunchBanner /></div>
            <div className="w-full max-w-md">
                <div className="flex justify-center">
                    <Link to="/" data-testid="login-logo"><Logo size={44} /></Link>
                </div>
                <div className="mt-8 rounded-3xl border border-white/10 bg-navy-700/70 p-7 sm:p-9 shadow-2xl">
                    <h1 className="font-display font-black text-2xl text-white tracking-tight">Accedi</h1>
                    <p className="mt-1 text-sm text-slate-400">Entra nella tua area CasaLavoroPRO</p>

                    <form onSubmit={submit} className="mt-7 space-y-5" data-testid="login-form">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input id="email" data-testid="login-email-input" type="email" required value={email}
                                onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.it"
                                className="bg-navy/70 border-white/10 text-white placeholder:text-slate-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <button type="button" data-testid="login-forgot-link" onClick={() => setShowForgot((v) => !v)}
                                    className="text-xs text-brand hover:underline">Password dimenticata?</button>
                            </div>
                            <Input id="password" data-testid="login-password-input" type="password" required value={password}
                                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                                className="bg-navy/70 border-white/10 text-white placeholder:text-slate-500" />
                        </div>

                        {showForgot && (
                            <div className="rounded-xl border border-brand/30 bg-brand/10 p-4">
                                {forgotSent ? (
                                    <p className="text-sm text-slate-200">Se l'email esiste, ti abbiamo inviato il link per il reset. Controlla la posta (anche lo spam).</p>
                                ) : (
                                    <form onSubmit={sendForgot} className="flex gap-2" data-testid="forgot-form">
                                        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                            placeholder="La tua email" className="bg-navy/70 border-white/10 text-white" />
                                        <Button type="submit" variant="outline" className="rounded-xl border-brand text-brand hover:bg-brand hover:text-navy shrink-0">
                                            Invia link
                                        </Button>
                                    </form>
                                )}
                            </div>
                        )}

                        {error && <p className="text-sm text-red-400" data-testid="login-error">{error}</p>}

                        <Button type="submit" disabled={busy} data-testid="login-submit-button"
                            className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                            {busy ? "Accesso…" : "Accedi"}
                        </Button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Non hai un account?{" "}
                    <Link to="/registrati" data-testid="login-to-register-link" className="text-brand font-semibold hover:underline">Registrati gratis</Link>
                </p>
            </div>
        </div>
    );
}
