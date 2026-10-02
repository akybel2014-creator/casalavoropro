import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { CATEGORIES } from "@/components/landing/CategoryGrid";

export default function NuovaRichiesta() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user } = useAuth();
    const [form, setForm] = useState({
        titolo: "",
        categoria: params.get("categoria") || "",
        zona: params.get("zona") || "",
        budget: "",
        descrizione: "",
        urgente: false,
    });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const inputCls = "bg-navy/70 border-white/10 text-white placeholder:text-slate-500";

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            await api.post("/richieste", { ...form, urgente: !!form.urgente });
            toast.success(form.urgente
                ? "Richiesta urgente inviata! Le aziende con Emergenze 24/7 sono state avvisate subito."
                : "Richiesta inviata! Le aziende della tua zona sono state avvisate.");
            navigate("/dashboard");
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy grid-pattern px-4 py-24">
            <div className="max-w-2xl mx-auto">
                <h1 className="font-display font-black text-3xl text-white tracking-tight">Nuova richiesta di preventivo</h1>
                <p className="mt-2 text-sm text-slate-400">
                    Ciao {user?.name}, descrivi il lavoro: le aziende verificate della tua zona ti invieranno preventivi gratuiti.
                </p>

                <form onSubmit={submit} data-testid="nuova-richiesta-form" className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Titolo della richiesta</Label>
                        <Input required minLength={5} data-testid="richiesta-titolo-input" value={form.titolo} onChange={set("titolo")}
                            placeholder="Es. Sostituzione caldaia in appartamento" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Categoria</Label>
                            <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                                <SelectTrigger data-testid="richiesta-categoria-select" className={`w-full rounded-xl ${inputCls}`}>
                                    <SelectValue placeholder="Scegli categoria" />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    {CATEGORIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
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
                        <Textarea required minLength={10} rows={5} data-testid="richiesta-descrizione-input" value={form.descrizione} onChange={set("descrizione")}
                            placeholder="Racconta cosa serve: ambiente, urgenza, materiali, tempistiche…" className={inputCls} />
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
                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                        {busy ? "Invio…" : form.urgente ? "Invia richiesta urgente" : "Invia richiesta gratuita"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
