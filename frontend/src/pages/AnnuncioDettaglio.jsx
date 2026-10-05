import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Truck, Recycle, Tag, ShieldCheck, MessageSquare, Star, MessageSquareHeart } from "lucide-react";
import { Stars } from "@/components/StarRating";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { annuncioImg, prezzoLabel, ContattoAzienda, FILES_BASE } from "@/components/AnnuncioCard";
import { NoleggioCalendar } from "@/components/NoleggioCalendar";

export default function AnnuncioDettaglio() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [a, setA] = useState(null);
    const [error, setError] = useState("");
    const [active, setActive] = useState(0);
    const [recensioni, setRecensioni] = useState([]);

    useEffect(() => {
        api.get(`/annunci/${id}`).then(({ data }) => setA(data)).catch((e) => setError(formatApiError(e)));
        api.get(`/annunci/${id}/recensioni`).then(({ data }) => setRecensioni(data)).catch(() => {});
    }, [id]);

    const images = a ? (a.foto?.length ? a.foto.map((f) => `${FILES_BASE}${f.path}`) : [annuncioImg(a)]) : [];
    const noleggio = a?.tipo === "noleggio";
    const back = noleggio ? "/noleggio" : "/mercatino";

    const richiedi = () => {
        if (noleggio) {
            document.querySelector('[data-testid="noleggio-calendar"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        if (!user) return navigate("/login");
        if (user.role === "privato") {
            const q = new URLSearchParams({
                categoria: "Altri Servizi", zona: a.zona,
                titolo: `${noleggio ? "Noleggio" : "Acquisto usato"}: ${a.titolo}`,
                descrizione: `Salve ${a.azienda_nome}, sono interessato all'annuncio "${a.titolo}" (${prezzoLabel(a)}). Potete indicarmi disponibilità e condizioni?`,
            });
            navigate(`/nuova-richiesta?${q.toString()}`);
        } else {
            navigate(`/aziende/${a.azienda_id}`);
        }
    };

    return (
        <div className="bg-navy min-h-screen pt-24 sm:pt-28 pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to={back} data-testid="annuncio-back-link" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand transition-colors">
                    <ArrowLeft className="h-4 w-4" /> {noleggio ? "Tutti i mezzi a noleggio" : "Tutto il mercatino"}
                </Link>
                {error && <p className="mt-10 text-red-400" data-testid="annuncio-error">{error}</p>}
                {!a && !error && <p className="mt-10 text-slate-400">Caricamento annuncio…</p>}

                {a && (
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8" data-testid="annuncio-detail">
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl overflow-hidden border border-white/10 bg-navy-700/60">
                                <img src={images[active]} alt={a.titolo} className="w-full h-72 sm:h-[420px] object-cover" data-testid="annuncio-main-img" />
                            </div>
                            {images.length > 1 && (
                                <div className="mt-3 grid grid-cols-4 gap-3">
                                    {images.map((src, i) => (
                                        <button key={src} type="button" onClick={() => setActive(i)} data-testid={`annuncio-thumb-${i}`}
                                            className={`rounded-xl overflow-hidden border transition-colors ${i === active ? "border-brand" : "border-white/10 hover:border-white/30"}`}>
                                            <img src={src} alt="" className="h-20 w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {noleggio && <div className="mt-6"><NoleggioCalendar annuncio={a} /></div>}
                            <div className="mt-6 rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8">
                                <h2 className="font-display font-bold text-white text-xl">Descrizione</h2>
                                <p className="mt-3 text-slate-300 leading-relaxed whitespace-pre-line" data-testid="annuncio-descrizione">{a.descrizione}</p>
                            </div>
                            {noleggio && (
                                <div className="mt-6 rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8" data-testid="annuncio-recensioni">
                                    <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                        <MessageSquareHeart className="h-5 w-5 text-brand" /> Recensioni dei noleggi
                                    </h2>
                                    {recensioni.length === 0 ? (
                                        <p className="mt-4 text-sm text-slate-500">Nessuna recensione ancora: sarà il primo cliente a raccontare com'è andata.</p>
                                    ) : (
                                        <div className="mt-5 space-y-4">
                                            {recensioni.map((r) => (
                                                <div key={r.id} className="rounded-2xl border border-white/5 bg-navy/60 p-5" data-testid={`annuncio-recensione-${r.id}`}>
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-white">{r.client_name}</span>
                                                        <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1.5">Mezzo <Stars value={r.voto_mezzo} className="h-3.5 w-3.5" /></span>
                                                        <span className="flex items-center gap-1.5">Azienda <Stars value={r.voto_azienda} className="h-3.5 w-3.5" /></span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-slate-300">{r.commento}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <aside className="lg:col-span-5">
                            <div className="sticky top-24 rounded-3xl border border-brand/30 bg-gradient-to-b from-brand/15 to-navy-700/60 p-6 sm:p-8">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${noleggio ? "bg-brand text-white" : "bg-emerald-500 text-navy"}`}>
                                    {noleggio ? <Truck className="h-3 w-3" /> : <Recycle className="h-3 w-3" />}
                                    {noleggio ? "Noleggio" : `Usato · ${a.stato || "Buono"}`}
                                </span>
                                <h1 className="mt-3 font-display font-black text-2xl sm:text-3xl text-white tracking-tight" data-testid="annuncio-titolo">{a.titolo}</h1>
                                <p className="mt-3 font-display font-black text-3xl text-brand" data-testid="annuncio-prezzo">{prezzoLabel(a)}</p>
                                {a.recensioni > 0 && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-amber" data-testid="annuncio-detail-rating">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span className="font-semibold text-white">{Number(a.rating).toFixed(1)}</span>
                                        <span className="text-slate-400">· {a.recensioni} {a.recensioni === 1 ? "recensione" : "recensioni"}</span>
                                    </p>
                                )}
                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
                                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> {a.zona}</span>
                                    <span className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-brand" /> {a.categoria}</span>
                                </div>
                                <div className="mt-6 border-t border-white/10 pt-5">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Pubblicato da</p>
                                    <ContattoAzienda a={a} />
                                </div>
                                <Button onClick={richiedi} data-testid="annuncio-richiedi-button"
                                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25 font-semibold">
                                    <MessageSquare className="h-4 w-4 mr-2" /> {noleggio ? "Scegli le date e prenota" : "Contatta il venditore"}
                                </Button>
                                <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Annuncio pubblicato da un'azienda con abbonamento PRO.
                                </p>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
