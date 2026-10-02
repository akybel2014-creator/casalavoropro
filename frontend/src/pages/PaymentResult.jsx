import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function PaymentSuccess() {
    const [paid, setPaid] = useState(null);
    const { refreshMe } = useAuth();

    useEffect(() => {
        const sessionId = new URLSearchParams(window.location.search).get("session_id");
        if (!sessionId) return setPaid(false);
        let tries = 0;
        const tick = async () => {
            try {
                const { data } = await api.get(`/payments/status/${sessionId}`);
                if (data.payment_status === "paid") {
                    setPaid(true);
                    await refreshMe();
                    return;
                }
            } catch (e) {
                toast.error(formatApiError(e));
                setPaid(false);
                return;
            }
            tries += 1;
            if (tries < 10) setTimeout(tick, 2000);
            else setPaid(false);
        };
        tick();
    }, [refreshMe]);

    return (
        <div className="min-h-screen bg-navy grid-pattern flex items-center justify-center px-4">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-navy-700/70 p-10 text-center" data-testid="payment-result">
                {paid === null ? (
                    <>
                        <Loader2 className="h-12 w-12 text-brand mx-auto animate-spin" />
                        <h1 className="mt-5 font-display font-black text-2xl text-white">Verifica del pagamento…</h1>
                        <p className="mt-2 text-sm text-slate-400">Stiamo confermando l'abbonamento con Stripe. Non chiudere la pagina.</p>
                    </>
                ) : paid ? (
                    <>
                        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                        <h1 className="mt-5 font-display font-black text-2xl text-white">Abbonamento PRO attivo!</h1>
                        <p className="mt-2 text-sm text-slate-400">Il tuo profilo e ora in evidenza nella directory. Grazie per aver scelto CasaLavoriPRO.</p>
                        <Button asChild className="mt-6 w-full rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold">
                            <Link to="/dashboard/azienda" data-testid="payment-success-dashboard-link">Vai al pannello azienda</Link>
                        </Button>
                    </>
                ) : (
                    <>
                        <XCircle className="h-12 w-12 text-amber-400 mx-auto" />
                        <h1 className="mt-5 font-display font-black text-2xl text-white">Pagamento non confermato</h1>
                        <p className="mt-2 text-sm text-slate-400">Se hai completato il pagamento, aggiorna il pannello azienda tra qualche minuto.</p>
                        <Button asChild variant="outline" className="mt-6 w-full rounded-xl border-white/20 text-white hover:bg-white/10">
                            <Link to="/dashboard/azienda">Torna al pannello</Link>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export function PaymentCancel() {
    return (
        <div className="min-h-screen bg-navy grid-pattern flex items-center justify-center px-4">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-navy-700/70 p-10 text-center" data-testid="payment-cancel">
                <XCircle className="h-12 w-12 text-amber-400 mx-auto" />
                <h1 className="mt-5 font-display font-black text-2xl text-white">Pagamento annullato</h1>
                <p className="mt-2 text-sm text-slate-400">Nessun addebito effettuato. Puoi riprovare quando vuoi dal pannello azienda.</p>
                <Button asChild className="mt-6 w-full rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold">
                    <Link to="/dashboard/azienda">Torna al pannello azienda</Link>
                </Button>
            </div>
        </div>
    );
}
