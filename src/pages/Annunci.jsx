import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import {
    Search,
    MapPin,
    SearchX,
    Truck,
    Recycle,
    Euro,
    ArrowRight,
    Loader2,
    RefreshCw,
    AlertCircle,
    Database,
    Settings,
    Key,
    ExternalLink,
    CheckCircle2,
    ShieldAlert,
} from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import {
    supabase,
    isSupabaseConfiguredNow,
    ensureSupabaseConfig,
    configureSupabase,
    resetSupabaseCredentials,
    cleanSupabaseUrl,
    cleanSupabaseKey,
    STORAGE_KEY_URL,
    STORAGE_KEY_ANON,
} from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { AnnuncioCard } from "@/components/AnnuncioCard";
import { Skeleton } from "@/components/ui/skeleton";

const COPY = {
    noleggio: {
        eyebrow: "Noleggio Attrezzi",
        icon: Truck,
        title: "Macchinari e attrezzature a noleggio",
        text: "Catalogo in tempo reale sincronizzato con Supabase: attrezzature professionali verificate, noleggio a giornata e tariffe trasparenti.",
        empty: "Nessun attrezzo disponibile con i filtri selezionati.",
    },
    usato: {
        eyebrow: "Marketplace",
        icon: Recycle,
        title: "Attrezzatura professionale di seconda mano",
        text: "Utensili e macchinari venduti da imprese verificate: disponibilità in tempo reale, stato dichiarato e ritiro rapido.",
        empty: "Nessun articolo del marketplace con questi filtri.",
    },
};

export const PRESET_CATEGORIES = [
    "Tutti",
    "Demolizione & Carotaggio",
    "Termoidraulica & Clima",
    "Elettroutensili & Scanalatura",
    "Lavori in Quota & Ponteggi",
    "Diagnostica & Strumenti di Misura",
    "Movimentazione & Generatori",
];

const inputWrap = "flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-navy/80 border border-white/10";
const inputCls = "border-0 bg-transparent h-auto p-0 focus-visible:ring-0 text-white placeholder:text-slate-500";

function CardSkeleton() {
    return (
        <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-navy-700/60 p-0">
            <Skeleton className="h-48 w-full bg-white/5" />
            <div className="p-5 space-y-3 flex-1 flex flex-col">
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-full bg-white/5" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-4 w-20 bg-white/5 rounded-full" />
                    <Skeleton className="h-4 w-24 bg-white/5 rounded-full" />
                </div>
                <div className="mt-auto pt-4 space-y-2">
                    <Skeleton className="h-6 w-24 bg-white/10" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 flex-1 bg-white/5 rounded-full" />
                        <Skeleton className="h-8 w-20 bg-white/5 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Annunci({ tipo = "noleggio" }) {
    const [params, setParams] = useSearchParams();
    const { user } = useAuth();
    const isAzienda = user?.role === "azienda";
    const c = COPY[tipo] || COPY.noleggio;

    const [q, setQ] = useState(params.get("q") || "");
    const [comune, setComune] = useState(params.get("comune") || params.get("zona") || "");
    const [categoria, setCategoria] = useState(params.get("categoria") || "Tutti");
    const [min, setMin] = useState(params.get("min") || "");
    const [max, setMax] = useState(params.get("max") || "");

    const [items, setItems] = useState([]);
    const [rawCount, setRawCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authKeyError, setAuthKeyError] = useState(null);
    const [savedIds, setSavedIds] = useState(new Set());
    const [isLiveSupabase, setIsLiveSupabase] = useState(false);

    // Modal di configurazione rapida Supabase per test
    const [configOpen, setConfigOpen] = useState(false);
    const [inputUrl, setInputUrl] = useState(() => localStorage.getItem(STORAGE_KEY_URL) || "");
    const [inputKey, setInputKey] = useState(() => localStorage.getItem(STORAGE_KEY_ANON) || "");
    const [testing, setTesting] = useState(false);

    // Caricamento preferiti se utente azienda
    useEffect(() => {
        if (!isAzienda) {
            setSavedIds(new Set());
            return;
        }
        api.get("/preferiti-annunci/ids")
            .then(({ data }) => setSavedIds(new Set(data)))
            .catch(() => {});
    }, [isAzienda]);

    const toggleFav = async (a) => {
        const saved = savedIds.has(a.id);
        setSavedIds((prev) => {
            const n = new Set(prev);
            saved ? n.delete(a.id) : n.add(a.id);
            return n;
        });
        try {
            if (saved) await api.delete(`/preferiti-annunci/${a.id}`);
            else {
                await api.put(`/preferiti-annunci/${a.id}`);
                toast.success("Salvato nei preferiti.");
            }
        } catch (e) {
            setSavedIds((prev) => {
                const n = new Set(prev);
                saved ? n.add(a.id) : n.delete(a.id);
                return n;
            });
            toast.error(formatApiError(e));
        }
    };

    // Query in tempo reale da Supabase con gestione robusta degli errori di chiave API
    const fetchSupabaseItems = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Assicura che le credenziali siano sincronizzate
            await ensureSupabaseConfig();
            const configured = isSupabaseConfiguredNow();
            setIsLiveSupabase(configured);

            if (configured) {
                // Interroga la tabella marketplace su Supabase
                const { data, error: supaErr } = await supabase
                    .from("marketplace")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (supaErr) {
                    const errMsg = (supaErr.message || "").toLowerCase();
                    const hintMsg = (supaErr.hint || "").toLowerCase();
                    const isKeyError =
                        errMsg.includes("invalid api key") ||
                        errMsg.includes("jwt") ||
                        supaErr.code === "PGRST301" ||
                        hintMsg.includes("api key");

                    if (isKeyError) {
                        console.warn("[CasaLavoroPRO] Errore Supabase Invalid API Key. Caricamento catalogo di riserva:", supaErr);
                        setAuthKeyError(
                            "La chiave API Supabase inserita non è valida o appartiene a un altro progetto. Attivo catalogo di riserva."
                        );
                        setIsLiveSupabase(false);
                        // Fallback trasparente per non mostrare una pagina bianca o rotta
                        const query = new URLSearchParams({ tipo });
                        const { data: fallbackRows } = await api.get(`/annunci?${query.toString()}`);
                        const fb = fallbackRows || [];
                        setRawCount(fb.length);
                        setItems(fb);
                        return;
                    }
                    throw supaErr;
                }

                setAuthKeyError(null);
                const allRows = data || [];
                setRawCount(allRows.length);

                // Mostra tutti i record che non sono esplicitamente impostati su disponibile = false
                const available = allRows.filter((r) => r.disponibile !== false);
                setItems(available);
            } else {
                setAuthKeyError(null);
                // Fallback ad API locale/mock quando le variabili d'ambiente non sono ancora passate
                const query = new URLSearchParams({ tipo });
                const { data } = await api.get(`/annunci?${query.toString()}`);
                const fallbackRows = data || [];
                setRawCount(fallbackRows.length);
                setItems(fallbackRows);
            }
        } catch (err) {
            console.error("Errore fetch Supabase marketplace:", err);
            // In caso di errore generico da Supabase, carica comunque il catalogo locale per non bloccare l'utente
            try {
                const query = new URLSearchParams({ tipo });
                const { data: fb } = await api.get(`/annunci?${query.toString()}`);
                setItems(fb || []);
                setRawCount((fb || []).length);
            } catch {
                /* ignora */
            }
            setError(
                err.message ||
                "Impossibile collegarsi a Supabase. Visualizzazione catalogo di riserva attiva."
            );
        } finally {
            setLoading(false);
        }
    }, [tipo]);

    useEffect(() => {
        fetchSupabaseItems();
    }, [fetchSupabaseItems]);

    useEffect(() => {
        const handleConfigEvent = () => {
            fetchSupabaseItems();
        };
        window.addEventListener("supabase-configured", handleConfigEvent);
        return () => window.removeEventListener("supabase-configured", handleConfigEvent);
    }, [fetchSupabaseItems]);

    // Sincronizza i parametri URL
    useEffect(() => {
        setQ(params.get("q") || "");
        setComune(params.get("comune") || params.get("zona") || "");
        setCategoria(params.get("categoria") || "Tutti");
        setMin(params.get("min") || "");
        setMax(params.get("max") || "");
    }, [params]);

    // Categorie dinamiche
    const availableCategories = useMemo(() => {
        const set = new Set();
        (items || []).forEach((item) => {
            if (item.categoria && typeof item.categoria === "string") {
                const cTrim = item.categoria.trim();
                if (cTrim) set.add(cTrim);
            }
        });

        const list = [...PRESET_CATEGORIES];
        set.forEach((cat) => {
            if (!list.some((p) => p.toLowerCase() === cat.toLowerCase())) {
                list.push(cat);
            }
        });
        return list;
    }, [items]);

    // Filtraggio dinamico degli elementi
    const filteredItems = useMemo(() => {
        return (items || []).filter((item) => {
            // Filtro per tipologia: se l'annuncio specifica un tipo ('noleggio' o 'vendita'/'usato')
            if (item.tipo) {
                const tLower = String(item.tipo).toLowerCase();
                if (tipo === "noleggio" && (tLower === "vendita" || tLower === "usato")) {
                    return false;
                }
                if (tipo === "usato" && tLower === "noleggio") {
                    return false;
                }
            }

            // Filtro categoria dinamico
            if (categoria && categoria !== "Tutti") {
                const itemCat = (item.categoria || "").toLowerCase();
                const targetCat = categoria.toLowerCase();
                if (!itemCat.includes(targetCat) && !targetCat.includes(itemCat)) {
                    return false;
                }
            }

            // Filtro comune / zona di ritiro
            if (comune) {
                const searchComune = comune.toLowerCase();
                const itemComune = (item.comune || item.zona || "").toLowerCase();
                if (!itemComune.includes(searchComune)) {
                    return false;
                }
            }

            // Filtro testuale di ricerca (titolo, descrizione, comune, categoria)
            if (q) {
                const queryText = q.toLowerCase();
                const matchTitle = (item.titolo || "").toLowerCase().includes(queryText);
                const matchDesc = (item.descrizione || "").toLowerCase().includes(queryText);
                const matchCat = (item.categoria || "").toLowerCase().includes(queryText);
                const matchCom = (item.comune || item.zona || "").toLowerCase().includes(queryText);
                if (!matchTitle && !matchDesc && !matchCat && !matchCom) {
                    return false;
                }
            }

            // Filtro prezzo min
            if (min) {
                const minVal = parseFloat(min);
                if (!isNaN(minVal) && Number(item.prezzo) < minVal) {
                    return false;
                }
            }

            // Filtro prezzo max
            if (max) {
                const maxVal = parseFloat(max);
                if (!isNaN(maxVal) && Number(item.prezzo) > maxVal) {
                    return false;
                }
            }

            return true;
        });
    }, [items, tipo, categoria, comune, q, min, max]);

    const applyFilters = (e) => {
        e?.preventDefault();
        const query = new URLSearchParams();
        if (q) query.set("q", q);
        if (comune) query.set("comune", comune);
        if (categoria && categoria !== "Tutti") query.set("categoria", categoria);
        if (min) query.set("min", min);
        if (max) query.set("max", max);
        setParams(query);
    };

    const handleSelectCategory = (cat) => {
        setCategoria(cat);
        const query = new URLSearchParams(params);
        if (cat === "Tutti" || !cat) {
            query.delete("categoria");
        } else {
            query.set("categoria", cat);
        }
        setParams(query);
    };

    const resetFilters = () => {
        setQ("");
        setComune("");
        setCategoria("Tutti");
        setMin("");
        setMax("");
        setParams(new URLSearchParams());
    };

    const handleSaveCustomCredentials = async (e) => {
        e.preventDefault();
        const cleanedUrl = cleanSupabaseUrl(inputUrl);
        const cleanedKey = cleanSupabaseKey(inputKey);

        if (!cleanedUrl || !cleanedKey) {
            toast.error("Inserisci sia l'URL del progetto sia la chiave Anon");
            return;
        }

        setTesting(true);
        try {
            // Test query diretta prima di salvare per verificare validità della chiave
            const testClient = createClient(cleanedUrl, cleanedKey);
            const { error: testErr } = await testClient.from("marketplace").select("id").limit(1);

            if (testErr) {
                const isInvalidKey =
                    (testErr.message || "").toLowerCase().includes("invalid api key") ||
                    (testErr.hint || "").toLowerCase().includes("api key") ||
                    testErr.code === "PGRST301";

                if (isInvalidKey) {
                    toast.error(
                        "Chiave API non valida: assicurati di copiare la chiave 'anon public' da Project Settings > API su Supabase."
                    );
                    setTesting(false);
                    return;
                }
            }

            configureSupabase(cleanedUrl, cleanedKey, true);
            setAuthKeyError(null);
            toast.success("Credenziali Supabase collegate e verificate con successo!");
            setConfigOpen(false);
        } catch (err) {
            console.error("Test Supabase err:", err);
            // In caso di errore di rete prova comunque a configurare
            configureSupabase(cleanedUrl, cleanedKey, true);
            toast.info("Credenziali salvate. Tentativo di connessione in corso...");
            setConfigOpen(false);
        } finally {
            setTesting(false);
        }
    };

    const handleClearCredentials = () => {
        resetSupabaseCredentials();
        setInputUrl("");
        setInputKey("");
        setAuthKeyError(null);
        toast.info("Credenziali rimosse. Ripristinato catalogo di riserva.");
        setConfigOpen(false);
    };

    const hasFilters = [...params.keys()].length > 0 || (categoria && categoria !== "Tutti");

    return (
        <div className="bg-navy min-h-screen" data-testid={`annunci-page-${tipo}`}>
            {/* Header di sezione con filtri */}
            <section className="relative border-b border-white/10 bg-navy-600/30 pt-28 sm:pt-32 pb-10 overflow-hidden">
                <div className="absolute inset-0 grid-pattern opacity-50" aria-hidden="true" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand flex items-center gap-2">
                                <c.icon className="h-4 w-4" /> {c.eyebrow}
                            </p>
                            <h1 className="mt-2 font-display font-black tracking-tight text-3xl sm:text-4xl text-white">
                                {c.title}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400">
                                {c.text}
                            </p>
                        </div>
                    </div>

                    {/* Filtri a bottoni dinamici per Categoria (accesso rapido) */}
                    <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
                        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] shrink-0 mr-1">
                            Categorie:
                        </span>
                        {availableCategories.map((cat) => {
                            const isSelected = categoria === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleSelectCategory(cat)}
                                    data-testid={`category-filter-${cat}`}
                                    className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all duration-200 border ${
                                        isSelected
                                            ? "bg-brand text-white border-brand shadow-md shadow-brand/20"
                                            : "bg-navy-800/80 text-slate-300 border-white/10 hover:border-brand/40 hover:text-white"
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    {/* Form di ricerca avanzata */}
                    <form
                        onSubmit={applyFilters}
                        data-testid="annunci-filters"
                        className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-2"
                    >
                        <label className={`${inputWrap} md:col-span-4`}>
                            <Search className="h-4 w-4 text-brand shrink-0" />
                            <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                data-testid="annunci-q-input"
                                placeholder="Cerca per attrezzo, modello o marca"
                                className={inputCls}
                            />
                        </label>

                        <label className={`${inputWrap} md:col-span-3`}>
                            <MapPin className="h-4 w-4 text-brand shrink-0" />
                            <Input
                                value={comune}
                                onChange={(e) => setComune(e.target.value)}
                                data-testid="annunci-zona-input"
                                placeholder="Comune di ritiro"
                                className={inputCls}
                            />
                        </label>

                        <div className="md:col-span-3">
                            <Select
                                value={categoria || "Tutti"}
                                onValueChange={(v) => handleSelectCategory(v)}
                            >
                                <SelectTrigger
                                    data-testid="annunci-categoria-select"
                                    className="w-full h-full rounded-xl bg-navy/80 border-white/10 text-white"
                                >
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-700 border-white/10 text-white">
                                    {availableCategories.map((x) => (
                                        <SelectItem key={x} value={x}>
                                            {x}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <label className={`${inputWrap} md:col-span-1`}>
                            <Euro className="h-4 w-4 text-brand shrink-0" />
                            <Input
                                type="number"
                                min="0"
                                value={min}
                                onChange={(e) => setMin(e.target.value)}
                                data-testid="annunci-min-input"
                                placeholder="Min"
                                className={inputCls}
                            />
                        </label>

                        <label className={`${inputWrap} md:col-span-1`}>
                            <Euro className="h-4 w-4 text-brand shrink-0" />
                            <Input
                                type="number"
                                min="0"
                                value={max}
                                onChange={(e) => setMax(e.target.value)}
                                data-testid="annunci-max-input"
                                placeholder="Max"
                                className={inputCls}
                            />
                        </label>

                        <div className="md:col-span-12 flex flex-wrap items-center gap-2 pt-2">
                            <Button
                                type="submit"
                                data-testid="annunci-filter-button"
                                className="rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-6 shadow-md shadow-brand/20"
                            >
                                Filtra
                            </Button>

                            {hasFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={resetFilters}
                                    data-testid="annunci-reset-button"
                                    className="rounded-xl text-slate-300 hover:text-white hover:bg-white/5"
                                >
                                    Azzera filtri
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={fetchSupabaseItems}
                                disabled={loading}
                                className="rounded-xl border-white/10 text-slate-300 hover:text-white hover:bg-white/5 gap-1.5"
                                title="Aggiorna da Supabase"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                                Ricarica
                            </Button>

                            <Link
                                to={tipo === "noleggio" ? "/mercatino" : "/noleggio"}
                                data-testid="annunci-switch-link"
                                className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-white transition-colors"
                            >
                                {tipo === "noleggio" ? "Vai al Marketplace Usato" : "Vai al Noleggio Attrezzi"}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </form>
                </div>
            </section>

            {/* Griglia annunci / Stati di Caricamento ed Errore */}
            <section className="py-10 sm:py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Stato di Errore non bloccante */}
                    {error && (
                        <div
                            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center max-w-xl mx-auto mb-8"
                            data-testid="annunci-error"
                        >
                            <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
                            <h3 className="mt-2 font-display font-bold text-white text-base">
                                Avviso di connessione
                            </h3>
                            <p className="mt-1 text-xs text-red-300 leading-relaxed">
                                {error}
                            </p>
                            <div className="mt-4 flex justify-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={fetchSupabaseItems}
                                    className="rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold gap-1.5 text-xs"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" /> Riprova
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfigOpen(true)}
                                    className="rounded-full border-white/20 text-white hover:bg-white/10 text-xs"
                                >
                                    Verifica credenziali
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Stato di Caricamento (Skeleton) */}
                    {loading && (
                        <div data-testid="annunci-loading">
                            <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                                <span>Caricamento attrezzi in corso…</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <CardSkeleton />
                                <CardSkeleton />
                                <CardSkeleton />
                                <CardSkeleton />
                            </div>
                        </div>
                    )}

                    {/* Stato vuoto */}
                    {!loading && filteredItems.length === 0 && (
                        <div
                            className="rounded-2xl border border-white/10 bg-navy-700/60 p-10 text-center max-w-xl mx-auto"
                            data-testid="annunci-empty"
                        >
                            <SearchX className="h-10 w-10 text-slate-500 mx-auto" />
                            <h3 className="mt-4 font-display font-bold text-white text-lg">
                                {c.empty}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Prova a selezionare un'altra categoria o ad azzerare i filtri di ricerca.
                            </p>
                            {hasFilters && (
                                <Button
                                    onClick={resetFilters}
                                    variant="outline"
                                    className="mt-5 rounded-full border-white/20 text-white hover:bg-white/10"
                                >
                                    Mostra tutti gli annunci
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Risultati filtrati */}
                    {!loading && filteredItems.length > 0 && (
                        <>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <p className="text-sm text-slate-400" data-testid="annunci-count">
                                    <span className="font-semibold text-white">{filteredItems.length}</span>{" "}
                                    {filteredItems.length === 1 ? "attrezzo disponibile" : "attrezzi disponibili"}
                                    {categoria && categoria !== "Tutti" && (
                                        <span> per <strong className="text-brand">{categoria}</strong></span>
                                    )}
                                </p>
                            </div>

                            <div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                                data-testid="annunci-grid"
                            >
                                {filteredItems.map((a, i) => (
                                    <AnnuncioCard
                                        key={a.id}
                                        a={a}
                                        index={i}
                                        fav={
                                            isAzienda
                                                ? {
                                                      active: true,
                                                      saved: savedIds.has(a.id),
                                                      onToggle: toggleFav,
                                                  }
                                                : null
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Dialog configurazione rapida Supabase per test */}
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogContent className="bg-navy-800 border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold">
                            <Database className="h-5 w-5 text-brand" /> Configura Server Supabase
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm">
                            Inserisci l'URL del progetto e la <strong>Anon public key</strong> (NON la service_role).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveCustomCredentials} className="space-y-4 mt-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">
                                Project URL (es. https://xyz.supabase.co)
                            </label>
                            <Input
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                                className="bg-navy-900 border-white/10 text-white text-xs font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">
                                Anon Public Key (anon / public)
                            </label>
                            <Input
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                className="bg-navy-900 border-white/10 text-white text-xs font-mono"
                            />
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                💡 Su Supabase vai su <strong>Project Settings &gt; API</strong> e copia la chiave con etichetta <strong>anon public</strong> (inizia tipicamente per <code className="text-emerald-400">eyJ...</code>). Non inserire virgolette o spazi.
                            </p>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-2 justify-end">
                            {localStorage.getItem(STORAGE_KEY_URL) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearCredentials}
                                    className="text-red-400 hover:text-red-300 hover:bg-white/5 mr-auto text-xs"
                                >
                                    Rimuovi credenziali salvate
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfigOpen(false)}
                                className="border-white/10 text-slate-300 hover:bg-white/5 text-xs"
                            >
                                Annulla
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={testing}
                                className="bg-brand hover:bg-brand-dark text-white font-semibold shadow-md shadow-brand/20 text-xs gap-1.5"
                            >
                                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                                {testing ? "Verifica in corso..." : "Verifica e Collega"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
