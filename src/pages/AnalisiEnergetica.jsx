import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    UploadCloud, FileText, Loader2, Sparkles, TrendingDown, Zap, Gauge,
    Building2, CheckCircle2, ArrowRight, RefreshCw, Camera,
    Share2, Copy, Check, QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatApiError } from "@/lib/api";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const fmtNum = (n) => (n == null ? "—" : new Intl.NumberFormat("it-IT").format(n));
const fmtEur = (n) => (n == null ? "—" : `€${Number(n).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);

export default function AnalisiEnergetica() {
    const [phase, setPhase] = useState("upload"); // upload | analyzing | result
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [lead, setLead] = useState(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileRef = useRef(null);
    const cameraRef = useRef(null);
    const progressTimer = useRef(null);
    const pollTimer = useRef(null);
    const pollDeadline = useRef(0);

    const stopFakeProgress = () => {
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = null;
    };
    const stopPolling = () => {
        if (pollTimer.current) clearInterval(pollTimer.current);
        pollTimer.current = null;
    };
    const startFakeProgress = () => {
        setProgress(8);
        progressTimer.current = setInterval(() => {
            setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 8));
        }, 700);
    };

    // Polling dello stato del lead: l'analisi gira in background sul server,
    // cosi l'upload non supera mai il timeout del gateway (niente errori 520/504).
    const pollLead = useCallback((id) => {
        setPhase("analyzing");
        startFakeProgress();
        pollDeadline.current = Date.now() + 150000; // max ~2,5 min
        stopPolling();
        pollTimer.current = setInterval(async () => {
            try {
                const { data } = await api.get(`/lead/${id}`);
                const l = data.lead || data;
                if (l.stato === "errore") {
                    stopPolling(); stopFakeProgress(); setProgress(0); setPhase("upload");
                    toast.error(l.errore || "Analisi non riuscita, riprova.");
                } else if (l.stato && l.stato !== "in_elaborazione") {
                    stopPolling(); stopFakeProgress(); setProgress(100);
                    setLead(l); setTimeout(() => setPhase("result"), 400);
                } else if (Date.now() > pollDeadline.current) {
                    stopPolling(); stopFakeProgress(); setProgress(0); setPhase("upload");
                    toast.error("L'analisi sta impiegando troppo tempo. Riprova con meno pagine o un file piu leggero.");
                }
            } catch (err) {
                stopPolling(); stopFakeProgress(); setProgress(0); setPhase("upload");
                toast.error(formatApiError(err));
            }
        }, 2500);
    }, []);

    // Se arriviamo dalla Hero, riprendiamo il polling del lead in elaborazione.
    useEffect(() => {
        const leadId = sessionStorage.getItem("analisi_lead_id");
        if (leadId) {
            sessionStorage.removeItem("analisi_lead_id");
            pollLead(leadId);
        }
        return () => { stopFakeProgress(); stopPolling(); };
    }, [pollLead]);

    const analizza = useCallback(async (fileList) => {
        const arr = Array.from(fileList || []).filter(Boolean);
        if (arr.length === 0) return;
        const invalid = arr.find((f) => !ALLOWED_TYPES.includes(f.type));
        if (invalid) {
            toast.error("Carica la bolletta in PDF oppure scatta una foto (JPG/PNG/WEBP)");
            return;
        }
        setPhase("analyzing");
        startFakeProgress();
        try {
            const fd = new FormData();
            arr.forEach((f) => fd.append("files", f));
            const { data } = await api.post("/analizza-bolletta", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            // La risposta e immediata (lead "in_elaborazione"): avviamo il polling del risultato.
            pollLead(data.lead.id);
        } catch (err) {
            stopFakeProgress();
            setProgress(0);
            setPhase("upload");
            toast.error(formatApiError(err));
        }
    }, [pollLead]);

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        analizza(e.dataTransfer?.files);
    };

    const risparmiaOra = async () => {
        if (!lead?.id) return;
        setSending(true);
        try {
            await api.post(`/lead/${lead.id}/risparmia`);
            setSent(true);
            toast.success("Pratica inviata con successo!");
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setSending(false);
        }
    };

    const reset = () => {
        setPhase("upload"); setProgress(0); setLead(null); setSent(false);
    };

    const dati = lead?.dati || {};
    const shareToken = lead?.share_token;
    const shareUrl = shareToken ? `${window.location.origin}/r/${shareToken}` : "";
    const qrSrc = shareToken ? `/api/report/pubblico/${shareToken}/qr.png` : "";

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link copiato!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Impossibile copiare il link");
        }
    };

    return (
        <div className="min-h-[70vh] max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14" data-testid="analisi-energetica-page">
            <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand">
                    <Sparkles className="h-3.5 w-3.5" /> Assistente AI · Gemini
                </span>
                <h1 className="mt-4 font-display font-black text-4xl sm:text-5xl text-white tracking-tight">Analisi Energetica</h1>
                <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                    Carica la tua bolletta di luce o gas: la nostra AI la analizza in pochi secondi e stima quanto puoi risparmiare.
                </p>
            </div>

            {/* FASE 1 — Caricamento */}
            {phase === "upload" && (
                <div className="mt-10">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => fileRef.current?.click()}
                        data-testid="analisi-dropzone"
                        className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 sm:p-16 text-center transition-colors duration-300 ${
                            dragOver ? "border-brand bg-brand/10" : "border-white/15 bg-navy-700/50 hover:border-brand/50 hover:bg-navy-700/70"
                        }`}>
                        <div className="mx-auto h-20 w-20 rounded-full bg-brand/15 flex items-center justify-center">
                            <UploadCloud className="h-10 w-10 text-brand" />
                        </div>
                        <p className="mt-6 font-display font-bold text-white text-lg">Trascina qui la tua bolletta (PDF o foto)</p>
                        <p className="mt-1 text-sm text-slate-400">oppure</p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                            <Button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                                data-testid="analisi-select-file-button"
                                className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                                <FileText className="h-4 w-4 mr-2" /> Carica PDF o foto
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
                                data-testid="analisi-camera-button"
                                className="rounded-xl border-white/20 text-white hover:bg-white/10 font-semibold">
                                <Camera className="h-4 w-4 mr-2" /> Scatta foto
                            </Button>
                        </div>
                        <p className="mt-5 text-xs text-slate-500">PDF o foto (JPG/PNG/WEBP) · puoi caricare più pagine · max 15 MB</p>
                        <input
                            ref={fileRef}
                            type="file"
                            multiple
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="hidden"
                            data-testid="analisi-file-input"
                            onChange={(e) => analizza(e.target.files)}
                        />
                        <input
                            ref={cameraRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            data-testid="analisi-camera-input"
                            onChange={(e) => analizza(e.target.files)}
                        />
                    </div>
                </div>
            )}

            {/* FASE 1b — Analisi in corso */}
            {phase === "analyzing" && (
                <div className="mt-10 rounded-3xl border border-white/10 bg-navy-700/60 p-10 sm:p-14 text-center" data-testid="analisi-loading">
                    <div className="mx-auto h-16 w-16 rounded-full bg-brand/15 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-brand animate-spin" />
                    </div>
                    <p className="mt-6 font-display font-bold text-white text-lg">L'assistente AI di Casalavoro Pro sta analizzando i tuoi consumi energetici…</p>
                    <p className="mt-1 text-sm text-slate-400">Estrazione fornitore, consumi e calcolo del risparmio</p>
                    <div className="mt-7 h-3 w-full rounded-full bg-white/10 overflow-hidden" data-testid="analisi-progress-track">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 transition-[width] duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
                            data-testid="analisi-progress-bar"
                        />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{Math.min(100, Math.round(progress))}%</p>
                </div>
            )}

            {/* FASE 2 — Risultato */}
            {phase === "result" && (
                <div className="mt-10 space-y-6" data-testid="analisi-result">
                    {/* Dati estratti */}
                    <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8">
                        <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-brand" /> Dati estratti dalla bolletta
                        </h2>
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="analisi-dato-fornitore">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold"><Building2 className="h-4 w-4" /> FORNITORE RILEVATO</div>
                                <p className="mt-2 font-display font-bold text-white text-xl break-words">{dati.fornitore || "—"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-5" data-testid="analisi-dato-consumo">
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold"><Zap className="h-4 w-4" /> CONSUMO ANNUO STIMATO</div>
                                <p className="mt-2 font-display font-bold text-white text-xl">{fmtNum(dati.consumo_annuo)} <span className="text-base text-slate-400">{dati.unita_consumo || ""}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Box risparmio */}
                    <div
                        className="relative overflow-hidden rounded-3xl border-2 p-8 sm:p-10 text-center"
                        style={{ backgroundColor: "rgba(255,122,0,0.10)", borderColor: "#FF7A00" }}
                        data-testid="analisi-box-risparmio">
                        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-brand/25 blur-3xl" aria-hidden="true" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 text-amber-300 text-sm font-semibold">
                                <TrendingDown className="h-5 w-5" /> Basato sugli indici PUN/PSV correnti
                            </div>
                            <p className="mt-3 text-slate-200 text-sm font-semibold uppercase tracking-wide">Risparmio Stimato</p>
                            <p className="mt-2 font-display font-black text-5xl sm:text-6xl text-white" data-testid="analisi-risparmio-value">
                                {fmtEur(dati.risparmio_stimato_annuo)} <span className="text-2xl sm:text-3xl text-amber-300">/ anno</span>
                            </p>
                            {dati.note && <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto">{dati.note}</p>}
                        </div>
                    </div>

                    {/* Condividi report */}
                    {shareToken && (
                        <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-6 sm:p-8" data-testid="analisi-condividi-card">
                            <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-brand" /> Condividi questo report
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Invia il link (o fai scansionare il QR) a chi vuoi: vedranno il risparmio stimato e potranno richiedere un'offerta.
                            </p>
                            <div className="mt-5 flex flex-col sm:flex-row gap-5 items-center">
                                <img
                                    src={qrSrc}
                                    alt="QR code del report"
                                    width={128}
                                    height={128}
                                    className="h-32 w-32 rounded-xl bg-white p-2 shrink-0"
                                    data-testid="analisi-condividi-qr"
                                />
                                <div className="w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 truncate rounded-xl border border-white/15 bg-navy px-4 py-3 text-sm text-slate-300" data-testid="analisi-condividi-link">
                                            {shareUrl}
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={copyLink}
                                            data-testid="analisi-condividi-copia"
                                            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15">
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`Guarda quanto puoi risparmiare in bolletta con CasaLavoroPRO: ${shareUrl}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            data-testid="analisi-condividi-whatsapp"
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
                                            <Share2 className="h-4 w-4" /> Condividi su WhatsApp
                                        </a>
                                        <a
                                            href={shareUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            data-testid="analisi-condividi-apri"
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors">
                                            <QrCode className="h-4 w-4" /> Anteprima pagina
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Call to action */}
                    {sent ? (
                        <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center" data-testid="analisi-success">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                            <p className="mt-4 font-display font-bold text-white text-lg">Pratica inviata con successo!</p>
                            <p className="mt-2 text-sm text-slate-300">Un consulente dedicato ti contatterà entro 24 ore.</p>
                            <button onClick={reset} className="mt-5 inline-flex items-center gap-2 text-brand font-semibold hover:underline" data-testid="analisi-nuova-analisi">
                                <RefreshCw className="h-4 w-4" /> Analizza un'altra bolletta
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Button
                                onClick={risparmiaOra}
                                disabled={sending}
                                data-testid="analisi-risparmia-button"
                                className="w-full sm:w-auto px-10 py-6 text-lg rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold shadow-xl shadow-orange-500/30">
                                {sending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                                Risparmia Ora <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                            <p className="mt-3 text-xs text-slate-400 flex items-center justify-center gap-1.5" data-testid="analisi-credit-hint">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Analisi e invio della pratica 100% gratuiti
                            </p>
                            <button onClick={reset} className="mt-4 block mx-auto text-sm text-slate-400 hover:text-white" data-testid="analisi-annulla">
                                Analizza un'altra bolletta
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
