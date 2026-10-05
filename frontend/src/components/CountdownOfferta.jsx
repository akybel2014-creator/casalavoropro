import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Fine Offerta Lancio Fondatori: 31 Dicembre 2026, 23:59:59 (ora italiana)
const DEADLINE = new Date("2026-12-31T23:59:59+01:00").getTime();

function diff() {
    const d = Math.max(0, DEADLINE - Date.now());
    return {
        giorni: Math.floor(d / 86400000),
        ore: Math.floor((d % 86400000) / 3600000),
        minuti: Math.floor((d % 3600000) / 60000),
        secondi: Math.floor((d % 60000) / 1000),
        scaduta: d <= 0,
    };
}

export function CountdownOfferta({ tone = "onDark", className = "", compact = false }) {
    const [t, setT] = useState(diff);

    useEffect(() => {
        const id = setInterval(() => setT(diff()), 1000);
        return () => clearInterval(id);
    }, []);

    if (t.scaduta) return null;

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 font-display font-black tabular-nums ${className}`} data-testid="countdown-offerta-compact">
                <span data-testid="countdown-giorni">{String(t.giorni).padStart(2, "0")}g</span>
                <span className="opacity-60">:</span>
                <span data-testid="countdown-ore">{String(t.ore).padStart(2, "0")}h</span>
                <span className="opacity-60">:</span>
                <span data-testid="countdown-min">{String(t.minuti).padStart(2, "0")}m</span>
                <span className="opacity-60">:</span>
                <span data-testid="countdown-sec">{String(t.secondi).padStart(2, "0")}s</span>
            </span>
        );
    }

    const onOrange = tone === "onOrange";
    const pill = onOrange ? "bg-navy text-white" : "bg-brand/15 text-white ring-1 ring-brand/40";
    const label = onOrange ? "text-white/80" : "text-slate-400";
    const title = onOrange ? "text-white/90" : "text-brand";

    const units = [
        { v: t.giorni, l: "giorni" },
        { v: t.ore, l: "ore" },
        { v: t.minuti, l: "min" },
        { v: t.secondi, l: "sec" },
    ];

    return (
        <div className={className} data-testid="countdown-offerta">
            <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${title}`}>
                <Clock className="h-3.5 w-3.5" /> L'offerta Fondatori scade tra
            </p>
            <div className="mt-2 flex items-stretch gap-2">
                {units.map((u) => (
                    <div key={u.l} className={`flex min-w-[56px] flex-col items-center rounded-xl px-3 py-2 ${pill}`}>
                        <span className="font-display font-black text-xl leading-none tabular-nums" data-testid={`countdown-${u.l}`}>
                            {String(u.v).padStart(2, "0")}
                        </span>
                        <span className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${label}`}>{u.l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CountdownOfferta;
