import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie_consent";

function hasStoredConsent() {
    try {
        return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
        return false;
    }
}

export default function CookieBanner() {
    const [mounted, setMounted] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!hasStoredConsent()) {
            const timer = setTimeout(() => setMounted(true), 250);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, []);

    const saveConsent = (choice) => {
        try {
            localStorage.setItem(STORAGE_KEY, choice);
        } catch {
            // Ignora errori localStorage in ambienti restrittivi
        }
        setClosing(true);
        setTimeout(() => {
            setMounted(false);
        }, 300);
    };

    if (!mounted) return null;

    return (
        <aside
            role="dialog"
            aria-label="Informativa sui cookie"
            data-testid="cookie-banner"
            className={`fixed bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 z-[60] flex justify-center pointer-events-none transition-all duration-300 ease-out ${
                closing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
        >
            <div className="pointer-events-auto w-full max-w-4xl rounded-2xl p-[1px] bg-gradient-to-r from-brand/45 via-white/15 to-amber-500/30 shadow-2xl shadow-black/50">
                <div className="rounded-2xl bg-navy-700/95 backdrop-blur-xl px-5 py-4 sm:px-6 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Cookie className="h-5 w-5 text-brand" />
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed">
                            <p className="font-display font-bold text-white text-base flex items-center gap-1.5">
                                Gestione dei Cookie <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
                            </p>
                            <p className="mt-1 text-xs sm:text-sm text-slate-300">
                                Utilizziamo cookie tecnici necessari al funzionamento del sito e cookie di terze parti per migliorare l'esperienza di navigazione e i servizi offerti. Puoi consultare la nostra{" "}
                                <Link
                                    to="/privacy-policy"
                                    data-testid="cookie-banner-privacy-link"
                                    className="text-brand font-semibold hover:underline"
                                >
                                    Privacy Policy
                                </Link>{" "}
                                e la{" "}
                                <Link
                                    to="/cookie-policy"
                                    data-testid="cookie-banner-policy-link"
                                    className="text-slate-200 underline decoration-white/30 hover:text-brand transition-colors"
                                >
                                    Cookie Policy
                                </Link>
                                .
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            data-testid="cookie-banner-necessary-button"
                            onClick={() => saveConsent("necessary")}
                            className="rounded-xl border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white text-xs sm:text-sm px-4"
                        >
                            Solo necessari
                        </Button>
                        <Button
                            type="button"
                            data-testid="cookie-banner-accept-button"
                            onClick={() => saveConsent("accepted")}
                            className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25 text-xs sm:text-sm px-5"
                        >
                            Accetta tutti
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
