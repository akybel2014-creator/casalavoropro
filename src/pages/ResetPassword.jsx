import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import LaunchBanner from "@/components/site/LaunchBanner";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const _token = params.get("token") || "";
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const { error: updateErr } = await supabase.auth.updateUser({ password });
            if (updateErr) throw updateErr;
            toast.success("Password aggiornata! Ora accedi con la nuova password.");
            navigate("/login");
        } catch (err) {
            setError(err?.message || "Impossibile aggiornare la password. Apri il link ricevuto via email e riprova.");
        }
    };

    return (
        <div className="min-h-screen bg-navy grid-pattern flex items-center justify-center px-4 pt-32 pb-24">
            <div className="fixed top-0 inset-x-0 z-50"><LaunchBanner /></div>
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-navy-700/70 p-8 sm:p-10">
                <div className="flex justify-center"><Logo size={40} /></div>
                <h1 className="mt-6 font-display font-black text-2xl text-white tracking-tight">Scegli una nuova password</h1>
                <form onSubmit={submit} className="mt-6 space-y-4" data-testid="reset-password-form">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Nuova password (min 8 caratteri)</Label>
                        <Input required type="password" minLength={8} data-testid="reset-password-input" value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                            className="bg-navy/70 border-white/10 text-white placeholder:text-slate-500" />
                    </div>
                    {error && <p className="text-sm text-red-400" data-testid="reset-password-error">{error}</p>}
                    <Button type="submit" data-testid="reset-password-submit-button"
                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold">
                        Aggiorna password
                    </Button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-400">
                    <Link to="/login" className="text-brand font-semibold hover:underline">Torna all'accesso</Link>
                </p>
            </div>
        </div>
    );
}
