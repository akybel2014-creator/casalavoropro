import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Truck, Recycle, Trash2, ImagePlus, Loader2, Lock, Eye, EyeOff, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
import { annuncioImg, prezzoLabel, FILES_BASE } from "@/components/AnnuncioCard";

const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";
const EMPTY = { tipo: "noleggio", titolo: "", descrizione: "", categoria: "", zona: "", prezzo: "", unita: "giorno", stato: "Buono" };

function NuovoAnnuncioDialog({ meta, zoneDefault, onCreated }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY, zona: zoneDefault || "" });
    const [busy, setBusy] = useState(false);
    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
    const usato = form.tipo === "usato";

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const body = { ...form, prezzo: parseFloat(form.prezzo), unita: usato ? "fisso" : form.unita, stato: usato ? form.stato : null };
            const { data } = await api.post("/annunci", body);
            toast.success("Annuncio pubblicato! Ora aggiungi le foto.");
            setOpen(false);
            setForm({ ...EMPTY, zona: zoneDefault || "" });
            onCreated(data);
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button data-testid="annuncio-new-button" className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                    <Plus className="h-4 w-4 mr-1.5" /> Nuovo annuncio
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-h-[90vh] overflow-y-auto" data-testid="annuncio-dialog">
                <DialogHeader><DialogTitle className="font-display">Pubblica un annuncio</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4" data-testid="annuncio-form">
                    <div className="grid grid-cols-2 gap-2" data-testid="annuncio-tipo-toggle">
                        {[{ v: "noleggio", l: "Noleggio", I: Truck }, { v: "usato", l: "Vendita usato", I: Recycle }].map((o) => (
                            <button key={o.v} type="button" onClick={() => set("tipo")(o.v)} data-testid={`annuncio-tipo-${o.v}`}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${form.tipo === o.v ? "border-brand bg-brand/15 text-brand" : "border-white/10 text-slate-400 hover:text-white"}`}>
                                <o.I className="h-4 w-4" /> {o.l}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Titolo</Label>
                        <Input required minLength={3} value={form.titolo} onChange={(e) => set("titolo")(e.target.value)} data-testid="annuncio-titolo-input" placeholder={usato ? "Es. Smerigliatrice angolare 125 mm" : "Es. Miniescavatore 1,8 t"} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Categoria</Label>
                            <Select value={form.categoria} onValueChange={set("categoria")}>
                                <SelectTrigger data-testid="annuncio-categoria-select" className={inputCls}><SelectValue placeholder="Scegli…" /></SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    {meta.categorie.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Zona</Label>
                            <Input required value={form.zona} onChange={(e) => set("zona")(e.target.value)} data-testid="annuncio-zona-input" placeholder="Città o provincia" className={inputCls} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Prezzo (EUR)</Label>
                            <Input required type="number" step="0.01" min="1" value={form.prezzo} onChange={(e) => set("prezzo")(e.target.value)} data-testid="annuncio-prezzo-input" className={inputCls} />
                        </div>
                        {usato ? (
                            <div className="space-y-2">
                                <Label className="text-slate-300">Stato</Label>
                                <Select value={form.stato} onValueChange={set("stato")}>
                                    <SelectTrigger data-testid="annuncio-stato-select" className={inputCls}><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-navy-700 border-white/10">
                                        {meta.stati_usato.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-slate-300">Prezzo per</Label>
                                <Select value={form.unita} onValueChange={set("unita")}>
                                    <SelectTrigger data-testid="annuncio-unita-select" className={inputCls}><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-navy-700 border-white/10">
                                        {meta.unita.filter((u) => u !== "fisso").map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Descrizione</Label>
                        <Textarea required minLength={10} rows={4} value={form.descrizione} onChange={(e) => set("descrizione")(e.target.value)} data-testid="annuncio-descrizione-input"
                            placeholder="Caratteristiche, condizioni, cosa è incluso, modalità di consegna o ritiro…" className={inputCls} />
                    </div>
                    <Button type="submit" disabled={busy || !form.categoria} data-testid="annuncio-submit-button"
                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold">
                        {busy ? "Pubblicazione…" : "Pubblica annuncio"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AnnuncioRow({ a, onChange, onDelete }) {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const noleggio = a.tipo === "noleggio";

    const upload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            const fd = new FormData();
            files.forEach((f) => fd.append("files", f));
            const { data } = await api.post(`/annunci/${a.id}/foto`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            onChange(data);
            toast.success("Foto caricate!");
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const removeFoto = async (fotoId) => {
        try {
            const { data } = await api.delete(`/annunci/${a.id}/foto/${fotoId}`);
            onChange(data);
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };

    const toggleAttivo = async (v) => {
        try {
            const { data } = await api.put(`/annunci/${a.id}`, { attivo: v });
            onChange(data);
            toast.success(v ? "Annuncio visibile online" : "Annuncio nascosto");
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };

    return (
        <div className={`rounded-3xl border p-5 sm:p-6 ${a.attivo ? "border-white/10 bg-navy-700/70" : "border-white/5 bg-navy-700/40 opacity-80"}`} data-testid={`my-annuncio-${a.id}`}>
            <div className="flex flex-col sm:flex-row gap-5">
                <img src={annuncioImg(a)} alt={a.titolo} className="h-32 w-full sm:w-44 rounded-2xl object-cover border border-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${noleggio ? "bg-brand/15 text-brand" : "bg-emerald-500/15 text-emerald-400"}`}>
                                {noleggio ? <Truck className="h-3 w-3" /> : <Recycle className="h-3 w-3" />} {noleggio ? "Noleggio" : `Usato · ${a.stato}`}
                            </span>
                            <h3 className="mt-1.5 font-display font-bold text-white truncate">{a.titolo}</h3>
                            <p className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-brand" /> {a.zona}</span>
                                <span>{a.categoria}</span>
                                <span className="font-semibold text-brand">{prezzoLabel(a)}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-slate-300">
                                {a.attivo ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
                                <Switch checked={!!a.attivo} onCheckedChange={toggleAttivo} data-testid={`my-annuncio-attivo-${a.id}`} className="data-[state=checked]:bg-brand" />
                            </label>
                            <Button size="icon" variant="ghost" onClick={() => onDelete(a)} data-testid={`my-annuncio-delete-${a.id}`} aria-label="Elimina annuncio" className="text-slate-400 hover:text-red-400 hover:bg-white/5">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {a.foto?.map((f) => (
                            <div key={f.id} className="relative group h-14 w-14 rounded-lg overflow-hidden border border-white/10" data-testid={`my-annuncio-foto-${f.id}`}>
                                <img src={`${FILES_BASE}${f.path}`} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removeFoto(f.id)} aria-label="Elimina foto" data-testid={`my-annuncio-foto-delete-${f.id}`}
                                    className="absolute inset-0 flex items-center justify-center bg-navy/80 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={upload} data-testid={`my-annuncio-upload-input-${a.id}`} />
                        <Button type="button" size="sm" variant="outline" disabled={uploading || (a.foto?.length || 0) >= 4} onClick={() => fileRef.current?.click()} data-testid={`my-annuncio-upload-button-${a.id}`}
                            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                            {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5 mr-1.5" />}
                            {uploading ? "Caricamento…" : `Foto (${a.foto?.length || 0}/4)`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AnnunciPanel({ azienda, onGoToAbbonamento }) {
    const [items, setItems] = useState(null);
    const [meta, setMeta] = useState({ categorie: [], unita: [], stati_usato: [] });
    const isPro = azienda?.plan === "pro";

    const load = useCallback(async () => {
        try {
            const [m, a] = await Promise.all([api.get("/annunci/meta"), api.get("/annunci/mine")]);
            setMeta(m.data);
            setItems(a.data);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const replace = (fresh) => setItems((list) => list.map((x) => (x.id === fresh.id ? fresh : x)));
    const remove = async (a) => {
        try {
            await api.delete(`/annunci/${a.id}`);
            setItems((list) => list.filter((x) => x.id !== a.id));
            toast.success("Annuncio eliminato");
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };

    if (!isPro) {
        return (
            <div className="rounded-3xl border-2 border-brand/40 bg-gradient-to-b from-brand/10 to-navy-700/70 p-8 text-center" data-testid="annunci-locked">
                <Lock className="h-10 w-10 text-brand mx-auto" />
                <h3 className="mt-4 font-display font-bold text-white text-xl">Annunci riservati alle aziende PRO</h3>
                <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">
                    Con l'abbonamento PRO pubblichi annunci illimitati per noleggiare i tuoi macchinari fermi e vendere l'attrezzatura usata, con foto e prezzo, a privati e imprese della tua provincia.
                </p>
                <Button onClick={onGoToAbbonamento} data-testid="annunci-upgrade-button" className="mt-6 rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                    Passa a PRO
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5" data-testid="annunci-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-display font-bold text-white text-xl">I tuoi annunci</h3>
                    <p className="mt-1 text-sm text-slate-400">Mezzi a noleggio e attrezzatura usata visibili su /noleggio e /mercatino.</p>
                </div>
                <NuovoAnnuncioDialog meta={meta} zoneDefault={azienda?.zone?.[0]} onCreated={(a) => setItems((list) => [a, ...(list || [])])} />
            </div>
            {items && items.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center" data-testid="annunci-mine-empty">
                    <Truck className="h-10 w-10 text-slate-500 mx-auto" />
                    <p className="mt-3 text-sm text-slate-400">Nessun annuncio ancora. Pubblica il primo: bastano titolo, prezzo e una foto.</p>
                </div>
            )}
            {items && items.map((a) => <AnnuncioRow key={a.id} a={a} onChange={replace} onDelete={remove} />)}
        </div>
    );
}
