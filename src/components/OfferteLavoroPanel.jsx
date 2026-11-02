import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Briefcase, MapPin, Euro, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api, formatApiError } from "@/lib/api";
import { ProUpsell } from "@/components/ProUpsell";

const inputCls = "bg-navy/80 border-white/10 text-white placeholder:text-slate-500";
const EMPTY = { titolo: "", descrizione: "", zona: "", tipo_contratto: "Full-time", retribuzione: "", contatto_email: "", contatto_telefono: "", attivo: true };

function toForm(o, zonaDefault) {
    if (!o) return { ...EMPTY, zona: zonaDefault || "" };
    return {
        titolo: o.titolo, descrizione: o.descrizione, zona: o.zona, tipo_contratto: o.tipo_contratto,
        retribuzione: o.retribuzione || "", contatto_email: o.contatto_email || "",
        contatto_telefono: o.contatto_telefono || "", attivo: o.attivo !== false,
    };
}

function OffertaDialog({ tipiContratto, zonaDefault, offerta, onSaved }) {
    const editing = !!offerta;
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(() => toForm(offerta, zonaDefault));
    const [busy, setBusy] = useState(false);
    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

    const openChange = (v) => { setOpen(v); if (v) setForm(toForm(offerta, zonaDefault)); };

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const body = { ...form };
            if (editing) {
                const { data } = await api.put(`/offerte-lavoro/${offerta.id}`, body);
                toast.success("Offerta aggiornata!");
                setOpen(false);
                onSaved(data, "update");
            } else {
                const { data } = await api.post("/offerte-lavoro", body);
                toast.success("Offerta di lavoro pubblicata!");
                setOpen(false);
                setForm({ ...EMPTY, zona: zonaDefault || "" });
                onSaved(data, "create");
            }
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
                    <Button size="icon" variant="ghost" data-testid={`offerta-edit-${offerta.id}`} aria-label="Modifica offerta" className="text-slate-400 hover:text-white hover:bg-white/5">
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button data-testid="offerta-new-button" className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                        <Plus className="h-4 w-4 mr-1.5" /> Nuova offerta di lavoro
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white max-h-[90vh] overflow-y-auto" data-testid={editing ? `offerta-edit-dialog-${offerta.id}` : "offerta-dialog"}>
                <DialogHeader><DialogTitle className="font-display">{editing ? "Modifica offerta" : "Pubblica un'offerta di lavoro"}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4" data-testid="offerta-form">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Titolo</Label>
                        <Input required minLength={3} value={form.titolo} onChange={(e) => set("titolo")(e.target.value)} data-testid="offerta-titolo-input" placeholder="Es. Cercasi idraulico esperto" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Zona</Label>
                            <Input required value={form.zona} onChange={(e) => set("zona")(e.target.value)} data-testid="offerta-zona-input" placeholder="Città o provincia" className={inputCls} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Tipo di contratto</Label>
                            <Select value={form.tipo_contratto} onValueChange={set("tipo_contratto")}>
                                <SelectTrigger data-testid="offerta-contratto-select" className={inputCls}><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    {tipiContratto.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Retribuzione (facoltativa)</Label>
                        <Input value={form.retribuzione} onChange={(e) => set("retribuzione")(e.target.value)} data-testid="offerta-retribuzione-input" placeholder="Es. 1.500 - 1.800 € / mese" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Email di contatto</Label>
                            <Input type="email" value={form.contatto_email} onChange={(e) => set("contatto_email")(e.target.value)} data-testid="offerta-email-input" placeholder="lavoro@tuaazienda.it" className={inputCls} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Telefono di contatto</Label>
                            <Input value={form.contatto_telefono} onChange={(e) => set("contatto_telefono")(e.target.value)} data-testid="offerta-telefono-input" placeholder="+39 ..." className={inputCls} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Descrizione</Label>
                        <Textarea required minLength={10} rows={4} value={form.descrizione} onChange={(e) => set("descrizione")(e.target.value)} data-testid="offerta-descrizione-input"
                            placeholder="Mansioni, requisiti, esperienza richiesta, orario, come candidarsi…" className={inputCls} />
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch checked={form.attivo} onCheckedChange={set("attivo")} data-testid="offerta-attivo-switch" />
                        <span className="text-sm text-slate-300">Offerta attiva (visibile sul profilo pubblico)</span>
                    </div>
                    <Button type="submit" disabled={busy} data-testid="offerta-submit-button"
                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold">
                        {editing ? "Salva modifiche" : "Pubblica offerta"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function OfferteLavoroPanel({ azienda, isPro = false, onGoToAbbonamento }) {
    const [items, setItems] = useState(null);
    const [tipiContratto, setTipiContratto] = useState(["Full-time", "Part-time", "Stagionale", "Apprendistato", "A chiamata", "Tirocinio"]);
    const zonaDefault = azienda?.zone?.[0] || "";

    const load = async () => {
        try {
            const { data } = await api.get("/offerte-lavoro/mine");
            setItems(data);
        } catch {
            setItems([]);
        }
    };

    useEffect(() => {
        if (!isPro) return;
        api.get("/offerte-lavoro/meta").then(({ data }) => setTipiContratto(data.tipi_contratto)).catch(() => {});
        load();
    }, [isPro]);

    const onSaved = (saved, mode) => {
        setItems((list) => {
            const arr = list || [];
            if (mode === "create") return [saved, ...arr];
            return arr.map((o) => (o.id === saved.id ? saved : o));
        });
    };

    const remove = async (id) => {
        try {
            await api.delete(`/offerte-lavoro/${id}`);
            setItems((list) => (list || []).filter((o) => o.id !== id));
            toast.success("Offerta eliminata");
        } catch (err) {
            toast.error(formatApiError(err));
        }
    };

    if (!isPro) {
        return (
            <ProUpsell
                testid="offerte-lavoro-upsell"
                title="Offerte di lavoro riservate al piano PRO"
                desc="Con l'abbonamento PRO pubblichi tutte le posizioni aperte della tua azienda: appariranno sul tuo profilo pubblico e raggiungeranno gli operai della tua zona."
                bullets={[
                    "Offerte di lavoro illimitate",
                    "Visibili sul profilo pubblico e nella bacheca lavoro",
                    "Gestione contatti e candidature",
                ]}
                onGoToAbbonamento={onGoToAbbonamento}
            />
        );
    }

    return (
        <div className="space-y-5" data-testid="offerte-lavoro-panel">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="font-display font-bold text-white text-lg">Offerte di lavoro</h3>
                    <p className="text-sm text-slate-400">Pubblica le posizioni aperte della tua azienda: appariranno sul tuo profilo pubblico.</p>
                </div>
                <OffertaDialog tipiContratto={tipiContratto} zonaDefault={zonaDefault} onSaved={onSaved} />
            </div>

            {!items && <p className="text-slate-400" data-testid="offerte-loading">Caricamento…</p>}
            {items && items.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-10 text-center" data-testid="offerte-empty">
                    <Briefcase className="h-10 w-10 text-slate-500 mx-auto" />
                    <h4 className="mt-4 font-display font-bold text-white">Nessuna offerta pubblicata</h4>
                    <p className="mt-1 text-sm text-slate-400">Crea la tua prima offerta di lavoro per trovare nuovi collaboratori.</p>
                </div>
            )}
            {items && items.length > 0 && (
                <div className="space-y-3" data-testid="offerte-list">
                    {items.map((o) => (
                        <div key={o.id} data-testid={`offerta-item-${o.id}`} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-display font-bold text-white">{o.titolo}</h4>
                                        <span className="rounded-full bg-brand/15 text-brand text-xs font-semibold px-2 py-0.5">{o.tipo_contratto}</span>
                                        {o.attivo === false && <span className="rounded-full bg-white/10 text-slate-400 text-xs px-2 py-0.5">Non attiva</span>}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">{o.descrizione}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" /> {o.zona}</span>
                                        {o.retribuzione && <span className="flex items-center gap-1"><Euro className="h-3.5 w-3.5 text-brand" /> {o.retribuzione}</span>}
                                        {o.contatto_email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-brand" /> {o.contatto_email}</span>}
                                        {o.contatto_telefono && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-brand" /> {o.contatto_telefono}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <OffertaDialog tipiContratto={tipiContratto} zonaDefault={zonaDefault} offerta={o} onSaved={onSaved} />
                                    <Button size="icon" variant="ghost" onClick={() => remove(o.id)} data-testid={`offerta-delete-${o.id}`} aria-label="Elimina offerta" className="text-slate-400 hover:text-red-400 hover:bg-white/5">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OfferteLavoroPanel;
