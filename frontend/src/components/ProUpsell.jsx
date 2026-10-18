import { Lock, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Blocco "upgrade a PRO" riutilizzabile per le funzioni gestionali avanzate.
export function ProUpsell({ title, desc, bullets = [], onGoToAbbonamento, testid = "pro-upsell" }) {
    return (
        <div
            data-testid={testid}
            className="relative overflow-hidden rounded-3xl border-2 border-brand/50 bg-gradient-to-b from-brand/10 to-navy-700/70 p-8 sm:p-12 text-center"
        >
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15">
                <Lock className="h-7 w-7 text-brand" />
            </div>
            <h3 className="mt-5 font-display font-bold text-white text-xl sm:text-2xl">{title}</h3>
            <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">{desc}</p>

            {bullets.length > 0 && (
                <ul className="mt-6 inline-block text-left space-y-2.5">
                    {bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm text-slate-200">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                                <Check className="h-3.5 w-3.5" />
                            </span>
                            {b}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-7 flex flex-col items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" /> 14 giorni di prova gratis
                </span>
                <Button
                    onClick={onGoToAbbonamento}
                    data-testid={`${testid}-button`}
                    className="rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold px-7 shadow-lg shadow-orange-500/25"
                >
                    Passa a PRO · inizia la prova gratuita
                </Button>
                <p className="text-xs text-slate-500">€4,99/mese o €49,99/anno dopo la prova. Annulli quando vuoi.</p>
            </div>
        </div>
    );
}
