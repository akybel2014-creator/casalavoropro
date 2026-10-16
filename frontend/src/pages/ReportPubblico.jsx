import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    TrendingDown, Zap, Building2, Loader2, CheckCircle2, ShieldCheck, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatApiError } from "@/lib/api";

const fmtNum = (n) => (n == null ? "—" : new Intl.NumberFormat("it-IT").format(n));
const fmtEur = (n) => (n == null ? "—" : `€${Number(n).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);

export default function ReportPubblico() {
    const { token } = useParams();
    const [state, setState] = useState("loading"); // loading | ready | notfound
    const [report, setReport] = useState(null);
    const [form, setForm] = useState({ nome: "", telefono: "", email: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data } = await api.get(`/report/pubblico/${token}`);
                if (alive) { setReport(data); setState("ready"); }
            } catch {
                if (alive) setState("notfound");
            }
        })();
        return () => { alive = false; };
    }, [token]);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim() || !form.telefono.trim()) {
            toast.error("Inserisci nome e telefono");
            return;
        }
        setSending(true);
        try {
            await api.post(`/report/pubblico/${token}/richiedi`, form);
            setSent(true);
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setSending(false);
        }
    };

    if (state === "loading") {
        return (
            <div className="min-h-[70vh] flex items-center justify-center" data-testid="report-pubblico-loading">
                <Loader2 className="h-8 w-8 text-brand animate-spin" />
            </div>
        );
    }

    if (state === "notfound") {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4" data-testid="report-pubblico-notfound">
                <h1 className="font-display font-black text-3xl text-white">Report non disponibile</h1>
                <p className="mt-3 text-sm text-slate-400 max-w-md">Il link potrebbe essere scaduto o non valido. Chiedi di generarne uno nuovo.</p>
                <a href="/" className="mt-6 text-brand font-semibold hover:underline">Vai a CasaLavoroPRO</a>
            </div>
        );
    }

    const r = report || {};

    return (
        <div className="min-h-[70vh] max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14" data-testid="report-pubblico-page">
            <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand">
                    <Sparkles className="h-3.5 w-3.5" /> Report di Risparmio Energetico
                </span>
                <h1 className="mt-4 font-display font-black text-4xl sm:text-5xl text-white tracking-tight">
                    {r.cliente_nome ? `Il risparmio stimato di ${r.cliente_nome}` : "Analisi di risparmio energetico"}
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                    Stima generata dall'assistente AI di CasaLavoroPRO sugli indici PUN/PSV correnti del mercato italiano.
                </p>
            </div>

            {/* Box risparmio */}
            <div
                className="relative overflow-hidden rounded-3xl border-2 p-8 sm:p-10 text-center mt-10"
                style={{ backgroundColor: "rgba(255,122,0,0.10)", borderColor: "#FF7A00" }}
                data-testid="report-pubblico-risparmio">
                <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-brand/25 blur-3xl" aria-hidden="true" />
                <div className="relative">
                    <div className="inline-flex items-center gap-2 text-amber-300 text-sm font-semibold">
                        <TrendingDown className="h-5 w-5" /> Risparmio stimato annuo
                    </div>
                    <p className="mt-2 font-display font-black text-5xl sm:text-6xl text-white">
                        {fmtEur(r.risparmio_stimato_annuo)} <span className="text-2xl sm:text-3xl text-amber-300">/ anno</span>
                    </p>
                    {r.note && <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto">{r.note}</p>}
                </div>
            </div>

            {/* Dati */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-navy-700/70 p-5" data-testid="report-pubblico-fornitore">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold"><Building2 className="h-4 w-4" /> FORNITORE ATTUALE</div>
                    <p className="mt-2 font-display font-bold text-white text-xl break-words">{r.fornitore || "—"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-navy-700/70 p-5" data-testid="report-pubblico-consumo">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold"><Zap className="h-4 w-4" /> CONSUMO ANNUO STIMATO</div>
                    <p className="mt-2 font-display font-bold text-white text-xl">{fmtNum(r.consumo_annuo)} <span className="text-base text-slate-400">{r.unita_consumo || ""}</span></p>
                </div>
            </div>

            {/* CTA / Form */}
            {sent ? (
                <div className="mt-8 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center" data-testid="report-pubblico-success">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                    <p className="mt-4 font-display font-bold text-white text-lg">Richiesta inviata!</p>
                    <p className="mt-2 text-sm text-slate-300">Un consulente dedicato ti contatterà a breve per attivare la tua offerta.</p>
                </div>
            ) : (
                <div className="mt-8 rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8" data-testid="report-pubblico-form-card">
                    <h2 className="font-display font-bold text-white text-xl">Richiedi la tua offerta personalizzata</h2>
                    <p className="mt-1 text-sm text-slate-400">Lascia i tuoi contatti: ti ricontattiamo noi, senza impegno.</p>
                    <form onSubmit={submit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            placeholder="Nome e cognome"
                            data-testid="report-pubblico-input-nome"
                            className="rounded-xl border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand outline-none"
                        />
                        <input
                            value={form.telefono}
                            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                            placeholder="Telefono"
                            data-testid="report-pubblico-input-telefono"
                            className="rounded-xl border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand outline-none"
                        />
                        <input
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="Email (facoltativa)"
                            type="email"
                            data-testid="report-pubblico-input-email"
                            className="sm:col-span-2 rounded-xl border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand outline-none"
                        />
                        <Button
                            type="submit"
                            disabled={sending}
                            data-testid="report-pubblico-submit"
                            className="sm:col-span-2 w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold shadow-xl shadow-orange-500/30">
                            {sending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                            Richiedi la mia offerta <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </form>
                    <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Stima non vincolante · Nessun costo · Nessun obbligo
                    </p>
                </div>
            )}
        </div>
    );
}
