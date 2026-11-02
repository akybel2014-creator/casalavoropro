import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Truck, Recycle, Trash2, ImagePlus, Loader2, Lock, Eye, EyeOff, MapPin, Pencil, CalendarDays, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
import { annuncioImg, prezzoLabel, FILES_BASE } from "@/components/AnnuncioCard";
import { PrenotazioniList } from "@/components/PrenotazioniList";

const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";
const EMPTY = { tipo: "noleggio", titolo: "", descrizione: "", categoria: "", sottocategoria: "", zona: "", prezzo: "", unita: "giorno", stato: "Buono" };

function toForm(a, zoneDefault) {
    if (!a) return { ...EMPTY, zona: zoneDefault || "" };
    return { tipo: a.tipo, titolo: a.titolo, descrizione: a.descrizione, categoria: a.categoria, sottocategoria: a.sottocategoria || "", zona: a.zona, prezzo: String(a.prezzo), unita: a.unita || "giorno", stato: a.stato || "Buono" };
}

function AnnuncioDialog({ meta, zoneDefault, annuncio, onCreated, onUpdated }) {
    const editing = !!annuncio;
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(() => toForm(annuncio, zoneDefault));
    const [busy, setBusy] = useState(false);
    const [aiBusy, setAiBusy] = useState(false);
    const aiFileRef = useRef(null);
    const prezzoRef = useRef(null);
    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
    const usato = form.tipo === "usato";

    const matchCategoria = (aiCat) => {
        if (!aiCat) return "";
        const norm = (s) => String(s).toLowerCase().trim();
        const exact = meta.categorie.find((c) => norm(c) === norm(aiCat));
        if (exact) return exact;
        return meta.categorie.find((c) => norm(c).includes(norm(aiCat)) || norm(aiCat).includes(norm(c))) || "";
    };

    const aiFill = async (file) => {
        if (!file) return;
        setAiBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const { data } = await api.post("/analizza-macchinario", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const s = data.suggerimenti || {};
            const cat = matchCategoria(s.categoria);
            const tags = Array.isArray(s.tag_ricerca) ? s.tag_ricerca.join(", ") : "";
            const desc = [s.descrizione_breve, s.stato_usura ? `Stato: ${s.stato_usura}.` : "", tags ? `Tag: ${tags}` : ""].filter(Boolean).join(" ");
            setForm((f) => ({
                ...f,
                titolo: s.titolo_suggerito || f.titolo,
                categoria: cat || f.categoria,
                sottocategoria: cat ? "" : f.sottocategoria,
                descrizione: desc || f.descrizione,
                stato: (usato && meta.stati_usato?.includes(s.stato_usura)) ? s.stato_usura : f.stato,
            }));
            toast.success("Campi compilati dall'AI! Inserisci solo il prezzo.");
            setTimeout(() => prezzoRef.current?.focus(), 200);
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setAiBusy(false);
            if (aiFileRef.current) aiFileRef.current.value = "";
        }
    };

    const openChange = (v) => {
        setOpen(v);
        if (v) setForm(toForm(annuncio, zoneDefault));
    };

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const body = { ...form, prezzo: parseFloat(form.prezzo), unita: usato ? "fisso" : form.unita, stato: usato ? form.stato : null };
            if (editing) {
                const { tipo, ...updates } = body;
                const { data } = await api.put(`/annunci/${annuncio.id}`, updates);
                toast.success("Annuncio aggiornato!");
                setOpen(false);
                onUpdated(data);
                return;
            }
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
        <Dialog open={open} onOpenChange={openChange}>
            <DialogTrigger asChild>
                {editing ? (
                    <Button size="icon" variant="ghost" data-testid={`my-annuncio-edit-${annuncio.id}`} aria-label="Modifica annuncio" className="text-slate-400 hover:text-white hover:bg-white/5">
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button data-testid="annuncio-new-button" className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                        <Plus className="h-4 w-4 mr-1.5" /> Nuovo annuncio
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-h-[90vh] overflow-y-auto" data-testid={editing ? `annuncio-edit-dialog-${annuncio.id}` : "annuncio-dialog"}>
                <DialogHeader><DialogTitle className="font-display">{editing ? "Modifica annuncio" : "Pubblica un annuncio"}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4" data-testid="annuncio-form">
                    {!editing && (
                        <div className="rounded-xl border border-brand/30 bg-brand/5 p-3" data-testid="annuncio-ai-assist">
                            <input ref={aiFileRef} type="file" accept="image/*" capture="environment" className="hidden" data-testid="annuncio-ai-photo-input" onChange={(e) => aiFill(e.target.files?.[0])} />
                            <Button type="button" onClick={() => aiFileRef.current?.click()} disabled={aiBusy} data-testid="annuncio-ai-photo-button"
                                className="w-full rounded-lg bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold">
                                {aiBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                {aiBusy ? "Analisi foto in corso…" : "Compila con una foto (AI)"}
                            </Button>
                            <p className="mt-2 text-xs text-slate-400 text-center">Scatta o carica una foto dell'attrezzo: l'AI compila titolo, categoria e descrizione. A te resta solo il prezzo.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2" data-testid="annuncio-tipo-toggle">
                        {[{ v: "noleggio", l: "Noleggio", I: Truck }, { v: "usato", l: "Vendita usato", I: Recycle }].map((o) => (
                            <button key={o.v} type="button" disabled={editing} onClick={() => set("tipo")(o.v)} data-testid={`annuncio-tipo-${o.v}`}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${form.tipo === o.v ? "border-brand bg-brand/15 text-brand" : "border-white/10 text-slate-400 hover:text-white"}`}>
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
                            <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v, sottocategoria: "" }))}>
                                <SelectTrigger data-testid="annuncio-categoria-select" className={inputCls}><SelectValue placeholder="Scegli…" /></SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    {meta.categorie.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Sottocategoria</Label>
                            <Select value={form.sottocategoria || undefined} onValueChange={set("sottocategoria")} disabled={!form.categoria}>
                                <SelectTrigger data-testid="annuncio-sottocategoria-select" className={inputCls}>
                                    <SelectValue placeholder={form.categoria ? "Scegli…" : "Scegli prima la categoria"} />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    {(meta.sottocategorie?.[form.categoria] || []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Zona</Label>
                            <Input required value={form.zona} onChange={(e) => set("zona")(e.target.value)} data-testid="annuncio-zona-input" placeholder="Città o provincia" className={inputCls} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Prezzo (EUR)</Label>
                            <Input required type="number" step="0.01" min="1" ref={prezzoRef} value={form.prezzo} onChange={(e) => set("prezzo")(e.target.value)} data-testid="annuncio-prezzo-input" className={inputCls} />
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
                        {busy ? "Salvataggio…" : editing ? "Salva modifiche" : "Pubblica annuncio"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AnnuncioRow({ a, meta, onChange, onDelete }) {
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

    const toggleVenduto = async () => {
        try {
            const { data } = await api.put(`/annunci/${a.id}`, { venduto: !a.venduto });
            onChange(data);
            toast.success(data.venduto ? "Segnato come venduto: non appare più nel Mercatino" : "Rimesso in vendita");
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
                            {a.venduto && (
                                <span data-testid={`my-annuncio-venduto-badge-${a.id}`} className="ml-2 inline-flex items-center rounded-full bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">Venduto</span>
                            )}
                            <h3 className="mt-1.5 font-display font-bold text-white truncate">{a.titolo}</h3>
                            <p className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-brand" /> {a.zona}</span>
                                <span>{a.categoria}</span>
                                <span className="font-semibold text-brand">{prezzoLabel(a)}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <AnnuncioDialog meta={meta} annuncio={a} onUpdated={onChange} />
                            {!noleggio && (
                                <Button size="sm" variant="outline" onClick={toggleVenduto} data-testid={`my-annuncio-venduto-${a.id}`}
                                    className={`rounded-full h-8 ${a.venduto ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" : "border-white/15 text-slate-300 hover:bg-white/10"}`}>
                                    {a.venduto ? <><RotateCcw className="h-3.5 w-3.5 mr-1" /> Rimetti</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Venduto</>}
                                </Button>
                            )}
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
                        <Button type="button" size="sm" variant="outline" disabled={uploading || (a.foto?.length || 0) >= 10} onClick={() => fileRef.current?.click()} data-testid={`my-annuncio-upload-button-${a.id}`}
                            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                            {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5 mr-1.5" />}
                            {uploading ? "Caricamento…" : `Foto (${a.foto?.length || 0}/10)`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AnnunciPanel({ azienda, onGoToAbbonamento }) {
    const [items, setItems] = useState(null);
    const [prenotazioni, setPrenotazioni] = useState(null);
    const [meta, setMeta] = useState({ categorie: [], unita: [], stati_usato: [] });
    const isPro = azienda?.plan === "pro";

    const load = useCallback(async () => {
        try {
            const [m, a, p] = await Promise.all([api.get("/annunci/meta"), api.get("/annunci/mine"), api.get("/prenotazioni/azienda")]);
            setMeta(m.data);
            setItems(a.data);
            setPrenotazioni(p.data);
        } catch (e) {
            toast.error(formatApiError(e));
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const replace = (fresh) => setItems((list) => list.map((x) => (x.id === fresh.id ? fresh : x)));
    const cambiaStato = async (id, stato) => {
        try {
            const { data } = await api.post(`/prenotazioni/${id}/stato`, { stato });
            setPrenotazioni((list) => list.map((x) => (x.id === id ? data : x)));
            toast.success(stato === "confermata" ? "Noleggio confermato: il cliente è stato avvisato" : "Richiesta rifiutata");
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelMotivo, setCancelMotivo] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const annullaAzienda = (id) => {
        const p = prenotazioni?.find((x) => x.id === id);
        if (!p) return;
        setCancelMotivo("");
        setCancelTarget(p);
    };

    const confirmAnnullaAzienda = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            const { data } = await api.post(`/prenotazioni/${cancelTarget.id}/annulla-azienda`, { motivo: cancelMotivo });
            setPrenotazioni((list) => list.map((x) => (x.id === cancelTarget.id ? data : x)));
            toast.success(data.caparra_stato === "rimborsata" ? "Noleggio annullato e caparra rimborsata al cliente" : "Noleggio annullato");
            setCancelTarget(null);
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setCancelling(false);
        }
    };
    const inAttesa = prenotazioni?.filter((p) => p.stato === "richiesta").length || 0;
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
                <AnnuncioDialog meta={meta} zoneDefault={azienda?.zone?.[0]} onCreated={(a) => setItems((list) => [a, ...(list || [])])} />
            </div>
            {items && items.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center" data-testid="annunci-mine-empty">
                    <Truck className="h-10 w-10 text-slate-500 mx-auto" />
                    <p className="mt-3 text-sm text-slate-400">Nessun annuncio ancora. Pubblica il primo: bastano titolo, prezzo e una foto.</p>
                </div>
            )}
            {items && items.map((a) => <AnnuncioRow key={a.id} a={a} meta={meta} onChange={replace} onDelete={remove} />)}

            <div className="pt-6 border-t border-white/10" data-testid="prenotazioni-azienda">
                <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-brand" /> Richieste di noleggio
                    {inAttesa > 0 && <span className="rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5" data-testid="prenotazioni-in-attesa">{inAttesa} da gestire</span>}
                </h3>
                <p className="mt-1 mb-4 text-sm text-slate-400">Conferma o rifiuta le date richieste dai privati: i giorni confermati o in attesa risultano occupati nel calendario.</p>
                <PrenotazioniList items={prenotazioni} ruolo="azienda" onStato={cambiaStato} onAnnullaAzienda={annullaAzienda} />
            </div>

            <Dialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}>
                <DialogContent className="bg-navy-700 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-display">Annulla noleggio</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-300">
                        {cancelTarget?.caparra_stato === "pagata"
                            ? `Annullare il noleggio di ${cancelTarget.client_name}? La caparra di ${Number(cancelTarget.caparra_importo).toLocaleString("it-IT", { style: "currency", currency: "EUR" })} verrà rimborsata automaticamente.`
                            : `Annullare il noleggio confermato di ${cancelTarget?.client_name}? Il cliente riceverà un avviso.`}
                    </p>
                    <div className="space-y-2 mt-2">
                        <Label className="text-slate-300 text-xs">Motivo dell'annullamento (facoltativo, visibile al cliente)</Label>
                        <Input value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} placeholder="Es. Mezzo in manutenzione straordinaria" className={inputCls} />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setCancelTarget(null)} className="rounded-full border-white/20 text-white hover:bg-white/10">Indietro</Button>
                        <Button type="button" disabled={cancelling} onClick={confirmAnnullaAzienda} className="rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold">
                            {cancelling ? "Annullamento…" : "Conferma annullamento"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
