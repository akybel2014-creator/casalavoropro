import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { it } from "date-fns/locale";
import { addDays, differenceInCalendarDays, format, parseISO, startOfToday } from "date-fns";
import { CalendarDays, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function stimaTotale(prezzo, unita, giorni) {
    if (unita === "settimana") return prezzo * Math.ceil(giorni / 7);
    if (unita === "mese") return prezzo * Math.ceil(giorni / 30);
    return prezzo * giorni;
}

const eur = (n) => Number(n).toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function NoleggioCalendar({ annuncio, onBooked }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [occupati, setOccupati] = useState([]);
    const [range, setRange] = useState();
    const [nota, setNota] = useState("");
    const [busy, setBusy] = useState(false);

    const loadDisp = () => api.get(`/annunci/${annuncio.id}/disponibilita`).then(({ data }) => setOccupati(data)).catch(() => {});
    useEffect(() => { loadDisp(); }, [annuncio.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const disabled = useMemo(() => [
        { before: startOfToday() },
        ...occupati.map((o) => ({ from: parseISO(o.dal), to: parseISO(o.al) })),
    ], [occupati]);

    const giorni = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) + 1 : range?.from ? 1 : 0;
    const totale = giorni ? stimaTotale(annuncio.prezzo, annuncio.unita, giorni) : 0;

    const overlapsBooked = (from, to) => occupati.some((o) => parseISO(o.dal) <= to && parseISO(o.al) >= from);

    const prenota = async () => {
        if (!user) return navigate("/login");
        if (user.role !== "privato") {
            toast.info("Solo gli account privati possono prenotare un noleggio");
            return;
        }
        const from = range.from, to = range.to || range.from;
        if (overlapsBooked(from, to)) {
            toast.error("Il periodo scelto include giorni già occupati");
            return;
        }
        setBusy(true);
        try {
            const { data } = await api.post(`/annunci/${annuncio.id}/prenotazioni`, {
                dal: format(from, "yyyy-MM-dd"), al: format(to, "yyyy-MM-dd"), nota: nota.trim() || null,
            });
            toast.success("Richiesta di noleggio inviata! L'azienda la confermerà a breve.");
            setRange(undefined);
            setNota("");
            loadDisp();
            onBooked?.(data);
        } catch (e) {
            toast.error(formatApiError(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8" data-testid="noleggio-calendar">
            <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-brand" /> Disponibilità e prenotazione
            </h2>
            <p className="mt-1 text-sm text-slate-400">Seleziona il primo e l'ultimo giorno di noleggio. I giorni in grigio sono già occupati.</p>
            <div className="mt-5 flex flex-col lg:flex-row gap-6">
                <div className="rounded-2xl border border-white/10 bg-navy/60 p-2 self-start">
                    <Calendar
                        mode="range"
                        locale={it}
                        selected={range}
                        onSelect={setRange}
                        disabled={disabled}
                        numberOfMonths={1}
                        fromDate={startOfToday()}
                        toDate={addDays(startOfToday(), 365)}
                        className="text-white"
                        classNames={{
                            day_selected: "bg-brand text-white hover:bg-brand hover:text-white focus:bg-brand",
                            day_range_middle: "aria-selected:bg-brand/25 aria-selected:text-white",
                            day_today: "border border-brand/60 text-white",
                            day_disabled: "text-slate-600 line-through opacity-60",
                            head_cell: "text-slate-500 rounded-md w-8 font-normal text-[0.8rem]",
                            caption_label: "text-sm font-semibold text-white capitalize",
                            nav_button: "h-7 w-7 bg-transparent p-0 text-slate-300 hover:text-white border border-white/10 rounded-md inline-flex items-center justify-center",
                        }}
                    />
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="rounded-2xl border border-white/10 bg-navy/60 p-4 text-sm" data-testid="noleggio-riepilogo">
                        {giorni === 0 ? (
                            <p className="text-slate-400">Nessuna data selezionata.</p>
                        ) : (
                            <>
                                <p className="text-slate-300">
                                    <span className="font-semibold text-white">{format(range.from, "d MMM yyyy", { locale: it })}</span>
                                    {range.to && range.to !== range.from && <> → <span className="font-semibold text-white">{format(range.to, "d MMM yyyy", { locale: it })}</span></>}
                                </p>
                                <p className="mt-1 text-slate-400" data-testid="noleggio-giorni">{giorni} {giorni === 1 ? "giorno" : "giorni"} · {eur(annuncio.prezzo)}/{annuncio.unita}</p>
                                <p className="mt-2 font-display font-black text-2xl text-brand" data-testid="noleggio-totale">{eur(totale)}</p>
                                <p className="text-xs text-slate-500">Stima indicativa, da confermare con l'azienda.</p>
                            </>
                        )}
                    </div>
                    <Textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} data-testid="noleggio-nota-input"
                        placeholder="Nota per l'azienda (indirizzo cantiere, orario di consegna…)" className="mt-3 bg-navy/70 border-white/10 text-white placeholder:text-slate-500" />
                    <Button disabled={giorni === 0 || busy} onClick={prenota} data-testid="noleggio-prenota-button"
                        className="mt-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarDays className="h-4 w-4 mr-2" />}
                        {user ? "Richiedi prenotazione" : "Accedi per prenotare"}
                    </Button>
                    {occupati.length > 0 && (
                        <p className="mt-3 text-xs text-slate-500" data-testid="noleggio-occupati">
                            Periodi già prenotati: {occupati.map((o) => `${format(parseISO(o.dal), "d/M")}–${format(parseISO(o.al), "d/M")}`).join(", ")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
