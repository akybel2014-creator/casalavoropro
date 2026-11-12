import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Flame, Zap, Hammer, Paintbrush, Trees, LayoutGrid, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

export const CATEGORIES = [
    { name: "Idraulica", icon: Wrench, id: "category-card-idraulica" },
    { name: "Termoidraulica", icon: Flame, id: "category-card-termoidraulica" },
    { name: "Elettricità", icon: Zap, id: "category-card-elettricita" },
    { name: "Edilizia", icon: Hammer, id: "category-card-edilizia" },
    { name: "Imbiancatura", icon: Paintbrush, id: "category-card-imbiancatura" },
    { name: "Giardinaggio", icon: Trees, id: "category-card-giardinaggio" },
    { name: "Consulenti Luce e Gas", icon: Zap, id: "category-card-luce-gas" },
    { name: "Altri Servizi", icon: LayoutGrid, id: "category-card-altri-servizi" },
];

// Elenco completo delle categorie di servizio selezionabili (registrazione azienda, nuova richiesta, filtri).
// La griglia in home resta curata (CATEGORIES); qui c'è l'elenco completo deduplicato.
export const SERVICE_CATEGORIES = [
    "Assicurazione",
    "Broker",
    "Catering",
    "Consulenti Luce e Gas",
    "Edilizia",
    "Elettricità",
    "Geometra",
    "Giardinaggio",
    "Giardiniere",
    "Idraulica",
    "Idraulico",
    "Imbiancatura",
    "Imbianchino",
    "Installazione Condizionatori",
    "Investigatore Privato",
    "NCC",
    "Noleggio con Conducente",
    "Pulizia",
    "Pulizie a Fondo",
    "Riparazione Elettrodomestici",
    "Ristrutturazione Casa",
    "Ristrutturazioni",
    "Svuota Cantine",
    "Termoidraulica",
    "Trasporti",
    "Zanzariere",
    "Altri Servizi",
];

// Normalizza i nomi categoria (minuscolo, senza accenti) per allineare card e dati reali.
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Mappatura sinonimi e sottocategorie verso le 8 card principali della griglia
const CATEGORY_MAP = {
    "idraulica": "idraulica",
    "idraulico": "idraulica",
    "riparazione elettrodomestici": "idraulica",
    "termoidraulica": "termoidraulica",
    "installazione condizionatori": "termoidraulica",
    "elettricita": "elettricita",
    "elettricista": "elettricita",
    "edilizia": "edilizia",
    "ristrutturazioni": "edilizia",
    "ristrutturazione casa": "edilizia",
    "geometra": "edilizia",
    "imbiancatura": "imbiancatura",
    "imbianchino": "imbiancatura",
    "giardinaggio": "giardinaggio",
    "giardiniere": "giardinaggio",
    "consulenti luce e gas": "consulenti luce e gas",
    "broker": "consulenti luce e gas",
    "altri servizi": "altri servizi",
    "pulizia": "altri servizi",
    "pulizie a fondo": "altri servizi",
    "trasporti": "altri servizi",
    "svuota cantine": "altri servizi",
    "zanzariere": "altri servizi",
    "ncc": "altri servizi",
    "noleggio con conducente": "altri servizi",
    "catering": "altri servizi",
    "assicurazione": "altri servizi",
    "investigatore privato": "altri servizi",
};

export default function CategoryGrid() {
    const [counts, setCounts] = useState({});

    const loadCounts = useCallback(async () => {
        try {
            // 1. Prova prima da Supabase per reattività in tempo reale e supporto Cloudflare Pages
            const { data: supaAziende, error: supaErr } = await supabase
                .from("aziende")
                .select("id, categorie");

            if (!supaErr && Array.isArray(supaAziende) && supaAziende.length > 0) {
                const lookup = {};
                for (const cat of CATEGORIES) {
                    lookup[norm(cat.name)] = 0;
                }
                for (const a of supaAziende) {
                    const azCategories = Array.isArray(a.categorie) ? a.categorie : [];
                    const matched = new Set();
                    for (const rawCat of azCategories) {
                        const n = norm(rawCat);
                        const target = CATEGORY_MAP[n] || n;
                        matched.add(target);
                    }
                    for (const target of matched) {
                        lookup[target] = (lookup[target] || 0) + 1;
                    }
                }
                setCounts(lookup);
                return;
            }
        } catch {
            /* fallback su api backend */
        }

        // 2. Fallback su API backend locale
        try {
            const { data } = await api.get("/aziende/categorie-count");
            const lookup = {};
            for (const cat of CATEGORIES) {
                lookup[norm(cat.name)] = 0;
            }
            Object.entries(data?.counts || {}).forEach(([k, v]) => {
                const n = norm(k);
                const target = CATEGORY_MAP[n] || n;
                lookup[target] = (lookup[target] || 0) + v;
            });
            setCounts(lookup);
        } catch {
            /* silenzioso */
        }
    }, []);

    useEffect(() => {
        loadCounts();

        // Supabase Realtime channel su public.aziende
        let channel = null;
        try {
            channel = supabase
                .channel("realtime-categorygrid")
                .on("postgres_changes", { event: "*", schema: "public", table: "aziende" }, () => {
                    loadCounts();
                })
                .subscribe();
        } catch (err) {
            console.warn("[CategoryGrid] Realtime non disponibile:", err);
        }

        // Eventi locali finestra (stesso tab al submit registrazione azienda con reattività ottimistica immediata)
        const handleNewAziendaEvent = (e) => {
            const az = e?.detail;
            if (az && Array.isArray(az.categorie) && az.categorie.length > 0) {
                setCounts((prev) => {
                    const next = { ...prev };
                    const matched = new Set();
                    for (const rawCat of az.categorie) {
                        const n = norm(rawCat);
                        const target = CATEGORY_MAP[n] || n;
                        matched.add(target);
                    }
                    for (const target of matched) {
                        next[target] = (next[target] || 0) + 1;
                    }
                    return next;
                });
            }
            loadCounts();
        };

        const onSimpleUpdate = () => loadCounts();
        window.addEventListener("azienda-registered", handleNewAziendaEvent);
        window.addEventListener("aziende-updated", handleNewAziendaEvent);
        window.addEventListener("supabase-configured", onSimpleUpdate);
        window.addEventListener("focus", onSimpleUpdate);

        // Canale broadcast cross-tab
        let bc = null;
        try {
            bc = new BroadcastChannel("casalavoropro_realtime");
            bc.onmessage = (msg) => {
                if (msg.data?.type === "AZIENDA_REGISTERED" && msg.data?.payload) {
                    handleNewAziendaEvent({ detail: msg.data.payload });
                } else if (msg.data?.type === "AZIENDE_UPDATED") {
                    loadCounts();
                }
            };
        } catch { /* ignora */ }

        return () => {
            if (channel) supabase.removeChannel(channel);
            window.removeEventListener("azienda-registered", handleNewAziendaEvent);
            window.removeEventListener("aziende-updated", handleNewAziendaEvent);
            window.removeEventListener("supabase-configured", onSimpleUpdate);
            window.removeEventListener("focus", onSimpleUpdate);
            if (bc) bc.close();
        };
    }, [loadCounts]);

    return (
        <section id="categorie" className="relative bg-navy py-16 sm:py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.15 }}
                        transition={{ duration: 0.6 }}
                    >
                        <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Categorie</p>
                        <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">
                            Ogni lavoro ha il suo professionista
                        </h2>
                    </motion.div>
                    <Link to="/aziende" className="text-sm font-semibold text-brand hover:text-white transition-colors inline-flex items-center gap-1.5">
                        Vedi tutte le aziende <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {CATEGORIES.map((c, i) => {
                        const n = counts[norm(c.name)] || 0;
                        const label = `${n} ${n === 1 ? "azienda" : "aziende"}`;
                        return (
                        <motion.div
                            key={c.name}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.55, delay: (i % 4) * 0.08 }}
                        >
                            <Link
                                to={`/aziende?categoria=${encodeURIComponent(c.name)}`}
                                data-testid={c.id}
                                className="group flex flex-col items-start h-full rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-xl hover:shadow-brand/10 transition-all duration-300"
                            >
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand group-hover:bg-brand group-hover:text-navy transition-all duration-300">
                                    <c.icon className="h-6 w-6" />
                                </span>
                                <h3 className="mt-4 font-display font-bold text-white">{c.name}</h3>
                                <p className="mt-1 text-xs sm:text-sm text-slate-400" data-testid={`${c.id}-count`}>{label}</p>
                            </Link>
                        </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
