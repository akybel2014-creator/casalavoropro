import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    BookOpen,
    ChevronRight,
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Sparkles,
    Search,
    Share2,
    CheckCircle2,
    Lightbulb,
    FileText,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import ArticleBonusEdilizi2027, { ARTICLE_METADATA } from "@/pages/ArticleBonusEdilizi2027";
import ArticleRistrutturazioniCasa, { ARTICLE_RISTRUTTURAZIONI_METADATA } from "@/pages/ArticleRistrutturazioniCasa";
import ArticleImpiantiRiscaldamento, { ARTICLE_IMPIANTI_METADATA } from "@/pages/ArticleImpiantiRiscaldamento";
import ArticleEfficienzaEnergetica, { ARTICLE_EFFICIENZA_METADATA } from "@/pages/ArticleEfficienzaEnergetica";

const ALL_PUBLISHED_ARTICLES = [
    ARTICLE_EFFICIENZA_METADATA,
    ARTICLE_IMPIANTI_METADATA,
    ARTICLE_RISTRUTTURAZIONI_METADATA,
    ARTICLE_METADATA,
];

const CATEGORIES = [
    { id: "tutti", label: "Tutte le categorie" },
    { id: "ristrutturazioni", label: "Ristrutturazioni" },
    { id: "impianti", label: "Impianti e riscaldamento" },
    { id: "efficienza", label: "Efficienza energetica" },
    { id: "noleggio", label: "Noleggio & Attrezzature" },
    { id: "normative", label: "Normative & Bonus Edili" },
];

export default function Blog() {
    const { slug } = useParams();
    const [selectedCategory, setSelectedCategory] = useState("tutti");
    const [searchQuery, setSearchQuery] = useState("");
    const [showTemplate, setShowTemplate] = useState(false);

    // Se l'utente visita l'articolo specifico sull'efficienza energetica
    if (slug === ARTICLE_EFFICIENZA_METADATA.slug) {
        return <ArticleEfficienzaEnergetica />;
    }

    // Se l'utente visita l'articolo specifico sugli impianti di riscaldamento
    if (slug === ARTICLE_IMPIANTI_METADATA.slug) {
        return <ArticleImpiantiRiscaldamento />;
    }

    // Se l'utente visita l'articolo specifico sulle ristrutturazioni casa
    if (slug === ARTICLE_RISTRUTTURAZIONI_METADATA.slug) {
        return <ArticleRistrutturazioniCasa />;
    }

    // Se l'utente visita l'articolo specifico sui bonus edilizi 2027
    if (slug === ARTICLE_METADATA.slug) {
        return <ArticleBonusEdilizi2027 />;
    }

    // Se l'utente visita un altro :slug oppure attiva l'anteprima del modello
    const isSingleArticle =
        (Boolean(slug) &&
            slug !== ARTICLE_METADATA.slug &&
            slug !== ARTICLE_RISTRUTTURAZIONI_METADATA.slug &&
            slug !== ARTICLE_IMPIANTI_METADATA.slug &&
            slug !== ARTICLE_EFFICIENZA_METADATA.slug) ||
        showTemplate;

    if (isSingleArticle) {
        return (
            <SingleArticleTemplate
                slug={slug}
                onBack={() => {
                    setShowTemplate(false);
                }}
            />
        );
    }

    const publishedArticles = ALL_PUBLISHED_ARTICLES.filter((art) => {
        const matchesCategory = selectedCategory === "tutti" || art.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
            !q ||
            art.title.toLowerCase().includes(q) ||
            art.excerpt.toLowerCase().includes(q) ||
            art.categoryLabel.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20" data-testid="blog-page">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200">Blog & Guide</span>
                </nav>

                {/* Header */}
                <div className="max-w-3xl mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 mb-4">
                        <BookOpen className="h-3.5 w-3.5" />
                        Guide pratiche e approfondimenti
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                        Blog & Guide per la Casa
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                        Approfondimenti tecnici, novità su bonus edilizi, consigli per scegliere artigiani qualificati
                        e guide per ottimizzare consumi edili ed energetici.
                    </p>
                </div>

                {/* Filtri categorie e ricerca */}
                <div className="mb-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    {/* Categorie */}
                    <div className="flex flex-wrap items-center gap-2">
                        {CATEGORIES.map((cat) => {
                            const active = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                        active
                                            ? "bg-brand text-white shadow-sm shadow-brand/20"
                                            : "bg-navy-700/60 text-slate-400 hover:text-white hover:bg-navy-700 border border-white/10"
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Ricerca */}
                    <div className="relative min-w-[240px] max-w-sm">
                        <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cerca argomenti o guide…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-700/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand"
                        />
                    </div>
                </div>

                {/* Articoli Pubblicati */}
                {publishedArticles.length > 0 && (
                    <div className="mb-14">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-display font-bold text-xl text-white">Articoli in Primo Piano</h2>
                                <p className="text-xs text-slate-400">Guide normative e approfondimenti tecnici per i tuoi lavori</p>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                Guida aggiornata
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publishedArticles.map((art) => (
                                <Link
                                    key={art.slug}
                                    to={`/blog/${art.slug}`}
                                    className="group rounded-3xl border border-white/10 bg-navy-700/60 p-6 sm:p-7 flex flex-col justify-between transition-all hover:border-brand/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand/5"
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-brand/10 text-brand border border-brand/20">
                                                {art.categoryLabel}
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                {art.readTime}
                                            </span>
                                        </div>
                                        <h3 className="font-display font-bold text-white text-lg sm:text-xl group-hover:text-brand transition-colors line-clamp-2">
                                            {art.title}
                                        </h3>
                                        <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                                            {art.excerpt}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-slate-400">{art.date}</span>
                                        <span className="text-brand font-semibold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Leggi articolo completo <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Box Editoriale: Prossime uscite e approfondimenti */}
                <div className="rounded-3xl border border-white/10 bg-navy-700/60 p-8 sm:p-12 text-center max-w-3xl mx-auto my-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 text-brand mb-4">
                        <Sparkles className="h-7 w-7" />
                    </div>
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-2">
                        {publishedArticles.length > 0 ? "Altri articoli in redazione" : "Nessun articolo trovato"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto mb-6">
                        {publishedArticles.length > 0
                            ? "La nostra redazione tecnica sta preparando nuove guide su manutenzione impianti, conformità aziendale e risparmio energetico."
                            : "Nessuna guida corrisponde ai filtri selezionati. Prova a selezionare 'Tutte le categorie' o a reimpostare la ricerca."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto mb-6 text-xs text-slate-300">
                        <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                            <span className="font-semibold text-brand block mb-1">Guide cantieri</span>
                            Come preparare un capitolato chiaro ed evitare imprevisti sui costi.
                        </div>
                        <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                            <span className="font-semibold text-brand block mb-1">Checklist Impresa</span>
                            Come verificare l'idoneità tecnico-professionale dell'impresa prima di iniziare.
                        </div>
                        <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                            <span className="font-semibold text-brand block mb-1">Efficienza bollette</span>
                            Analizzare i consumi luce e gas e dimensionare pompe di calore e fotovoltaico.
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                            type="button"
                            onClick={() => setShowTemplate(true)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 text-xs"
                        >
                            <FileText className="h-3.5 w-3.5 mr-2 text-brand" />
                            Visualizza modello struttura articolo
                        </Button>
                        <Button asChild className="bg-brand hover:bg-brand/90 text-white text-xs">
                            <Link to="/nuova-richiesta">
                                Richiedi un preventivo ora
                                <ArrowRight className="h-3.5 w-3.5 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Struttura per schede articoli (anteprima scheletro card) */}
                <div className="mt-16 pt-10 border-t border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-display font-bold text-lg text-white">
                                Struttura schede editoriali
                            </h3>
                            <p className="text-xs text-slate-400">
                                Layout standard per la presentazione degli articoli del magazine
                            </p>
                        </div>
                        <span className="text-xs font-mono text-slate-500">Formato Card Redazionale</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-75">
                        <ArticleCardSkeleton
                            category="Ristrutturazioni"
                            title="Modello: Come pianificare una ristrutturazione senza sorprese"
                            readTime="5 min di lettura"
                            onClick={() => setShowTemplate(true)}
                        />
                        <ArticleCardSkeleton
                            category="Efficienza Energetica"
                            title="Modello: Lettura della bolletta elettrica e fasce di consumo"
                            readTime="4 min di lettura"
                            onClick={() => setShowTemplate(true)}
                        />
                        <ArticleCardSkeleton
                            category="Noleggio & Attrezzature"
                            title="Modello: Quando conviene noleggiare macchinari edili da cantiere"
                            readTime="6 min di lettura"
                            onClick={() => setShowTemplate(true)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ArticleCardSkeleton({ category, title, readTime, onClick }) {
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer rounded-2xl border border-white/10 bg-navy-700/60 overflow-hidden transition-all hover:border-brand/40 hover:-translate-y-1 flex flex-col justify-between"
        >
            <div className="p-6">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full font-semibold bg-brand/10 text-brand border border-brand/20">
                        {category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3 w-3" />
                        {readTime}
                    </span>
                </div>
                <h4 className="font-display font-bold text-white text-base group-hover:text-brand transition-colors line-clamp-2">
                    {title}
                </h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                    Struttura tipo con introduzione al tema, riferimenti alle buone pratiche di cantiere e consigli per la scelta del professionista.
                </p>
            </div>
            <div className="px-6 py-3.5 border-t border-white/5 bg-white/5 flex items-center justify-between text-xs text-brand font-semibold">
                <span>Leggi il modello completo</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
}

function SingleArticleTemplate({ slug, onBack }) {
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: "Modello Articolo CasaLavoroPRO", url: window.location.href }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copiato negli appunti");
        }
    };

    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <Link to="/blog" onClick={onBack} className="hover:text-white transition-colors">Blog & Guide</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200 truncate">Modello Articolo</span>
                </nav>

                {/* Torna indietro */}
                <div className="mb-6">
                    {onBack ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Torna all'elenco articoli
                        </button>
                    ) : (
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Torna all'elenco articoli
                        </Link>
                    )}
                </div>

                {/* Header Articolo */}
                <header className="border-b border-white/10 pb-8 mb-10">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                            Guida & Normative
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Modello Struttura Editoriale</span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight">
                        {slug
                            ? `Guida Tecnica: ${slug.replace(/-/g, " ")}`
                            : "Come pianificare i lavori in casa ed evitare contenziosi sui preventivi"}
                    </h1>

                    <p className="mt-4 text-base text-slate-300 leading-relaxed">
                        Un approccio metodologico per definire il capitolato, richiedere offerte comparabili tra aziende verificate
                        e verificare la regolarità contributiva e assicurativa del cantiere.
                    </p>

                    {/* Metadati Autore / Data / Tempo */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <User className="h-3.5 w-3.5 text-brand" />
                                Redazione Tecnica CasaLavoroPRO
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                Pubblicazione programmata
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                5 min di lettura stimati
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 text-xs transition-colors"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            Condividi
                        </button>
                    </div>
                </header>

                {/* Box Sommario / Indice Articolo */}
                <div className="mb-10 rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6">
                    <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-brand" />
                        Sommario dell'articolo
                    </h2>
                    <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                        <li>Definire l'obiettivo dell'intervento e i vincoli strutturali</li>
                        <li>Come richiedere preventivi dettagliati e confrontabili</li>
                        <li>Controlli preliminari: visura camerale, abilitazioni e assicurazioni</li>
                        <li>La gestione dello stato avanzamento lavori (SAL) e il registro fotografico</li>
                        <li>Checklist finale e collaudo</li>
                    </ol>
                </div>

                {/* Corpo dell'Articolo (Tipografia e Sezioni) */}
                <article className="space-y-8 text-sm leading-relaxed text-slate-300">
                    <section>
                        <h2 className="font-display font-bold text-2xl text-white mb-3">
                            1. Definire l'obiettivo dell'intervento e i vincoli strutturali
                        </h2>
                        <p className="mb-3">
                            Prima di contattare un'impresa o un professionista, è essenziale formalizzare un elenco chiaro delle opere desiderate.
                            Una descrizione generica (es. "ristrutturazione bagno") espone al rischio di offerte economicamente non confrontabili,
                            poiché ciascun artigiano potrebbe stimare materiali, demolizioni o impiantistica secondo standard differenti.
                        </p>
                        <p>
                            Documentare lo stato dei luoghi con fotografie nitide dei punti di allaccio (scarichi, quadri elettrici, canne fumarie)
                            aiuta gli artigiani a identificare eventuali difficoltà tecniche già nella risposta preliminare.
                        </p>
                    </section>

                    {/* Box Consiglio dell'esperto */}
                    <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5 flex items-start gap-3.5">
                        <Lightbulb className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1 text-slate-300">
                            <strong className="text-white block font-semibold">Il consiglio tecnico di CasaLavoroPRO:</strong>
                            Richiedi sempre che il preventivo sia suddiviso per voci di spesa: demolizioni e smaltimento in discarica autorizzata,
                            fornitura materiali, manodopera e collaudo. In questo modo potrai confrontare i singoli costi unitari.
                        </div>
                    </div>

                    <section>
                        <h2 className="font-display font-bold text-2xl text-white mb-3">
                            2. Controlli preliminari: visura camerale e abilitazioni professionali
                        </h2>
                        <p className="mb-3">
                            La regolarità societaria e assicurativa dell'impresa non è solo una garanzia di affidabilità, ma un preciso dovere
                            di verifica posto a carico del committente ai sensi del D.Lgs. 81/2008 (Testo Unico sulla Sicurezza).
                        </p>
                        <ul className="space-y-2 list-none text-xs">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span><strong>Visura camerale attiva:</strong> certifica l'iscrizione al Registro Imprese della Camera di Commercio con codice ATECO idoneo.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span><strong>Abilitazione DM 37/08:</strong> per gli impianti idraulici, elettrici e a gas, l'impresa deve essere abilitata al rilascio della Dichiarazione di Conformità (Di.Co.).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span><strong>Polizza RC Terzi:</strong> assicura contro danni accidentali a cose o persone durante lo svolgimento del cantiere.</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-display font-bold text-2xl text-white mb-3">
                            3. Registro fotografico e certificazione delle opere
                        </h2>
                        <p>
                            Mantenere un registro visivo con foto dello stato "prima, durante e dopo" l'intervento permette di documentare
                            le lavorazioni non più visibili a cantiere ultimato (es. passaggio tubazioni sottotraccia, isolamento a cappotto o guaine impermeabilizzanti).
                        </p>
                    </section>
                </article>

                {/* Box CTA di conversione al termine dell'articolo */}
                <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-brand/10 via-navy-700/60 to-navy-700/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-brand">Stai pianificando un lavoro?</span>
                        <h3 className="font-display font-bold text-xl text-white mt-1">
                            Trova artigiani verificati nella tua zona
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
                            Pubblica gratuitamente la tua richiesta su CasaLavoroPRO: ricevi preventivi da professionisti controllati.
                        </p>
                    </div>
                    <Button asChild className="bg-brand hover:bg-brand/90 text-white shrink-0">
                        <Link to="/nuova-richiesta">
                            Richiedi preventivo gratuito
                            <ArrowRight className="h-4 w-4 ml-1.5" />
                        </Link>
                    </Button>
                </div>

                {/* Footer Articolo */}
                <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                    {onBack ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Torna a tutti gli articoli
                        </button>
                    ) : (
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Torna a tutti gli articoli
                        </Link>
                    )}
                    <Link to="/aziende" className="text-brand hover:underline">
                        Esplora la directory delle imprese verificate →
                    </Link>
                </div>
            </div>
        </div>
    );
}
