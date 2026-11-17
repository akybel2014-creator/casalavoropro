import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { ensureSupabaseConfig, supabase } from "@/lib/supabaseClient";

const STAT_ID = "homepage_visits";

export default function VisitCounter() {
    const [visits, setVisits] = useState(null);
    const hasTrackedRef = useRef(false);

    useEffect(() => {
        let isActive = true;

        async function trackAndLoadVisits() {
            await ensureSupabaseConfig();

            try {
                // 1. Legge il valore attuale del contatore per 'homepage_visits'
                const { data: currentRow, error: selectError } = await supabase
                    .from("site_stats")
                    .select("id, count")
                    .eq("id", STAT_ID)
                    .maybeSingle();

                if (selectError) {
                    console.warn("[VisitCounter] Errore lettura site_stats:", selectError.message);
                    return;
                }

                const currentCount = Number(currentRow?.count ?? 0);
                if (isActive) {
                    setVisits(currentCount);
                }

                // Evita il doppio incremento in React StrictMode al primo montaggio
                if (hasTrackedRef.current) return;
                hasTrackedRef.current = true;

                const nextCount = currentCount + 1;

                // 2. Incrementa di +1 e aggiorna la tabella site_stats su Supabase
                if (currentRow) {
                    const { data: updatedRow, error: updateError } = await supabase
                        .from("site_stats")
                        .update({ count: nextCount })
                        .eq("id", STAT_ID)
                        .select("count")
                        .maybeSingle();

                    if (!updateError && isActive) {
                        setVisits(Number(updatedRow?.count ?? nextCount));
                    } else if (updateError) {
                        console.warn("[VisitCounter] Errore aggiornamento site_stats:", updateError.message);
                    }
                } else {
                    const { data: insertedRow, error: upsertError } = await supabase
                        .from("site_stats")
                        .upsert({ id: STAT_ID, count: nextCount }, { onConflict: "id" })
                        .select("count")
                        .maybeSingle();

                    if (!upsertError && isActive) {
                        setVisits(Number(insertedRow?.count ?? nextCount));
                    } else if (upsertError) {
                        console.warn("[VisitCounter] Errore inserimento site_stats:", upsertError.message);
                    }
                }
            } catch (err) {
                console.warn("[VisitCounter] Errore imprevisto:", err);
            }
        }

        trackAndLoadVisits();

        // 3. Ascolta aggiornamenti in tempo reale da Supabase Realtime
        let channel = null;
        try {
            channel = supabase
                .channel("realtime-homepage-visits")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "site_stats",
                        filter: `id=eq.${STAT_ID}`,
                    },
                    (payload) => {
                        const newCount = payload?.new?.count;
                        if (newCount !== undefined && newCount !== null && isActive) {
                            setVisits(Number(newCount));
                        }
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn("[VisitCounter] Realtime non disponibile:", err);
        }

        return () => {
            isActive = false;
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    return (
        <div
            data-testid="homepage-visit-counter"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-navy-700/60 px-3.5 py-2 text-xs text-slate-300 backdrop-blur-md"
        >
            <Eye className="h-3.5 w-3.5 text-brand shrink-0" />
            <span>
                <strong className="font-semibold text-white tabular-nums" data-testid="homepage-visit-count">
                    {visits === null ? "—" : visits.toLocaleString("it-IT")}
                </strong>{" "}
                visite totali alla homepage
            </span>
        </div>
    );
}
