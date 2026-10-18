import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, MapPin, User, CalendarDays, Euro, Trash2, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, formatApiError } from "@/lib/api";

const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";

const STATO_STYLES = {
    pianificato: ["bg-amber-500/15 text-amber-400", "Pianificato"],
    in_corso: ["bg-blue-500/15 text-blue-400", "In corso"],
    completato: ["bg-emerald-500/15 text-emerald-400", "Completato"],
};

const EMPTY = { titolo: "", cliente: "", indirizzo: "", data: "", importo: "", note: "", stato: "pianificato" };

export function InterventiPanel() {
    const [list, setList] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);
    const [filter, setFilter] = useState("tutti");

    const load = useCallback(async () => {
        try {
            const { data } = await api.get("/interventi/mine");
            setList(data);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.titolo.trim()) { toast.error("Inserisci un titolo"); return; }
        setBusy(true);
        try {
            await api.post("/interventi", {
                ...form,
                importo: form.importo === "" ? null : Number(form.importo),
            });
            toast.success("Intervento registrato!");
            setForm(EMPTY);
            load();
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    const setStato = async (id, stato) => {
        try {
            await api.patch(`/interventi/${id}/stato`, { stato });
            load();
        } catch (err) { toast.error(formatApiError(err)); }
    };

    const elimina = async (id) => {
        try {
            await api.delete(`/interventi/${id}`);
            load();
        } catch (err) { toast.error(formatApiError(err)); }
    };

    const items = list || [];
    const counts = {
        tutti: items.length,
        pianificato: items.filter((i) => i.stato === "pianificato").length,
        in_corso: items.filter((i) => i.stato === "in_corso").length,
        completato: items.filter((i) => i.stato === "completato").length,
    };
    const filtered = filter === "tutti" ? items : items.filter((i) => i.stato === filter);
    const FILTERS = [
        { key: "tutti", label: "Tutti" },
        { key: "pianificato", label: "Pianificati" },
        { key: "in_corso", label: "In corso" },
        { key: "completato", label: "Completati" },
    ];

    return (
        <div className="space-y-6" data-testid="interventi-panel">
            <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8 space-y-5" data-testid="intervento-form">
                <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
                    <Hammer className="h-5 w-5 text-brand" /> Registra un nuovo lavoro o cantiere
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label className="text-slate-300">Titolo intervento *</Label>
                        <Input value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                            placeholder="Es. Ristrutturazione bagno" data-testid="intervento-titolo" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Cliente</Label>
                        <Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                            placeholder="Nome cliente" data-testid="intervento-cliente" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Indirizzo / cantiere</Label>
                        <Input value={form.indirizzo} onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                            placeholder="Via, città" data-testid="intervento-indirizzo" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Data</Label>
                        <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                            data-testid="intervento-data" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Importo (€)</Label>
                        <Input type="number" min="0" step="0.01" value={form.importo} onChange={(e) => setForm({ ...form, importo: e.target.value })}
                            placeholder="0,00" data-testid="intervento-importo" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Stato</Label>
                        <select value={form.stato} onChange={(e) => setForm({ ...form, stato: e.target.value })}
                            data-testid="intervento-stato" className="w-full rounded-xl bg-navy/70 border border-white/10 text-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                            <option value="pianificato">Pianificato</option>
                            <option value="in_corso">In corso</option>
                            <option value="completato">Completato</option>
                        </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label className="text-slate-300">Note</Label>
                        <Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                            placeholder="Dettagli, materiali, scadenze…" data-testid="intervento-note" className={inputCls} />
                    </div>
                </div>
                <Button type="submit" disabled={busy} data-testid="intervento-submit"
                    className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                    {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Registra intervento
                </Button>
            </form>

            <div className="flex flex-wrap gap-2" data-testid="interventi-filtri">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        data-testid={`filtro-${f.key}`}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors ${
                            filter === f.key
                                ? "border-brand bg-brand text-white"
                                : "border-white/15 text-slate-300 hover:text-white hover:border-white/30"
                        }`}
                    >
                        {f.label} <span className="ml-1 opacity-80">{counts[f.key]}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-3" data-testid="interventi-list">
                {list && filtered.length === 0 && (
                    <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-10 text-center">
                        <Hammer className="h-10 w-10 text-slate-500 mx-auto" />
                        <p className="mt-3 text-sm text-slate-400">
                            {items.length === 0 ? "Nessun intervento registrato. Aggiungi il tuo primo lavoro qui sopra." : "Nessun intervento in questo stato."}
                        </p>
                    </div>
                )}
                {filtered.map((it) => {
                    const st = STATO_STYLES[it.stato] || STATO_STYLES.pianificato;
                    return (
                        <div key={it.id} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6" data-testid={`intervento-card-${it.id}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h4 className="font-display font-bold text-white text-lg">{it.titolo}</h4>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                        {it.cliente && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-brand" /> {it.cliente}</span>}
                                        {it.indirizzo && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" /> {it.indirizzo}</span>}
                                        {it.data && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-brand" /> {it.data}</span>}
                                        {it.importo != null && <span className="flex items-center gap-1"><Euro className="h-3.5 w-3.5 text-brand" /> {Number(it.importo).toLocaleString("it-IT")}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={it.stato} onChange={(e) => setStato(it.id, e.target.value)} data-testid={`intervento-stato-${it.id}`}
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${st[0]}`}>
                                        <option value="pianificato">Pianificato</option>
                                        <option value="in_corso">In corso</option>
                                        <option value="completato">Completato</option>
                                    </select>
                                    <button type="button" onClick={() => elimina(it.id)} data-testid={`intervento-delete-${it.id}`}
                                        aria-label="Elimina intervento" className="p-2 rounded-full text-red-400 hover:bg-red-500/10 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {it.note && <p className="mt-3 text-sm text-slate-300 leading-relaxed">{it.note}</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default InterventiPanel;
