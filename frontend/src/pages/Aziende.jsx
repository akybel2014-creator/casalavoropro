import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MapPin, ShieldCheck, Star, ArrowRight, SearchX, Siren, Navigation } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/components/landing/CategoryGrid";
import LocationPicker from "@/components/LocationPicker";

const AVATAR_GRADIENTS = [
    "from-orange-500 to-amber-400",
    "from-blue-500 to-cyan-400",
    "from-violet-500 to-fuchsia-400",
    "from-emerald-500 to-teal-400",
    "from-rose-500 to-orange-400",
];

export function AziendaAvatar({ nome, size = "h-14 w-14 text-lg" }) {
    const initials = (nome || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const idx = (nome || "").length % AVATAR_GRADIENTS.length;
    return (
        <span className={`inline-flex ${size} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx]} font-display font-black text-navy`}>
            {initials}
        </span>
    );
}

export function VerifiedBadge({ verified }) {
    if (!verified) return null;
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Verificata
        </span>
    );
}

const RAGGI = [10, 25, 50, 100];

export default function Aziende() {
    const [params, setParams] = useSearchParams();
    const [q, setQ] = useState(params.get("q") || "");
    const [zona, setZona] = useState(params.get("zona") || "");
    const [categoria, setCategoria] = useState(params.get("categoria") || "");
    const [verificate, setVerificate] = useState(false);
    const [emergenze, setEmergenze] = useState(params.get("emergenze") === "true");
    const [geo, setGeo] = useState(null);
    const [radius, setRadius] = useState(25);
    const [items, setItems] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setQ(params.get("q") || "");
        setZona(params.get("zona") || "");
        setCategoria(params.get("categoria") || "");
        setEmergenze(params.get("emergenze") === "true");
    }, [params]);

    const fetchItems = useMemo(() => {
        return async () => {
            try {
                const query = new URLSearchParams();
                if (q) query.set("q", q);
                if (zona) query.set("zona", zona);
                if (categoria) query.set("categoria", categoria);
                if (verificate) query.set("verificate", "true");
                if (emergenze) query.set("emergenze", "true");
                if (geo) {
                    query.set("lat", String(geo.lat));
                    query.set("lng", String(geo.lng));
                    query.set("radius_km", String(radius));
                }
                const { data } = await api.get(`/aziende?${query.toString()}`);
                setItems(data);
            } catch (e) {
                setError(formatApiError(e));
            }
        };
    }, [q, zona, categoria, verificate, emergenze, geo, radius]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const applyFilters = (e) => {
        e?.preventDefault();
        const query = new URLSearchParams();
        if (q) query.set("q", q);
        if (zona) query.set("zona", zona);
        if (categoria) query.set("categoria", categoria);
        if (emergenze) query.set("emergenze", "true");
        setParams(query);
    };

    return (
        <div className="bg-navy min-h-screen">
            <section className="relative border-b border-white/10 bg-navy-600/30 pt-28 sm:pt-32 pb-10 overflow-hidden">
                <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Directory</p>
                    <h1 className="mt-2 font-display font-black tracking-tight text-3xl sm:text-4xl text-white">
                        Aziende del settore casa
                    </h1>
                    <form onSubmit={applyFilters} data-testid="directory-filters" className="mt-6 flex flex-col md:flex-row gap-2 md:items-center">
                        <label className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-navy/80 border border-white/10">
                            <Search className="h-4 w-4 text-brand shrink-0" />
                            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome o attività" className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0 text-white placeholder:text-slate-500" />
                        </label>
                        <label className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-navy/80 border border-white/10">
                            <MapPin className="h-4 w-4 text-brand shrink-0" />
                            <Input value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Zona: città o provincia" className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0 text-white placeholder:text-slate-500" />
                        </label>
                        <Select value={categoria || "all"} onValueChange={(v) => setCategoria(v === "all" ? "" : v)}>
                            <SelectTrigger data-testid="directory-category-select" className="md:w-52 rounded-xl bg-navy/80 border-white/10 text-white">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent className="bg-navy-700 border-white/10">
                                <SelectItem value="all">Tutte le categorie</SelectItem>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" className="rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-6">
                            Filtra
                        </Button>
                        <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy/80 border border-white/10 text-sm text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                data-testid="directory-verified-only-checkbox"
                                checked={verificate}
                                onChange={(e) => setVerificate(e.target.checked)}
                                className="h-4 w-4 accent-[#FF5A1F]"
                            />
                            Solo verificate
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy/80 border border-brand/40 text-sm text-brand cursor-pointer">
                            <input
                                type="checkbox"
                                data-testid="directory-emergenze-checkbox"
                                checked={emergenze}
                                onChange={(e) => setEmergenze(e.target.checked)}
                                className="h-4 w-4 accent-[#FF5A1F]"
                            />
                            <Siren className="h-4 w-4" /> Emergenze 24/7
                        </label>
                    </form>

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3" data-testid="directory-nearby-controls">
                        <div className="sm:w-96">
                            <LocationPicker value={geo} onChange={setGeo} testPrefix="directory" placeholder="Cerca un indirizzo per trovare le aziende vicine" />
                        </div>
                        {geo && (
                            <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                                <SelectTrigger data-testid="directory-radius-select" className="sm:w-40 rounded-xl bg-navy/80 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    {RAGGI.map((r) => (
                                        <SelectItem key={r} value={String(r)}>Raggio {r} km</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Navigation className="h-3.5 w-3.5 text-brand" />
                            {geo ? "Aziende ordinate per distanza" : "Attiva la posizione per vedere la distanza e ordinare per vicinanza"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-10 sm:py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {error && <p className="text-red-400" data-testid="directory-error">{error}</p>}
                    {!items && !error && <p className="text-slate-400" data-testid="directory-loading">Caricamento aziende…</p>}
                    {items && items.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-10 text-center" data-testid="directory-empty">
                            <SearchX className="h-10 w-10 text-slate-500 mx-auto" />
                            <h3 className="mt-4 font-display font-bold text-white text-lg">Nessuna azienda trovata</h3>
                            <p className="mt-1 text-sm text-slate-400">
                                {geo ? "Nessuna azienda entro il raggio scelto: prova ad allargarlo o rimuovi i filtri." : "Prova a rimuovere qualche filtro o amplia la zona di ricerca."}
                            </p>
                        </div>
                    )}
                    {items && items.length > 0 && (
                        <p className="mb-6 text-sm text-slate-400" data-testid="directory-count">
                            {items.length} {items.length === 1 ? "azienda trovata" : "aziende trovate"}
                            {geo ? " · ordinate per distanza" : ""}
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        {items && items.map((a) => (
                            <div key={a.id} data-testid={`company-card-${a.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                className="group flex flex-col h-full rounded-2xl border border-white/10 bg-navy-700/60 p-6 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <AziendaAvatar nome={a.nome} />
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-display font-bold text-white truncate">{a.nome}</h3>
                                            <VerifiedBadge verified={a.verified} />
                                            {a.plan === "pro" && (
                                                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand uppercase tracking-wide">PRO</span>
                                            )}
                                            {a.emergenze && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white" data-testid="company-card-emergenze-badge">
                                                    <Siren className="h-3 w-3" /> Emergenze
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1 text-sm text-brand-amber">
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                            <span className="font-semibold text-white">{a.rating > 0 ? a.rating.toFixed(1) : "Nuova"}</span>
                                            {a.recensioni > 0 && <span className="text-slate-500">({a.recensioni})</span>}
                                        </div>
                                    </div>
                                    {a.distance_km != null && (
                                        <span className="ml-auto shrink-0 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200" data-testid={`company-distance-${a.id}`}>
                                            {a.distance_km} km
                                        </span>
                                    )}
                                </div>
                                <p className="mt-4 text-sm text-slate-400 leading-relaxed line-clamp-3">{a.descrizione}</p>
                                <div className="mt-4 flex flex-wrap gap-1.5">
                                    {a.categorie?.slice(0, 3).map((c) => (
                                        <span key={c} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-slate-300">{c}</span>
                                    ))}
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                                    <MapPin className="h-3.5 w-3.5 text-brand" /> {a.zone?.join(" · ")}
                                </div>
                                <div className="mt-auto pt-5">
                                    <Button asChild className="w-full rounded-xl bg-white/5 border border-white/10 text-white hover:bg-brand hover:text-navy hover:border-brand font-semibold">
                                        <Link to={`/aziende/${a.id}`} data-testid={`company-view-${a.id}`}>
                                            Vedi profilo <ArrowRight className="h-4 w-4 ml-1.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
