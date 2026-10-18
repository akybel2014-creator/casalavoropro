import { Link, useLocation } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

const HIDDEN_PREFIXES = ["/dashboard", "/area-privato", "/admin"];

// Barra fissa globale: promo abbonamento + registrazione gratis. Nascosta nelle aree private.
export default function LaunchBanner() {
    const { pathname } = useLocation();
    if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

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
                <span className="hidden md:inline">Abbonamento PRO €4,99/mese o €49,99/anno · Registrazione gratis.</span>
                <span className="md:hidden">PRO €4,99/mese · Registrazione gratis.</span>
                <span className="inline-flex items-center gap-1 underline underline-offset-2 group-hover:no-underline">
                    Registrati gratis
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </Link>
        </div>
    );
}
