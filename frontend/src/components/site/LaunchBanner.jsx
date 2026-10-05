import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { CountdownOfferta } from "@/components/CountdownOfferta";

// Barra fissa globale: spinge le aziende a registrarsi durante l'Offerta Lancio Fondatori.
export default function LaunchBanner() {
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
                <span className="hidden md:inline">Offerta Fondatori: profilo PRO 100% GRATIS fino al 31 Dicembre.</span>
                <span className="md:hidden">PRO gratis fino al 31 Dic.</span>
                <CountdownOfferta compact className="rounded-full bg-navy/25 px-2 py-0.5 text-white" />
                <span className="inline-flex items-center gap-1 underline underline-offset-2 group-hover:no-underline">
                    Registrati gratis
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </Link>
        </div>
    );
}
