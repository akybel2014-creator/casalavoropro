import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Siren, Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { SERVICE_CATEGORIES } from "@/components/landing/CategoryGrid";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

export default function NuovaRichiesta() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        titolo: params.get("titolo") || "",
        categoria: params.get("categoria") || "",
        zona: params.get("zona") || "",
        budget: "",
        descrizione: params.get("descrizione") || "",
        urgente: false,
    });
    const [photos, setPhotos] = useState([]); // Array di { id, file, previewUrl, name, size, base64 }
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    // Ripristino dati salvati da ricerca homepage o sessione precedente
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("clpro_pending_richiesta");
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved) {
                    setForm((f) => ({
                        ...f,
                        titolo: saved.cosa ? `Richiesta: ${saved.cosa}` : (saved.descrizione?.slice(0, 50) || f.titolo),
                        categoria: saved.cosa ? (SERVICE_CATEGORIES.find((c) => c.toLowerCase() === saved.cosa.toLowerCase()) || f.categoria) : f.categoria,
                        zona: saved.dove || f.zona,
                        descrizione: saved.descrizione || f.descrizione,
                    }));

                    if (saved.foto_base64 && Array.isArray(saved.foto_base64)) {
                        const restored = saved.foto_base64.map((item, idx) => ({
                            id: `restored-${idx}-${Date.now()}`,
                            previewUrl: item.data,
                            name: item.name || `foto-${idx + 1}.jpg`,
                            size: item.size || 0,
                            base64Data: item,
                        }));
                        setPhotos(restored);
                    }
                    sessionStorage.removeItem("clpro_pending_richiesta");
                    toast.info("Dati e foto recuperati dal modulo di ricerca della homepage!");
                }
            }
        } catch {
            // ignore
        }
    }, []);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (photos.length + files.length > 4) {
            toast.error("Puoi allegare al massimo 4 foto in totale");
            return;
        }

        const validPhotos = [];
        for (const file of files) {
            if (!ALLOWED_MIMES.includes(file.type)) {
                toast.error(`Il formato di ${file.name} non è supportato. Usa JPG, PNG o WEBP`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`La foto ${file.name} è troppo grande (massimo 5 MB)`);
                continue;
            }
            validPhotos.push({
                id: `photo-${Date.now()}-${Math.random()}`,
                file,
                previewUrl: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            });
        }

        setPhotos((prev) => [...prev, ...validPhotos].slice(0, 4));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removePhoto = (id) => {
        setPhotos((prev) => {
            const removed = prev.find((p) => p.id === id);
            if (removed?.previewUrl && removed.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(removed.previewUrl);
            }
            return prev.filter((p) => p.id !== id);
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const fd = new FormData();
            fd.append("titolo", form.titolo);
            fd.append("categoria", form.categoria || "Altri Servizi");
            fd.append("zona", form.zona);
            fd.append("budget", form.budget || "");
            fd.append("descrizione", form.descrizione);
            fd.append("urgente", form.urgente ? "true" : "false");

            // Allega file reali
            photos.forEach((p) => {
                if (p.file) fd.append("files", p.file);
            });

            // Allega eventuali foto ripristinate da base64
            const base64List = photos.filter((p) => p.base64Data).map((p) => p.base64Data);
            if (base64List.length > 0) {
                fd.append("foto_base64", JSON.stringify(base64List));
            }

            await api.post("/richieste", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success(
                form.urgente
                    ? "Richiesta urgente inviata! Le aziende con Emergenze 24/7 sono state avvisate subito."
                    : "Richiesta inviata! Le aziende della tua zona sono state avvisate."
            );
            navigate("/area-privato");
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy grid-pattern px-4 pt-32 pb-24">
            <div className="max-w-2xl mx-auto">
                <h1 className="font-display font-black text-3xl text-white tracking-tight">Nuova richiesta di preventivo</h1>
                <p className="mt-2 text-sm text-slate-400">
                    Ciao {user?.name}, descrivi il lavoro: le aziende verificate della tua zona ti invieranno preventivi gratuiti.
                </p>

                <form onSubmit={submit} data-testid="nuova-richiesta-form" className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Titolo della richiesta</Label>
                        <Input required minLength={3} data-testid="richiesta-titolo-input" value={form.titolo} onChange={set("titolo")}
                            placeholder="Es. Sostituzione caldaia in appartamento" className={inputCls} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Categoria</Label>
                            <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                                <SelectTrigger data-testid="richiesta-categoria-select" className={`w-full rounded-xl ${inputCls}`}>
                                    <SelectValue placeholder="Scegli categoria" />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10 max-h-60">
                                    {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Zona</Label>
                            <Input required data-testid="richiesta-zona-input" value={form.zona} onChange={set("zona")} placeholder="Città o provincia" className={inputCls} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Budget indicativo (opzionale)</Label>
                        <Input data-testid="richiesta-budget-input" value={form.budget} onChange={set("budget")} placeholder="Es. 1.000 - 2.000 EUR" className={inputCls} />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Descrizione del lavoro</Label>
                        <Textarea required minLength={5} rows={4} data-testid="richiesta-descrizione-input" value={form.descrizione} onChange={set("descrizione")}
                            placeholder="Racconta cosa serve: ambiente, urgenza, materiali, tempistiche…" className={inputCls} />
                    </div>

                    {/* Caricamento Foto */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300 flex items-center gap-1.5">
                                <Camera className="h-4 w-4 text-brand" />
                                Foto del lavoro (facoltative, max 4)
                            </Label>
                            <span className="text-xs text-slate-400">
                                {photos.length}/4 foto allegate
                            </span>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            data-testid="richiesta-photo-input"
                        />

                        {photos.length < 4 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                data-testid="richiesta-photo-upload-button"
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-brand/60 bg-navy/40 hover:bg-navy/70 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
                            >
                                <ImagePlus className="h-4 w-4 text-brand" />
                                <span>{photos.length === 0 ? "Carica foto del lavoro (JPG, PNG o WEBP fino a 5 MB)" : "Aggiungi altra foto"}</span>
                            </button>
                        )}

                        {photos.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {photos.map((p, idx) => (
                                    <div
                                        key={p.id}
                                        className="relative group rounded-xl border border-white/10 bg-navy p-2 flex items-center gap-2"
                                    >
                                        <img
                                            src={p.previewUrl}
                                            alt={p.name}
                                            className="h-12 w-12 rounded-lg object-cover bg-navy-800 shrink-0"
                                        />
                                        <div className="min-w-0 flex-1 pr-5">
                                            <p className="text-xs font-medium text-white truncate">{p.name}</p>
                                            {p.size > 0 && (
                                                <p className="text-[10px] text-slate-400">{(p.size / (1024 * 1024)).toFixed(1)} MB</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(p.id)}
                                            title="Rimuovi foto"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-brand/40 bg-brand/10 p-4 cursor-pointer" data-testid="richiesta-urgente-box">
                        <input
                            type="checkbox"
                            data-testid="richiesta-urgente-checkbox"
                            checked={!!form.urgente}
                            onChange={(e) => setForm((f) => ({ ...f, urgente: e.target.checked }))}
                            className="mt-0.5 h-4 w-4 accent-[#FF5A1F]"
                        />
                        <span>
                            <span className="flex items-center gap-2 text-sm font-semibold text-brand">
                                <Siren className="h-4 w-4" /> È un'emergenza urgente
                            </span>
                            <span className="block mt-1 text-xs text-slate-400">
                                Le aziende con Emergenze 24/7 della tua categoria riceveranno subito un avviso WhatsApp e potranno intervenire in giornata.
                            </span>
                        </span>
                    </label>

                    {error && <p className="text-sm text-red-400" data-testid="richiesta-error">{error}</p>}

                    <Button type="submit" disabled={busy} data-testid="richiesta-submit-button"
                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25 h-12">
                        {busy ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Invio richiesta in corso...
                            </span>
                        ) : form.urgente ? "Invia richiesta urgente" : "Invia richiesta gratuita"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
