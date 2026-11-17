import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star, ShieldCheck, Phone, Globe, FileText, Building2, Siren, PhoneCall, CalendarCheck, Moon, Camera, MessageSquareHeart, Megaphone, Mail, MessageCircle, ExternalLink } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { supabase, normalizeAziendaFlags } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { AziendaAvatar, VerifiedBadge, parseAziendaDescrizione } from "@/pages/Aziende";
import { Stars } from "@/components/StarRating";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";
import { usePreferiti } from "@/hooks/usePreferiti";
import { PreferitaButton } from "@/components/PreferitaButton";
import { BlurImage } from "@/components/BlurImage";

const FILES_BASE = "/api/files/";

function dataIt(iso) {
    try {
        return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return "";
    }
}

export default function AziendaDettaglio() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [a, setA] = useState(null);
    const [recensioni, setRecensioni] = useState([]);
    const [offerte, setOfferte] = useState([]);
    const [error, setError] = useState("");
    const { isPreferita, toggle: togglePreferita, canSave } = usePreferiti();

    useEffect(() => {
        let active = true;

        const load = async () => {
            // 1. Prova prima da Supabase
            try {
                const { data: supaAzienda, error: supaErr } = await supabase
                    .from("aziende")
                    .select("*")
                    .eq("id", id)
                    .maybeSingle();

                if (!supaErr && supaAzienda && active) {
                    const parsed = parseAziendaDescrizione(supaAzienda.descrizione);
                    const flags = normalizeAziendaFlags(supaAzienda);
                    setA({
                        id: supaAzienda.id,
                        owner_id: supaAzienda.owner_id || null,
                        ...flags,
                        nome: supaAzienda.nome,
                        categorie: Array.isArray(supaAzienda.categorie) ? supaAzienda.categorie : [],
                        zone: Array.isArray(supaAzienda.zone) ? supaAzienda.zone : [],
                        descrizione: parsed.descrizione,
                        piva: supaAzienda.piva || "",
                        telefono: supaAzienda.telefono || "",
                        tipo_telefono: supaAzienda.tipo_telefono || parsed.tipo_telefono || "",
                        email: supaAzienda.email || "",
                        indirizzo: supaAzienda.indirizzo || "",
                        sito: supaAzienda.sito || parsed.sito || "",
                        whatsapp: supaAzienda.whatsapp || parsed.whatsapp || "",
                        logo: supaAzienda.logo_url || supaAzienda.logo || null,
                        foto: Array.isArray(supaAzienda.foto) ? supaAzienda.foto : [],
                        emergenze: Boolean(supaAzienda.emergenze),
                        emergenze_weekend: Boolean(supaAzienda.emergenze_weekend),
                        emergenze_notturno: Boolean(supaAzienda.emergenze_notturno),
                        emergenze_telefono: supaAzienda.emergenze_telefono || "",
                        rating: Number(supaAzienda.rating) || 0,
                        recensioni: Number(supaAzienda.recensioni_count ?? supaAzienda.recensioni ?? 0),
                        created_at: supaAzienda.created_at,
                    });
                    setError("");
                    return;
                }
            } catch {
                /* fallback */
            }

            // 2. Fallback su API locale
            api.get(`/aziende/${id}`)
                .then(({ data }) => {
                    if (active && data) {
                        setA(data);
                        setError("");
                    }
                })
                .catch((e) => {
                    if (active) setError(formatApiError(e));
                });
        };

        load();

        const loadRecensioni = async () => {
            try {
                const { data: supaRevs, error: revErr } = await supabase
                    .from("recensioni")
                    .select("*")
                    .eq("azienda_id", id)
                    .order("created_at", { ascending: false });
                if (!revErr && Array.isArray(supaRevs) && supaRevs.length > 0) {
                    if (active) setRecensioni(supaRevs);
                    return;
                }
            } catch {
                /* fallback su API */
            }
            api.get(`/aziende/${id}/recensioni`)
                .then(({ data }) => { if (active) setRecensioni(Array.isArray(data) ? data : []); })
                .catch(() => {});
        };
        loadRecensioni();

        api.get(`/aziende/${id}/offerte-lavoro`)
            .then(({ data }) => { if (active) setOfferte(Array.isArray(data) ? data : []); })
            .catch(() => {});

        return () => { active = false; };
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
        <div className="bg-navy min-h-screen pt-32 sm:pt-36 pb-20">
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
                                    <AziendaAvatar nome={a.nome} logo={a.logo} foto={a.foto} verified={a.verified} size="h-20 w-20 text-2xl" />
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">{a.nome}</h1>
                                            <VerifiedBadge verified={a.verified} />
                                            {a.unclaimed && (
                                                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300" data-testid="company-detail-unclaimed-badge">
                                                    Scheda non reclamata
                                                </span>
                                            )}
                                            {a.plan === "pro" && <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand uppercase tracking-wide">PRO</span>}
                                            {a.emergenze && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white" data-testid="company-detail-emergenze-badge">
                                                    <Siren className="h-3.5 w-3.5" /> Emergenze 24/7
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                                            {!a.unclaimed && (
                                                <span className="flex items-center gap-1 text-brand-amber">
                                                    <Star className="h-4 w-4 fill-current" />
                                                    <span className="font-semibold text-white">{a.rating > 0 ? a.rating.toFixed(1) : "Nuova"}</span>
                                                    {a.recensioni > 0 && <span>({a.recensioni} recensioni)</span>}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> {a.zone?.join(" · ")}</span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {a.categorie?.map((c) => (
                                                <span key={c} className="rounded-full bg-brand/10 border border-brand/30 px-3 py-1 text-xs font-medium text-brand">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {a.descrizione && (
                                    <p className="mt-6 text-slate-300 leading-relaxed">{a.descrizione}</p>
                                )}

                                {(a.indirizzo || a.telefono || a.email || a.sito || a.whatsapp) && (
                                    <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="company-contact-grid">
                                        {a.indirizzo && (
                                            <div className="rounded-xl border border-white/10 bg-navy/60 p-4">
                                                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-brand" /> Indirizzo
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-white">{a.indirizzo}</p>
                                            </div>
                                        )}
                                        {a.telefono && (
                                            <div className="rounded-xl border border-white/10 bg-navy/60 p-4">
                                                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-brand" /> Telefono {a.tipo_telefono ? `(${a.tipo_telefono})` : ""}
                                                </p>
                                                <a href={`tel:${a.telefono.replace(/\s+/g, "")}`} className="mt-1 inline-block text-sm font-medium text-white hover:text-brand transition-colors">
                                                    {a.telefono}
                                                </a>
                                            </div>
                                        )}
                                        {a.email && (
                                            <div className="rounded-xl border border-white/10 bg-navy/60 p-4">
                                                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5 text-brand" /> Email
                                                </p>
                                                <a href={`mailto:${a.email}`} className="mt-1 inline-block text-sm font-medium text-white hover:text-brand transition-colors break-all">
                                                    {a.email}
                                                </a>
                                            </div>
                                        )}
                                        {a.sito && (
                                            <div className="rounded-xl border border-white/10 bg-navy/60 p-4">
                                                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                                                    <Globe className="h-3.5 w-3.5 text-brand" /> Sito web
                                                </p>
                                                <a href={a.sito.startsWith("http") ? a.sito : `https://${a.sito}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline break-all">
                                                    {a.sito} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                </a>
                                            </div>
                                        )}
                                        {a.whatsapp && (
                                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                                <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                                                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                                </p>
                                                <a href={a.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-emerald-300 transition-colors">
                                                    Scrivi su WhatsApp <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {a.emergenze && (
                                <div className="rounded-3xl border-2 border-brand/50 bg-gradient-to-b from-brand/15 to-navy-700/60 p-6 sm:p-8" data-testid="company-emergency-card">
                                    <div className="flex items-center gap-2.5">
                                        <Siren className="h-5 w-5 text-brand" />
                                        <h2 className="font-display font-bold text-white text-xl">Emergenze 24/7</h2>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-300">
                                        Questa azienda dichiara la disponibilità ad intervenire in emergenza, fuori dagli orari standard.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {a.emergenze_weekend && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand" data-testid="company-emergency-weekend-chip">
                                                <CalendarCheck className="h-3.5 w-3.5" /> Disponibile nel weekend
                                            </span>
                                        )}
                                        {a.emergenze_notturno && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand" data-testid="company-emergency-night-chip">
                                                <Moon className="h-3.5 w-3.5" /> Disponibile di notte
                                            </span>
                                        )}
                                        {!a.emergenze_weekend && !a.emergenze_notturno && (
                                            <span className="text-xs text-slate-500">Solo orario diurno — chiamare per conferma</span>
                                        )}
                                    </div>
                                    {(a.emergenze_telefono || a.telefono) && (
                                        <a
                                            href={`tel:${(a.emergenze_telefono || a.telefono).replace(/\s/g, "")}`}
                                            data-testid="company-emergency-phone-link"
                                            className="mt-5 inline-flex items-center gap-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-3 transition-colors"
                                        >
                                            <PhoneCall className="h-4 w-4" /> {a.emergenze_telefono || a.telefono}
                                        </a>
                                    )}
                                </div>
                            )}

                            {a.foto?.length > 0 && (
                                <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8" data-testid="company-gallery">
                                    <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                        <Camera className="h-5 w-5 text-brand" /> Lavori realizzati
                                    </h2>
                                    <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {a.foto.map((f) => (
                                            <div key={f.id} className="relative rounded-2xl overflow-hidden border border-white/10" data-testid={`company-gallery-item-${f.id}`}>
                                                <BlurImage src={`${FILES_BASE}${f.path}`} alt={f.filename || "Lavoro realizzato"} loading="lazy" imgClassName="w-full h-40 object-cover hover:scale-105" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!a.unclaimed && (
                                <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8" data-testid="company-reviews">
                                    <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                        <MessageSquareHeart className="h-5 w-5 text-brand" /> Recensioni dei clienti
                                    </h2>
                                    {recensioni.length === 0 ? (
                                        <p className="mt-4 text-sm text-slate-500">Ancora nessuna recensione scritta dai clienti.</p>
                                    ) : (
                                        <div className="mt-5 space-y-4">
                                            {recensioni.map((r) => (
                                                <div key={r.id} className="rounded-2xl border border-white/5 bg-navy/60 p-5" data-testid={`company-review-${r.id}`}>
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <Stars value={r.voto} />
                                                            <span className="text-sm font-semibold text-white">{r.client_name}</span>
                                                        </div>
                                                        <span className="text-xs text-slate-500">{dataIt(r.created_at)}</span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-slate-300">{r.commento}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {offerte.length > 0 && (
                                <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-8" data-testid="company-jobs">
                                    <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                        <Megaphone className="h-5 w-5 text-brand" /> Offerte di lavoro
                                    </h2>
                                    <div className="mt-5 space-y-4">
                                        {offerte.map((o) => (
                                            <div key={o.id} className="rounded-2xl border border-white/5 bg-navy/60 p-5" data-testid={`company-job-${o.id}`}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-display font-bold text-white">{o.titolo}</h3>
                                                    <span className="rounded-full bg-brand/15 text-brand text-xs font-semibold px-2 py-0.5">{o.tipo_contratto}</span>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">{o.descrizione}</p>
                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" /> {o.zona}</span>
                                                    {o.retribuzione && <span>{o.retribuzione}</span>}
                                                    {o.contatto_email && <a className="text-brand hover:underline" href={`mailto:${o.contatto_email}`} data-testid={`company-job-email-${o.id}`}>{o.contatto_email}</a>}
                                                    {o.contatto_telefono && <a className="text-brand hover:underline" href={`tel:${o.contatto_telefono}`}>{o.contatto_telefono}</a>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {a.unclaimed ? (
                                <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8" data-testid="company-unclaimed-box">
                                    <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-amber-400" /> Scheda non reclamata
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        Questa scheda riporta dati informativi pubblici e non è ancora stata reclamata né verificata dal titolare.
                                    </p>
                                    <Link
                                        to="/registrati?ruolo=azienda"
                                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                                    >
                                        Sei il titolare? Reclama questa scheda →
                                    </Link>
                                </div>
                            ) : (
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
                                                {a.verified ? "Verificata dallo staff" : "Verifica in corso / richiesta inviata"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <aside className="lg:col-span-4">
                            <div className="sticky top-24 rounded-3xl border border-brand/30 bg-gradient-to-b from-brand/15 to-navy-700/60 p-6 sm:p-8">
                                <h3 className="font-display font-black text-white text-xl">Richiedi un preventivo</h3>
                                <p className="mt-2 text-sm text-slate-300">
                                    Racconta il lavoro da fare: riceverai un'offerta Gratuita e senza impegno da questa azienda.
                                </p>
                                <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                                    {a.unclaimed ? (
                                        <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-400" /> Scheda non reclamata</li>
                                    ) : (
                                        <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Azienda controllata dallo staff</li>
                                    )}
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
                                {canSave && (
                                    <div className="mt-3">
                                        <PreferitaButton size="wide" aziendaId={a.id} nome={a.nome} saved={isPreferita(a.id)} onToggle={togglePreferita} />
                                    </div>
                                )}
                                <div className="mt-5 space-y-2.5 text-sm">
                                    {a.indirizzo && (
                                        <p className="flex items-start gap-2 text-slate-300">
                                            <MapPin className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                                            <span>{a.indirizzo}</span>
                                        </p>
                                    )}
                                    {a.telefono && (
                                        <a href={`tel:${a.telefono.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-slate-300 hover:text-brand transition-colors">
                                            <Phone className="h-4 w-4 text-brand shrink-0" />
                                            <span>{a.telefono}{a.tipo_telefono ? ` · ${a.tipo_telefono}` : ""}</span>
                                        </a>
                                    )}
                                    {a.whatsapp && (
                                        <a href={a.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                                            <MessageCircle className="h-4 w-4 shrink-0" />
                                            <span>Contatta su WhatsApp</span>
                                        </a>
                                    )}
                                    {a.email && (
                                        <a href={`mailto:${a.email}`} className="flex items-center gap-2 text-slate-300 hover:text-brand transition-colors break-all">
                                            <Mail className="h-4 w-4 text-brand shrink-0" />
                                            <span>{a.email}</span>
                                        </a>
                                    )}
                                    {a.sito && (
                                        <a href={a.sito.startsWith("http") ? a.sito : `https://${a.sito}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-brand transition-colors break-all">
                                            <Globe className="h-4 w-4 text-brand shrink-0" />
                                            <span>{a.sito}</span>
                                        </a>
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
