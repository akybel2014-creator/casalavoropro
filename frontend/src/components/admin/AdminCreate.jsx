import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Building2, Truck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { api, formatApiError } from "@/lib/api";
import { SERVICE_CATEGORIES } from "@/components/landing/CategoryGrid";

const FILES_BASE = `${process.env.REACT_APP_BACKEND_URL}/api/files/`;
const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";
const selectCls = "w-full rounded-xl bg-navy/70 border border-white/10 text-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function CreaAziendaDialog({ record, trigger, onCreated }) {
    const edit = !!record;
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [f, setF] = useState({ nome: "", zone: "", piva: "", telefono: "", sito: "", logo: "", descrizione: "", rating: "", recensioni: "", verified: true });
    const [cats, setCats] = useState([]);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
    const toggleCat = (c) => setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

    useEffect(() => {
        if (open && edit) {
            setF({
                nome: record.nome || "", zone: (record.zone || []).join(", "), piva: record.piva || "",
                telefono: record.telefono || "", sito: record.sito || "", logo: record.logo || "",
                descrizione: record.descrizione || "", rating: record.rating ?? "", recensioni: record.recensioni ?? "",
                verified: !!record.verified,
            });
            setCats(record.categorie || []);
        }
    }, [open, edit, record]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = {
                nome: f.nome, categorie: cats,
                zone: f.zone.split(",").map((z) => z.trim()).filter(Boolean),
                piva: f.piva, telefono: f.telefono, sito: f.sito, logo: f.logo, descrizione: f.descrizione,
                rating: f.rating ? parseFloat(f.rating) : 0,
                recensioni: f.recensioni ? parseInt(f.recensioni, 10) : 0,
                verified: f.verified,
            };
            if (edit) await api.put(`/admin/aziende/${record.id}`, payload);
            else await api.post("/admin/aziende", payload);
            toast.success(edit ? "Azienda aggiornata." : "Azienda aggiunta alla directory.");
            setOpen(false);
            if (!edit) { setF({ nome: "", zone: "", piva: "", telefono: "", sito: "", logo: "", descrizione: "", rating: "", recensioni: "", verified: true }); setCats([]); }
            onCreated?.();
        } catch (err) { toast.error(formatApiError(err)); }
        finally { setBusy(false); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" data-testid="admin-add-azienda-button" className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                        <Plus className="h-4 w-4 mr-1" /> Aggiungi azienda
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-h-[90vh] overflow-y-auto" data-testid="admin-azienda-dialog">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2"><Building2 className="h-5 w-5 text-brand" /> {edit ? "Modifica azienda" : "Nuova azienda"}</DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">Gestione manuale della directory.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4" data-testid="admin-azienda-form">
                    <div className="space-y-1.5">
                        <Label className="text-slate-300 text-xs">Nome azienda *</Label>
                        <Input required data-testid="azienda-nome-input" value={f.nome} onChange={set("nome")} placeholder="EdilNuova Srl" className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300 text-xs">Categorie</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {SERVICE_CATEGORIES.map((c) => (
                                <button key={c} type="button" onClick={() => toggleCat(c)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${cats.includes(c) ? "border-brand bg-brand/15 text-brand" : "border-white/15 text-slate-400 hover:text-white"}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Zone (virgola)</Label>
                            <Input data-testid="azienda-zone-input" value={f.zone} onChange={set("zone")} placeholder="Milano, Monza" className={inputCls} /></div>
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Partita IVA</Label>
                            <Input data-testid="azienda-piva-input" value={f.piva} onChange={set("piva")} placeholder="IT0123..." className={inputCls} /></div>
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Telefono</Label>
                            <Input data-testid="azienda-telefono-input" value={f.telefono} onChange={set("telefono")} placeholder="+39 ..." className={inputCls} /></div>
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Sito web</Label>
                            <Input data-testid="azienda-sito-input" value={f.sito} onChange={set("sito")} placeholder="https://..." className={inputCls} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-slate-300 text-xs">URL logo</Label>
                        <Input data-testid="azienda-logo-input" value={f.logo} onChange={set("logo")} placeholder="https://.../logo.webp" className={inputCls} /></div>
                    <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Descrizione</Label>
                        <Textarea data-testid="azienda-descrizione-input" value={f.descrizione} onChange={set("descrizione")} rows={2} className={inputCls} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Rating (0-5)</Label>
                            <Input type="number" step="0.1" min="0" max="5" data-testid="azienda-rating-input" value={f.rating} onChange={set("rating")} placeholder="4.8" className={inputCls} /></div>
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">N. recensioni</Label>
                            <Input type="number" min="0" data-testid="azienda-recensioni-input" value={f.recensioni} onChange={set("recensioni")} placeholder="42" className={inputCls} /></div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" data-testid="azienda-verified-input" checked={f.verified} onChange={(e) => setF((s) => ({ ...s, verified: e.target.checked }))} className="h-4 w-4 accent-brand" />
                        Azienda verificata (visibile nella prova sociale)
                    </label>
                    <Button type="submit" disabled={busy} data-testid="azienda-submit-button" className="w-full rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold">
                        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} {edit ? "Salva modifiche" : "Crea azienda"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function CreaAnnuncioDialog({ aziende, record, trigger, onCreated }) {
    const edit = !!record;
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [meta, setMeta] = useState({ categorie: [], sottocategorie: {}, unita: [], stati_usato: [] });
    const [foto, setFoto] = useState([]);
    const [f, setF] = useState({ tipo: "noleggio", titolo: "", descrizione: "", categoria: "", sottocategoria: "", zona: "", prezzo: "", unita: "giorno", stato: "", immagine_url: "", azienda_id: "" });
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

    useEffect(() => {
        if (!open) return;
        if (meta.categorie.length === 0) api.get("/annunci/meta").then(({ data }) => setMeta(data)).catch(() => {});
        if (edit) {
            setF({
                tipo: record.tipo || "noleggio", titolo: record.titolo || "", descrizione: record.descrizione || "",
                categoria: record.categoria || "", sottocategoria: record.sottocategoria || "", zona: record.zona || "",
                prezzo: record.prezzo ?? "", unita: record.unita || "giorno", stato: record.stato || "",
                immagine_url: record.immagine_url || "", azienda_id: record.azienda_id || "",
            });
            setFoto(record.foto || []);
        }
    }, [open, edit, record, meta.categorie.length]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (edit) {
                await api.put(`/admin/annunci/${record.id}`, {
                    titolo: f.titolo, descrizione: f.descrizione, categoria: f.categoria,
                    sottocategoria: f.sottocategoria || null, zona: f.zona, prezzo: parseFloat(f.prezzo),
                    unita: f.tipo === "usato" ? undefined : f.unita, stato: f.tipo === "usato" ? (f.stato || "Buono") : undefined,
                    immagine_url: f.immagine_url,
                });
            } else {
                await api.post("/admin/annunci", {
                    tipo: f.tipo, titolo: f.titolo, descrizione: f.descrizione, categoria: f.categoria,
                    sottocategoria: f.sottocategoria || null, zona: f.zona, prezzo: parseFloat(f.prezzo),
                    unita: f.tipo === "usato" ? "fisso" : f.unita, stato: f.tipo === "usato" ? (f.stato || "Buono") : null,
                    immagine_url: f.immagine_url, azienda_id: f.azienda_id || null,
                });
            }
            toast.success(edit ? "Macchinario aggiornato." : "Macchinario aggiunto al marketplace.");
            setOpen(false);
            if (!edit) setF({ tipo: "noleggio", titolo: "", descrizione: "", categoria: "", sottocategoria: "", zona: "", prezzo: "", unita: "giorno", stato: "", immagine_url: "", azienda_id: "" });
            onCreated?.();
        } catch (err) { toast.error(formatApiError(err)); }
        finally { setBusy(false); }
    };

    const uploadFoto = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            const fd = new FormData();
            files.forEach((file) => fd.append("files", file));
            const { data } = await api.post(`/admin/annunci/${record.id}/foto`, fd);
            setFoto(data.foto || []);
            toast.success("Foto caricate.");
            onCreated?.();
        } catch (err) { toast.error(formatApiError(err)); }
        finally { setUploading(false); e.target.value = ""; }
    };

    const delFoto = async (fid) => {
        try {
            const { data } = await api.delete(`/annunci/${record.id}/foto/${fid}`).catch(() => ({ data: null }));
            if (data) setFoto(data.foto || []);
            else setFoto((fs) => fs.filter((x) => x.id !== fid));
            onCreated?.();
        } catch (err) { toast.error(formatApiError(err)); }
    };

    const subs = f.categoria ? (meta.sottocategorie[f.categoria] || []) : [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" data-testid="admin-add-annuncio-button" className="rounded-full bg-brand hover:bg-brand-dark text-white font-semibold">
                        <Plus className="h-4 w-4 mr-1" /> Aggiungi macchinario
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-h-[90vh] overflow-y-auto" data-testid="admin-annuncio-dialog">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2"><Truck className="h-5 w-5 text-brand" /> {edit ? "Modifica macchinario" : "Nuovo macchinario"}</DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">Marketplace (noleggio o usato).</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4" data-testid="admin-annuncio-form">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Tipo *</Label>
                            <select value={f.tipo} onChange={set("tipo")} disabled={edit} data-testid="annuncio-tipo-input" className={selectCls}>
                                <option value="noleggio">Noleggio</option><option value="usato">Usato (vendita)</option>
                            </select></div>
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Zona *</Label>
                            <Input required data-testid="annuncio-zona-input" value={f.zona} onChange={set("zona")} placeholder="Milano" className={inputCls} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Titolo *</Label>
                        <Input required minLength={3} data-testid="annuncio-titolo-input" value={f.titolo} onChange={set("titolo")} placeholder="Escavatore 3t" className={inputCls} /></div>
                    <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Descrizione *</Label>
                        <Textarea required minLength={10} data-testid="annuncio-descrizione-input" value={f.descrizione} onChange={set("descrizione")} rows={2} className={inputCls} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Categoria *</Label>
                            <select required value={f.categoria} onChange={(e) => setF((s) => ({ ...s, categoria: e.target.value, sottocategoria: "" }))} data-testid="annuncio-categoria-input" className={selectCls}>
                                <option value="">Seleziona…</option>
                                {meta.categorie.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select></div>
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Sottocategoria</Label>
                            <select value={f.sottocategoria} onChange={set("sottocategoria")} data-testid="annuncio-sottocategoria-input" className={selectCls} disabled={!subs.length}>
                                <option value="">—</option>
                                {subs.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select></div>
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Prezzo (€) *</Label>
                            <Input required type="number" step="0.01" min="0.01" data-testid="annuncio-prezzo-input" value={f.prezzo} onChange={set("prezzo")} placeholder="120" className={inputCls} /></div>
                        {f.tipo === "noleggio" ? (
                            <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Unità</Label>
                                <select value={f.unita} onChange={set("unita")} data-testid="annuncio-unita-input" className={selectCls}>
                                    {(meta.unita.length ? meta.unita : ["giorno", "settimana", "mese"]).filter((u) => u !== "fisso").map((u) => <option key={u} value={u}>al {u}</option>)}
                                </select></div>
                        ) : (
                            <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Stato</Label>
                                <select value={f.stato} onChange={set("stato")} data-testid="annuncio-stato-input" className={selectCls}>
                                    <option value="">Buono</option>
                                    {meta.stati_usato.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select></div>
                        )}
                    </div>
                    <div className="space-y-1.5"><Label className="text-slate-300 text-xs">URL immagine (alternativa alle foto)</Label>
                        <Input data-testid="annuncio-immagine-input" value={f.immagine_url} onChange={set("immagine_url")} placeholder="https://.../foto.jpg" className={inputCls} /></div>
                    {!edit && (
                        <div className="space-y-1.5"><Label className="text-slate-300 text-xs">Azienda (opzionale)</Label>
                            <select value={f.azienda_id} onChange={set("azienda_id")} data-testid="annuncio-azienda-input" className={selectCls}>
                                <option value="">Nessuna / inserimento piattaforma</option>
                                {(aziende || []).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                            </select></div>
                    )}
                    {edit && (
                        <div className="space-y-2 rounded-xl border border-white/10 p-3" data-testid="annuncio-foto-section">
                            <Label className="text-slate-300 text-xs">Foto (max 4) — caricamento diretto</Label>
                            <div className="flex flex-wrap gap-2">
                                {foto.map((p) => (
                                    <div key={p.id} className="relative">
                                        <img src={`${FILES_BASE}${p.path}`} alt="" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                                        <button type="button" onClick={() => delFoto(p.id)} data-testid={`annuncio-foto-del-${p.id}`}
                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
                                    </div>
                                ))}
                                {foto.length < 4 && (
                                    <label className="h-16 w-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-brand" data-testid="annuncio-foto-upload">
                                        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : <Upload className="h-5 w-5 text-slate-400" />}
                                        <input type="file" accept="image/*" multiple hidden onChange={uploadFoto} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                    <Button type="submit" disabled={busy} data-testid="annuncio-submit-button" className="w-full rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold">
                        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} {edit ? "Salva modifiche" : "Crea macchinario"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
