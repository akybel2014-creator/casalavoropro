import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star, ShieldCheck, Phone, Globe, FileText, Building2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AziendaAvatar, VerifiedBadge } from "@/pages/Aziende";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";

export default function AziendaDettaglio() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [a, setA] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/aziende/${id}`)
            .then(({ data }) => setA(data))
            .catch((e) => setError(formatApiError(e)));
    }, [id]);

    const askQuote = () => {
        if (!user) return navigate("/login");
        if (user.role === "privato") {
            navigate(`/nuova-richiesta?categoria=${encodeURIComponent(a.categorie?.[0] || "")}&zona=${encodeURIComponent(a.zone?.[0] || "")}`);
        } else {
            navigate(dashboardPathFor(user.role));
        }
    };

    return (
        <div className="bg-navy min-h-screen pt-24 sm:pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/aziende" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Tutte le aziende
                </Link>

                {error && <p className="mt-10 text-red-400" data-testid="company-detail-error">{error}</p>}
                {!a && !error && <p className="mt-10 text-slate-400" data-testid="company-detail-loading">Caricamento profilo…</p>}

                {a && (
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8" data-testid="company-detail">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                                    <AziendaAvatar nome={a.nome} size="h-20 w-20 text-2xl" />
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">{a.nome}</h1>
                                            <VerifiedBadge verified={a.verified} />
                                            {a.plan === "pro" && <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand uppercase tracking-wide">PRO</span>}
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                                            <span className="flex items-center gap-1 text-brand-amber">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="font-semibold text-white">{a.rating > 0 ? a.rating.toFixed(1) : "Nuova"}</span>
                                                {a.recensioni > 0 && <span>({a.recensioni} recensioni)</span>}
                                            </span>
                                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> {a.zone?.join(" · ")}</span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {a.categorie?.map((c) => (
                                                <span key={c} className="rounded-full bg-brand/10 border border-brand/30 px-3 py-1 text-xs font-medium text-brand">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-6 text-slate-300 leading-relaxed">{a.descrizione}</p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8">
                                <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-brand" /> Verifica e qualifiche
                                </h2>
                                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-white/10 bg-navy/60 p-4">
                                        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Partita IVA</p>
                                        <p className="mt-1 font-medium text-white" data-testid="company-detail-piva">{a.verified ? a.piva || "Verificata" : "— Visibile dopo verifica —"}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-navy/60 p-4">
                                        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Stato verifica</p>
                                        <p className={`mt-1 font-medium ${a.verified ? "text-emerald-400" : "text-brand-amber"}`}>
                                            {a.verified ? "Verificata dallo staff PRO" : "Verifica in corso / richiesta inviata"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <aside className="lg:col-span-4">
                            <div className="sticky top-24 rounded-3xl border border-brand/30 bg-gradient-to-b from-brand/15 to-navy-700/60 p-6 sm:p-8">
                                <h3 className="font-display font-black text-white text-xl">Richiedi un preventivo</h3>
                                <p className="mt-2 text-sm text-slate-300">
                                    Racconta il lavoro da fare: riceverai un'offerta Gratuita e senza impegno da questa azienda.
                                </p>
                                <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                                    <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Azienda controllata dallo staff</li>
                                    <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand" /> Preventivo trasparente e gratuito</li>
                                    <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand" /> Un solo intermediario</li>
                                </ul>
                                <Button
                                    data-testid="company-detail-cta-button"
                                    onClick={askQuote}
                                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25 font-semibold"
                                >
                                    Richiedi preventivo gratuito
                                </Button>
                                <div className="mt-5 space-y-2 text-sm">
                                    {a.telefono && (
                                        <p className="flex items-center gap-2 text-slate-400"><Phone className="h-4 w-4 text-brand" /> {a.telefono}</p>
                                    )}
                                    {a.sito && (
                                        <p className="flex items-center gap-2 text-slate-400"><Globe className="h-4 w-4 text-brand" /> {a.sito}</p>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
