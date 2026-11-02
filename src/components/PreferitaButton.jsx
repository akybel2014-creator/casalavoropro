import { Heart } from "lucide-react";

export function PreferitaButton({ aziendaId, nome, saved, onToggle, size = "icon", className = "" }) {
    const label = saved ? "Rimuovi dalle preferite" : "Salva tra le preferite";
    const base = "inline-flex items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-200 active:scale-90";
    const look = saved
        ? "bg-brand/20 border-brand/60 text-brand"
        : "bg-white/5 border-white/10 text-slate-400 hover:text-brand hover:border-brand/40";

    if (size === "wide") {
        return (
            <button
                type="button"
                aria-pressed={saved}
                aria-label={label}
                data-testid={`preferita-toggle-${aziendaId}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(aziendaId, nome); }}
                className={`${base} ${look} gap-2 px-4 py-2.5 text-sm font-semibold w-full ${className}`}
            >
                <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {saved ? "Salvata tra le preferite" : "Salva tra le preferite"}
            </button>
        );
    }

    return (
        <button
            type="button"
            aria-pressed={saved}
            aria-label={label}
            title={label}
            data-testid={`preferita-toggle-${aziendaId}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(aziendaId, nome); }}
            className={`${base} ${look} h-9 w-9 ${className}`}
        >
            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
    );
}
