import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Search, MapPin, SearchX, Truck, Recycle, Euro, ArrowRight } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnnuncioCard } from "@/components/AnnuncioCard";

const COPY = {
    noleggio: {
        eyebrow: "Noleggio Attrezzi", icon: Truck,
        title: "Macchinari e attrezzature a noleggio",
        text: "Mezzi delle aziende con Partita IVA iscritte: prenoti per i giorni che servono, consegna in cantiere e tariffe trasparenti.",
        empty: "Nessun mezzo a noleggio con questi filtri.",
    },
    usato: {
        eyebrow: "Marketplace", icon: Recycle,
        title: "Attrezzatura professionale di seconda mano",
        text: "Utensili e macchinari venduti da imprese verificate: stato dichiarato, foto reali e prezzi onesti.",
        empty: "Nessun articolo usato con questi filtri.",
    },
};

const inputWrap = "flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-navy/80 border border-white/10";
const inputCls = "border-0 bg-transparent h-auto p-0 focus-visible:ring-0 text-white placeholder:text-slate-500";

export default function Annunci({ tipo }) {
    const [params, setParams] = useSearchParams();
    const { user } = useAuth();
    const isAzienda = user?.role === "azienda";
    const c = COPY[tipo];
    const [q, setQ] = useState(params.get("q") || "");
    const [zona, setZona] = useState(params.get("zona") || "");
    const [categoria, setCategoria] = useState(params.get("categoria") || "");
    const [sottocategoria, setSottocategoria] = useState(params.get("sottocategoria") || "");
    const [min, setMin] = useState(params.get("min") || "");
    const [max, setMax] = useState(params.get("max") || "");
    const [meta, setMeta] = useState({ categorie: [], sottocategorie: {} });
    const [items, setItems] = useState(null);
    const [error, setError] = useState("");
    const [savedIds, setSavedIds] = useState(new Set());

    useEffect(() => {
        if (!isAzienda) { setSavedIds(new Set()); return; }
        api.get("/preferiti-annunci/ids").then(({ data }) => setSavedIds(new Set(data))).catch(() => {});
    }, [isAzienda]);

    const toggleFav = async (a) => {
        const saved = savedIds.has(a.id);
        setSavedIds((prev) => { const n = new Set(prev); saved ? n.delete(a.id) : n.add(a.id); return n; });
        try {
            if (saved) await api.delete(`/preferiti-annunci/${a.id}`);
            else { await api.put(`/preferiti-annunci/${a.id}`); toast.success("Salvato nei preferiti."); }
        } catch (e) {
            setSavedIds((prev) => { const n = new Set(prev); saved ? n.add(a.id) : n.delete(a.id); return n; });
            toast.error(formatApiError(e));
        }
    };

    useEffect(() => {
        api.get("/annunci/meta").then(({ data }) => setMeta(data)).catch(() => {});
    }, []);

    useEffect(() => {
        setQ(params.get("q") || "");
        setZona(params.get("zona") || "");
        setCategoria(params.get("categoria") || "");
        setSottocategoria(params.get("sottocategoria") || "");
        setMin(params.get("min") || "");
        setMax(params.get("max") || "");
    }, [params]);

    const fetchItems = useMemo(() => async () => {
        try {
            const query = new URLSearchParams({ tipo });
            if (params.get("q")) query.set("q", params.get("q"));
            if (params.get("zona")) query.set("zona", params.get("zona"));
            if (params.get("categoria")) query.set("categoria", params.get("categoria"));
            if (params.get("sottocategoria")) query.set("sottocategoria", params.get("sottocategoria"));
            if (params.get("min")) query.set("prezzo_min", params.get("min"));
            if (params.get("max")) query.set("prezzo_max", params.get("max"));
            const { data } = await api.get(`/annunci?${query.toString()}`);
            setItems(data);
        } catch (e) {
            setError(formatApiError(e));
        }
    }, [tipo, params]);

    useEffect(() => { setItems(null); fetchItems(); }, [fetchItems]);

    const applyFilters = (e) => {
        e?.preventDefault();
        const query = new URLSearchParams();
        if (q) query.set("q", q);
        if (zona) query.set("zona", zona);
        if (categoria) query.set("categoria", categoria);
        if (sottocategoria) query.set("sottocategoria", sottocategoria);
        if (min) query.set("min", min);
        if (max) query.set("max", max);
        setParams(query);
    };

    const reset = () => setParams(new URLSearchParams());
    const hasFilters = [...params.keys()].length > 0;

    return (
        <div className="bg-navy min-h-screen" data-testid={`annunci-page-${tipo}`}>
            <section className="relative border-b border-white/10 bg-navy-600/30 pt-28 sm:pt-32 pb-10 overflow-hidden">
                <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand flex items-center gap-2"><c.icon className="h-4 w-4" /> {c.eyebrow}</p>
                    <h1 className="mt-2 font-display font-black tracking-tight text-3xl sm:text-4xl text-white">{c.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400">{c.text}</p>

                    <form onSubmit={applyFilters} data-testid="annunci-filters" className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-2">
                        <label className={`${inputWrap} md:col-span-4`}>
                            <Search className="h-4 w-4 text-brand shrink-0" />
                            <Input value={q} onChange={(e) => setQ(e.target.value)} data-testid="annunci-q-input" placeholder="Cerca attrezzo, marca o azienda" className={inputCls} />
                        </label>
                        <label className={`${inputWrap} md:col-span-2`}>
                            <MapPin className="h-4 w-4 text-brand shrink-0" />
                            <Input value={zona} onChange={(e) => setZona(e.target.value)} data-testid="annunci-zona-input" placeholder="Zona" className={inputCls} />
                        </label>
                        <div className="md:col-span-2">
                            <Select value={categoria || "all"} onValueChange={(v) => { const nc = v === "all" ? "" : v; setCategoria(nc); setSottocategoria(""); }}>
                                <SelectTrigger data-testid="annunci-categoria-select" className="w-full h-full rounded-xl bg-navy/80 border-white/10 text-white">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    <SelectItem value="all">Tutte le categorie</SelectItem>
                                    {meta.categorie.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Select value={sottocategoria || "all"} onValueChange={(v) => setSottocategoria(v === "all" ? "" : v)} disabled={!categoria}>
                                <SelectTrigger data-testid="annunci-sottocategoria-select" className="w-full h-full rounded-xl bg-navy/80 border-white/10 text-white disabled:opacity-50">
                                    <SelectValue placeholder={categoria ? "Sottocategoria" : "Tutte"} />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10">
                                    <SelectItem value="all">Tutte</SelectItem>
                                    {(meta.sottocategorie?.[categoria] || []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <label className={`${inputWrap} md:col-span-1`}>
                            <Euro className="h-4 w-4 text-brand shrink-0" />
                            <Input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} data-testid="annunci-min-input" placeholder="Min" className={inputCls} />
                        </label>
                        <label className={`${inputWrap} md:col-span-1`}>
                            <Euro className="h-4 w-4 text-brand shrink-0" />
                            <Input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} data-testid="annunci-max-input" placeholder="Max" className={inputCls} />
                        </label>
                        <div className="md:col-span-12 flex flex-wrap gap-2">
                            <Button type="submit" data-testid="annunci-filter-button" className="rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-6">Filtra</Button>
                            {hasFilters && (
                                <Button type="button" variant="ghost" onClick={reset} data-testid="annunci-reset-button" className="rounded-xl text-slate-300 hover:text-white hover:bg-white/5">Azzera filtri</Button>
                            )}
                            <Link to={tipo === "noleggio" ? "/mercatino" : "/noleggio"} data-testid="annunci-switch-link"
                                className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-white transition-colors">
                                {tipo === "noleggio" ? "Vai al Marketplace" : "Vai al Noleggio Attrezzi"} <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </form>
                </div>
            </section>

            <section className="py-10 sm:py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {error && <p className="text-red-400" data-testid="annunci-error">{error}</p>}
                    {!items && !error && <p className="text-slate-400" data-testid="annunci-loading">Caricamento annunci…</p>}
                    {items && items.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-10 text-center" data-testid="annunci-empty">
                            <SearchX className="h-10 w-10 text-slate-500 mx-auto" />
                            <h3 className="mt-4 font-display font-bold text-white text-lg">{c.empty}</h3>
                            <p className="mt-1 text-sm text-slate-400">Prova ad allargare la zona o a rimuovere qualche filtro.</p>
                        </div>
                    )}
                    {items && items.length > 0 && (
                        <>
                            <p className="text-sm text-slate-400 mb-6" data-testid="annunci-count">
                                {items.length} {items.length === 1 ? "annuncio" : "annunci"}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" data-testid="annunci-grid">
                                {items.map((a, i) => <AnnuncioCard key={a.id} a={a} index={i}
                                    fav={isAzienda ? { active: true, saved: savedIds.has(a.id), onToggle: toggleFav } : null} />)}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
