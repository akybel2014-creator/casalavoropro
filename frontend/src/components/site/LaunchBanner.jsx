import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

const HIDDEN_PREFIXES = ["/dashboard", "/area-privato", "/admin"];

// Barra fissa globale: Offerta Fondatori (PRO gratis per le prime 50 aziende) finche attiva,
// altrimenti promo abbonamento standard. Nascosta nelle aree private.
export default function LaunchBanner() {
    const { pathname } = useLocation();
    const [offer, setOffer] = useState(null);

    useEffect(() => {
        api.get("/founder-offer").then(({ data }) => setOffer(data)).catch(() => { /* silenzioso */ });
    }, []);

    if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

    const founder = offer?.active;

    return (
        <div
            data-testid="launch-banner"
            className="w-full bg-gradient-to-r from-orange-600 via-brand to-amber-500 text-white"
        >
            <Link
                to="/registrati?ruolo=azienda"
                data-testid="launch-banner-cta"
                className="group flex h-9 items-center justify-center gap-x-2 gap-y-0.5 px-3 text-center text-[11px] sm:text-xs font-semibold leading-none"
            >
                <Sparkles className="hidden sm:inline-block h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {founder ? (
                    <>
                        <span className="hidden md:inline">
                            Alle prime 50 aziende iscritte: abbonamento PRO GRATIS per sempre · restano {offer.remaining} posti.
                        </span>
                        <span className="md:hidden">PRO GRATIS per sempre · {offer.remaining} posti rimasti.</span>
                    </>
                ) : (
                    <>
                        <span className="hidden md:inline">Abbonamento PRO €4,99/mese o €49,99/anno · Registrazione gratis.</span>
                        <span className="md:hidden">PRO €4,99/mese · Registrazione gratis.</span>
                    </>
                )}
                <span className="inline-flex items-center gap-1 underline underline-offset-2 group-hover:no-underline">
                    {founder ? "Approfitta ora" : "Registrati gratis"}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </Link>
        </div>
    );
}
