import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Upload, X, Link2, FileUp, Pencil, Trash2, Tag, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
import { annuncioImg, prezzoLabel, FILES_BASE } from "@/components/AnnuncioCard";

const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";

const EMPTY = { titolo: "", descrizione: "", categoria: "", sottocategoria: "", zona: "", prezzo: "", stato: "Buono", telefono: "", immagine_url: "" };

function VendiDialog({ meta, record, onSaved, trigger }) {
    const edit = !!record;
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [f, setF] = useState(EMPTY);
    const [foto, setFoto] = useState([]);
    const [urlInput, setUrlInput] = useState("");
    const [currentId, setCurrentId] = useState(null);

    useEffect(() => {
        if (open) {
            if (record) {
                setF({
                    titolo: record.titolo || "", descrizione: record.descrizione || "", categoria: record.categoria || "",
                    sottocategoria: record.sottocategoria || "", zona: record.zona || "", prezzo: record.prezzo ?? "",
                    stato: record.stato || "Buono", telefono: record.azienda_telefono || "", immagine_url: record.immagine_url || "",
                });
                setFoto(record.foto || []);
                setCurrentId(record.id);
            } else {
                setF(EMPTY); setFoto([]); setCurrentId(null); setUrlInput("");
            }
        }
    }, [open, record]);

    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const sottocats = meta?.sottocategorie?.[f.categoria] || [];

    const submit = async () => {
        if (f.titolo.trim().length < 3) return toast.error("Inserisci un titolo (min 3 caratteri).");
        if (f.descrizione.trim().length < 10) return toast.error("La descrizione deve avere almeno 10 caratteri.");
        if (!f.categoria) return toast.error("Scegli una categoria.");
        if (f.zona.trim().length < 2) return toast.error("Inserisci la zona.");
        if (!(Number(f.prezzo) > 0)) return toast.error("Inserisci un prezzo valido.");
        if (f.telefono.trim().length < 5) return toast.error("Inserisci un numero di telefono per i contatti.");
        setBusy(true);
        try {
            const payload = {
                titolo: f.titolo.trim(), descrizione: f.descrizione.trim(), categoria: f.categoria,
                sottocategoria: f.sottocategoria || null, zona: f.zona.trim(), prezzo: Number(f.prezzo),
                stato: f.stato, telefono: f.telefono.trim(),
                immagine_url: f.immagine_url.trim() || undefined,
            };
            if (edit || currentId) {
                await api.put(`/annunci/${currentId}`, {
                    titolo: payload.titolo, descrizione: payload.descrizione, categoria: payload.categoria,
                    sottocategoria: payload.sottocategoria, zona: payload.zona, prezzo: payload.prezzo,
                    stato: payload.stato, telefono: payload.telefono,
                });
                toast.success("Annuncio aggiornato.");
            } else {
                const { data } = await api.post("/annunci/privato", payload);
                setCurrentId(data.id);
                setFoto(data.foto || []);
                toast.success("Prodotto pubblicato! Ora puoi aggiungere le foto.");
            }
            onSaved?.();
        } catch (e) { toast.error(formatApiError(e)); }
        finally { setBusy(false); }
    };

    const uploadFoto = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length || !currentId) return;
        setUploading(true);
        try {
            const fd = new FormData();
            files.forEach((file) => fd.append("files", file));
            const { data } = await api.post(`/annunci/${currentId}/foto`, fd);
            setFoto(data.foto || []); onSaved?.();
            toast.success("Foto caricate.");
        } catch (err) { toast.error(formatApiError(err)); }
        finally { setUploading(false); e.target.value = ""; }
    };

    const addFotoUrls = async (list) => {
        const urls = (list || []).map((u) => String(u).trim().replace(/^["']|["']$/g, "")).filter((u) => /^https?:\/\//i.test(u));
        if (!urls.length) return toast.error("Nessun URL valido trovato (usa http/https).");
        if (!currentId) return;
        setUploading(true);
        try {
            const { data } = await api.post(`/annunci/${currentId}/foto-url`, { urls });
            setFoto(data.foto || []); onSaved?.();
            const n = data.aggiunte || 0, errs = (data.errori || []).length;
            n ? toast.success(`${n} foto aggiunte${errs ? ` · ${errs} ignorate` : ""}.`) : toast.error(`Nessuna foto aggiunta${errs ? ` · ${errs} errori` : ""}.`);
            setUrlInput("");
        } catch (err) { toast.error(formatApiError(err)); }
        finally { setUploading(false); }
    };

    const onCsv = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => addFotoUrls(String(reader.result || "").split(/[\r\n,;]+/));
        reader.onerror = () => toast.error("Impossibile leggere il CSV.");
        reader.readAsText(file);
        e.target.value = "";
    };

    const delFoto = async (fid) => {
        try {
            const { data } = await api.delete(`/annunci/${currentId}/foto/${fid}`);
            setFoto(data.foto || []); onSaved?.();
        } catch (err) { toast.error(formatApiError(err)); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display font-black text-xl">{edit ? "Modifica annuncio" : "Vendi un prodotto"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-slate-300 text-xs">Titolo</Label>
                        <Input data-testid="vendi-titolo" value={f.titolo} onChange={(e) => set("titolo", e.target.value)} placeholder="Es. Tagliaerba a benzina usato" className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300 text-xs">Descrizione</Label>
                        <Textarea data-testid="vendi-descrizione" rows={3} value={f.descrizione} onChange={(e) => set("descrizione", e.target.value)} placeholder="Condizioni, anno, accessori inclusi…" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">Categoria</Label>
                            <Select value={f.categoria} onValueChange={(v) => { set("categoria", v); set("sottocategoria", ""); }}>
                                <SelectTrigger data-testid="vendi-categoria" className={inputCls}><SelectValue placeholder="Scegli" /></SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10 text-white">
                                    {(meta?.categorie || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">Sottocategoria</Label>
                            <Select value={f.sottocategoria} onValueChange={(v) => set("sottocategoria", v)} disabled={!sottocats.length}>
                                <SelectTrigger data-testid="vendi-sottocategoria" className={inputCls}><SelectValue placeholder="(facoltativa)" /></SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10 text-white">
                                    {sottocats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">Zona</Label>
                            <Input data-testid="vendi-zona" value={f.zona} onChange={(e) => set("zona", e.target.value)} placeholder="Es. Bologna" className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">Prezzo (€)</Label>
                            <Input data-testid="vendi-prezzo" type="number" min="1" value={f.prezzo} onChange={(e) => set("prezzo", e.target.value)} placeholder="180" className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">Stato</Label>
                            <Select value={f.stato} onValueChange={(v) => set("stato", v)}>
                                <SelectTrigger data-testid="vendi-stato" className={inputCls}><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10 text-white">
                                    {(meta?.stati_usato || []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-brand" /> Telefono</Label>
                            <Input data-testid="vendi-telefono" value={f.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+39 333 1234567" className={inputCls} />
                        </div>
                    </div>
                    {!currentId && (
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-xs">URL immagine (facoltativo, alternativa alle foto)</Label>
                            <Input data-testid="vendi-immagine-url" value={f.immagine_url} onChange={(e) => set("immagine_url", e.target.value)} placeholder="https://…/foto.jpg" className={inputCls} />
                        </div>
                    )}

                    {currentId && (
                        <div className="space-y-3 rounded-xl border border-white/10 p-3" data-testid="vendi-foto-section">
                            <Label className="text-slate-300 text-xs">Foto (max 10) — {foto.length}/10</Label>
                            <div className="flex flex-wrap gap-2">
                                {foto.map((p) => (
                                    <div key={p.id} className="relative">
                                        <img src={`${FILES_BASE}${p.path}`} alt="" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                                        <button type="button" onClick={() => delFoto(p.id)} data-testid={`vendi-foto-del-${p.id}`}
                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
                                    </div>
                                ))}
                                {foto.length < 10 && (
                                    <label className="h-16 w-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-brand" data-testid="vendi-foto-upload">
                                        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : <Upload className="h-5 w-5 text-slate-400" />}
                                        <input type="file" accept="image/*" multiple hidden onChange={uploadFoto} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            <div className="space-y-1.5 border-t border-white/10 pt-3">
                                <Label className="text-slate-300 text-xs flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5 text-brand" /> Aggiungi da URL (uno per riga o virgola)</Label>
                                <Textarea data-testid="vendi-foto-url-input" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} rows={2} placeholder={"https://.../foto1.jpg\nhttps://.../foto2.jpg"} className={inputCls} disabled={uploading || foto.length >= 10} />
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button type="button" size="sm" onClick={() => addFotoUrls(urlInput.split(/[\r\n,;]+/))} disabled={uploading || !urlInput.trim() || foto.length >= 10}
                                        data-testid="vendi-foto-url-add" className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                                        {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />} Aggiungi URL
                                    </Button>
                                    <label className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 cursor-pointer hover:border-brand hover:text-white ${(uploading || foto.length >= 10) ? "opacity-50 pointer-events-none" : ""}`} data-testid="vendi-foto-csv-upload">
                                        <FileUp className="h-4 w-4" /> Carica CSV di foto
                                        <input type="file" accept=".csv,text/csv,text/plain" hidden onChange={onCsv} disabled={uploading || foto.length >= 10} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-full border-white/20 text-white hover:bg-white/10">Chiudi</Button>
                        <Button type="button" onClick={submit} disabled={busy} data-testid="vendi-submit"
                            className="rounded-full bg-gradient-to-r from-orange-600 to-amber-500 hover:to-amber-400 text-white font-semibold">
                            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                            {currentId ? "Salva modifiche" : "Pubblica prodotto"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function VenditePrivato() {
    const [items, setItems] = useState(null);
    const [meta, setMeta] = useState(null);

    const load = useCallback(async () => {
        try {
            const [m, r] = await Promise.all([api.get("/annunci/meta"), api.get("/annunci/mine")]);
            setMeta(m.data);
            setItems(r.data || []);
        } catch (e) { toast.error(formatApiError(e)); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const elimina = async (id, titolo) => {
        if (!window.confirm(`Eliminare l'annuncio "${titolo}"?`)) return;
        try {
            await api.delete(`/annunci/${id}`);
            setItems((prev) => (prev || []).filter((x) => x.id !== id));
            toast.success("Annuncio eliminato.");
        } catch (e) { toast.error(formatApiError(e)); }
    };

    return (
        <div className="space-y-5" data-testid="dashboard-vendite">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">Vendi i tuoi prodotti usati. Gli acquirenti ti chiameranno al numero che indichi.</p>
                <VendiDialog meta={meta} onSaved={load} trigger={
                    <Button data-testid="vendi-nuovo-button" className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold shrink-0">
                        <Plus className="h-4 w-4 mr-1.5" /> Vendi un prodotto
                    </Button>
                } />
            </div>

            {items && items.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-10 text-center" data-testid="dashboard-vendite-empty">
                    <Tag className="h-10 w-10 text-slate-500 mx-auto" />
                    <h3 className="mt-4 font-display font-bold text-white text-lg">Nessun prodotto in vendita</h3>
                    <p className="mt-1 text-sm text-slate-400">Pubblica il tuo primo annuncio: è gratuito e lo vedranno tutti nel Mercatino.</p>
                </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
                {(items || []).map((a) => (
                    <div key={a.id} className="rounded-2xl border border-white/10 bg-navy-700/60 overflow-hidden flex flex-col" data-testid={`vendita-card-${a.id}`}>
                        <img src={annuncioImg(a)} alt={a.titolo} className="h-36 w-full object-cover" />
                        <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-display font-bold text-white">{a.titolo}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-brand" /> {a.zona}</span>
                                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5">{a.categoria}</span>
                            </div>
                            <p className="mt-2 font-display font-black text-brand text-lg">{prezzoLabel(a)}</p>
                            <div className="mt-auto pt-3 flex items-center gap-2">
                                <VendiDialog meta={meta} record={a} onSaved={load} trigger={
                                    <Button size="sm" variant="outline" data-testid={`vendita-edit-${a.id}`} className="rounded-full border-white/20 text-white hover:bg-white/10">
                                        <Pencil className="h-3.5 w-3.5 mr-1" /> Modifica
                                    </Button>
                                } />
                                <Button size="sm" variant="outline" onClick={() => elimina(a.id, a.titolo)} data-testid={`vendita-delete-${a.id}`}
                                    className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Elimina
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
