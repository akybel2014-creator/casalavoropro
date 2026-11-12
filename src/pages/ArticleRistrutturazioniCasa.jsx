import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
    BookOpen,
    ChevronRight,
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Share2,
    CheckCircle2,
    Lightbulb,
    FileText,
    ArrowRight,
    Hammer,
    Wrench,
    Paintbrush,
    Layers,
    Flame,
    Zap,
    HelpCircle,
    Info,
    ExternalLink,
    ShieldCheck,
    Building2,
    MapPin
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const ARTICLE_RISTRUTTURAZIONI_METADATA = {
    slug: "ristrutturazioni-casa",
    title: "Ristrutturazioni casa: guida pratica e richiesta di preventivo",
    seoTitle: "Ristrutturazioni Casa: Guida Pratica e Preventivo | CasaLavoroPRO",
    metaDescription: "Come pianificare una ristrutturazione casa, descrivere il lavoro per gli artigiani e richiedere preventivi dettagliati. Categorie, permessi e consigli.",
    canonicalUrl: "/blog/ristrutturazioni-casa",
    date: "2 Novembre 2026",
    updatedDate: "Aggiornato al 2 novembre 2026",
    readTime: "8 min di lettura",
    category: "ristrutturazioni",
    categoryLabel: "Ristrutturazioni",
    author: "Redazione Tecnica CasaLavoroPRO",
    reviewer: "Revisione Edile & Normativa",
    excerpt: "Guida completa per chi vuole rinnovare casa: come impostare la richiesta, chiarire gli interventi da eseguire per gli artigiani della zona, orientarsi tra edilizia libera e CILA e ricevere preventivi gratuiti."
};

const FAQ_ITEMS = [
    {
        q: "Come posso chiedere un preventivo per una ristrutturazione su CasaLavoroPRO?",
        a: "È sufficiente accedere al modulo di richiesta presente sulla piattaforma, selezionare la categoria d'intervento (come 'Ristrutturazioni', 'Edilizia' o 'Idraulica'), inserire la propria città o provincia e descrivere le lavorazioni necessarie. La richiesta viene notificata agli operatori iscritti e verificati attivi nella zona selezionata."
    },
    {
        q: "Quali informazioni è utile indicare nella descrizione del lavoro?",
        a: "Per consentire all'artigiano di valutare con precisione l'opera, è consigliabile indicare: quali ambienti si intendono rinnovare, le dimensioni indicative, i lavori principali (es. demolizione pavimento, rifacimento impianto idraulico, tinteggiatura), eventuali problemi presenti (infiltrazioni, crepe) e il periodo desiderato per l'avvio delle opere."
    },
    {
        q: "Posso chiedere un preventivo solo per un intervento parziale (es. solo bagno o cucina)?",
        a: "Sì. Il servizio consente di formulare richieste sia per ristrutturazioni integrali 'chiavi in mano', sia per interventi parziali circoscritti a singoli locali come il rifacimento del bagno, la posa di nuovi pavimenti o la sola tinteggiatura interna."
    },
    {
        q: "Quanto costa ristrutturare casa e da cosa dipende il prezzo?",
        a: "Il costo finale dipende da elementi specifici del singolo immobile: superficie, stato degli impianti sottotraccia, oneri di demolizione e smaltimento a discarica autorizzata, accessibilità del piano e qualità delle finiture scelte. Non esistono tariffe forfettarie fisse: ogni cantiere richiede un computo estimativo ad hoc."
    },
    {
        q: "Servono sempre permessi comunali per ristrutturare?",
        a: "No. Le opere di manutenzione ordinaria (sostituzione pavimenti, tinteggiature, rinnovo sanitari a parità di scarichi) ricadono in edilizia libera e non richiedono comunicazioni comunali. Interventi che modificano la distribuzione dei locali (apertura o spostamento di tramezzi) o rinnovano pesantemente gli impianti richiedono invece una CILA redatta da un tecnico abilitato."
    },
    {
        q: "La richiesta di preventivo su CasaLavoroPRO è gratuita?",
        a: "Sì. Per gli utenti privati la registrazione al portale e la pubblicazione della richiesta di preventivo sono totalmente gratuite e non prevedono commissioni a carico del committente. L'eventuale contratto d'opera e i relativi importi vengono definiti e concordati direttamente con l'impresa scelta."
    },
    {
        q: "Cosa succede dopo aver inviato la richiesta?",
        a: "Le imprese della categoria e della zona indicate ricevono la segnalazione. I professionisti disponibili possono rispondere con una stima preliminare o contattare il privato per concordare un sopralluogo tecnico di approfondimento prima di formulare il preventivo vincolante."
    }
];

export default function ArticleRistrutturazioniCasa() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = `${ARTICLE_RISTRUTTURAZIONI_METADATA.seoTitle} | CasaLavoroPRO`;
        return () => {
            document.title = prevTitle;
        };
    }, []);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: ARTICLE_RISTRUTTURAZIONI_METADATA.title,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link dell'articolo copiato negli appunti");
        }
    };

    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <Link to="/blog" className="hover:text-white transition-colors">Blog & Guide</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200">Ristrutturazioni casa</span>
                </nav>

                {/* Torna al Blog */}
                <div className="mb-6">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Torna all'elenco articoli
                    </Link>
                </div>

                {/* Header dell'articolo */}
                <header className="border-b border-white/10 pb-8 mb-10">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                            {ARTICLE_RISTRUTTURAZIONI_METADATA.categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {ARTICLE_RISTRUTTURAZIONI_METADATA.updatedDate}
                        </span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                        {ARTICLE_RISTRUTTURAZIONI_METADATA.title}
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                        {ARTICLE_RISTRUTTURAZIONI_METADATA.excerpt}
                    </p>

                    {/* Metadati Autore / Data / Tempo */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <User className="h-3.5 w-3.5 text-brand" />
                                {ARTICLE_RISTRUTTURAZIONI_METADATA.author}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_RISTRUTTURAZIONI_METADATA.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_RISTRUTTURAZIONI_METADATA.readTime}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 text-xs transition-colors"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            Condividi guida
                        </button>
                    </div>
                </header>

                {/* Box In Evidenza: "In Breve" */}
                <div className="mb-10 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-navy-700/80 to-navy-700/80 p-6 sm:p-7">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-brand shrink-0" />
                        <h2 className="font-display font-bold text-white text-base sm:text-lg">
                            Punti chiave per pianificare una ristrutturazione casa
                        </h2>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Descrizione dettagliata:</strong> Più chiaramente spieghi le lavorazioni desiderate e lo stato attuale dell'immobile, più i preventivi ricevuti saranno mirati e attendibili.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Verifica formale delle imprese:</strong> Su CasaLavoroPRO le aziende possono sottoporre Partita IVA e visura camerale a controllo formale per ottenere il badge di impresa verificata.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Permessi comunali:</strong> Le opere interne che non toccano strutture portanti richiedono solitamente una CILA (edilizia straordinaria), mentre le semplici sostituzioni di finiture ricadono in edilizia libera.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Servizio gratuito per i privati:</strong> L'invio della richiesta e il confronto dei preventivi sulla piattaforma non comportano alcuna commissione per il committente.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Box Sommario / Indice dell'articolo */}
                <div className="mb-10 rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6">
                    <p className="font-display font-bold text-xs text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-brand" />
                        Indice dell'articolo
                    </p>
                    <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                        <li><a href="#pianificare-lavori" className="hover:text-brand transition-colors">Pianificare una ristrutturazione: da dove partire</a></li>
                        <li><a href="#categorie-supportate" className="hover:text-brand transition-colors">I principali interventi e le categorie supportate</a></li>
                        <li><a href="#preparare-descrizione" className="hover:text-brand transition-colors">Come preparare una descrizione efficace del lavoro</a></li>
                        <li><a href="#come-funziona-piattaforma" className="hover:text-brand transition-colors">Come funziona la richiesta su CasaLavoroPRO</a></li>
                        <li><a href="#costi-e-preventivi" className="hover:text-brand transition-colors">Costi, preventivi e variabili di cantiere</a></li>
                        <li><a href="#permessi-cila-detrazioni" className="hover:text-brand transition-colors">Permessi edilizi: CILA, SCIA ed edilizia libera</a></li>
                        <li><a href="#faq" className="hover:text-brand transition-colors">Domande Frequenti (FAQ)</a></li>
                        <li><a href="#fonti-consultate" className="hover:text-brand transition-colors">Fonti istituzionali consultate</a></li>
                    </ol>
                </div>

                {/* Corpo editoriale */}
                <article className="space-y-10 text-sm leading-relaxed text-slate-300">
                    {/* Sezione 1: Pianificare */}
                    <section id="pianificare-lavori" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">01.</span>
                            Pianificare una ristrutturazione: da dove partire
                        </h2>
                        <p className="mb-3">
                            Rinnovare la propria casa è uno degli investimenti più rilevanti per una famiglia. Che si tratti di un intervento parziale o della ristrutturazione globale di un appartamento, il successo dei lavori e il rispetto del budget prefissato dipendono innanzitutto dalla fase di preparazione.
                        </p>
                        <p>
                            Un errore frequente è quello di richiedere preventivi generici (es. "quanto costa rifare un alloggio di 70 mq?") senza aver definito l'elenco delle necessità minime. Le ditte edili hanno bisogno di comprendere l'effettivo ambito d'intervento per elaborare computi chiari e comparabili tra loro.
                        </p>
                    </section>

                    {/* Sezione 2: Categorie supportate */}
                    <section id="categorie-supportate" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">02.</span>
                            I principali interventi e le categorie supportate
                        </h2>
                        <p className="mb-4">
                            All'interno di CasaLavoroPRO puoi indirizzare la tua richiesta verso operatori specializzati in base alla tipologia specifica delle opere:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                                <span className="font-bold text-white text-sm flex items-center gap-2">
                                    <Hammer className="h-4 w-4 text-brand" /> Ristrutturazione Completa ed Edilizia
                                </span>
                                <p className="text-xs text-slate-400">
                                    Demolizione e ricostruzione pareti divisorie, rifacimento massetti, intonaci, opere strutturali e gestione coordinata dei diversi artigiani in cantiere.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                                <span className="font-bold text-white text-sm flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-brand" /> Idraulica e Rifacimento Bagno
                                </span>
                                <p className="text-xs text-slate-400">
                                    Sostituzione colonne di scarico, adduzione acqua calda/fredda, impermeabilizzazione con guaine liquide, posa sanitari, rubinetterie e box doccia.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                                <span className="font-bold text-white text-sm flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-brand" /> Termoidraulica e Climatizzazione
                                </span>
                                <p className="text-xs text-slate-400">
                                    Pompe di calore, caldaie a condensazione, riscaldamento a pavimento, condizionatori split e rilascio delle dichiarazioni di conformità d'impianto (DM 37/08).
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                                <span className="font-bold text-white text-sm flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-brand" /> Impianti Elettrici
                                </span>
                                <p className="text-xs text-slate-400">
                                    Sostituzione centralini salvavita, rifacimento linee luce e prese sottotraccia, verifiche di sicurezza e predisposizioni per induzione o domotica.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                                <span className="font-bold text-white text-sm flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-brand" /> Pavimenti e Rivestimenti
                                </span>
                                <p className="text-xs text-slate-400">
                                    Posa di gres porcellanato, laminati, parquet in legno e rasature dei fondi per planarità perfetta.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                                <span className="font-bold text-white text-sm flex items-center gap-2">
                                    <Paintbrush className="h-4 w-4 text-brand" /> Imbiancatura e Cartongesso
                                </span>
                                <p className="text-xs text-slate-400">
                                    Tinteggiature interne traspiranti o lavabili, trattamenti antimuffa, pareti in cartongesso e controsoffitti per alloggiamento faretti.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 3: Come preparare la descrizione */}
                    <section id="preparare-descrizione" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">03.</span>
                            Come preparare una descrizione efficace del lavoro
                        </h2>
                        <p className="mb-3">
                            Non occorre utilizzare terminologia tecnica o formule complesse. Per consentire agli artigiani di capire cosa serve davvero, è sufficiente inserire nel campo di descrizione della richiesta:
                        </p>
                        <div className="space-y-2.5 text-xs text-slate-300 my-4">
                            <div className="p-3.5 rounded-xl border border-white/10 bg-navy-700/60 flex items-start gap-3">
                                <span className="h-6 w-6 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">1</span>
                                <div>
                                    <strong className="text-white block mb-0.5">La porzione di casa interessata:</strong>
                                    Indica chiaramente se si tratta di un singolo bagno, della cucina, della zona giorno o dell'intero alloggio, specificando la metratura indicativa.
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-navy-700/60 flex items-start gap-3">
                                <span className="h-6 w-6 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">2</span>
                                <div>
                                    <strong className="text-white block mb-0.5">Le condizioni di partenza:</strong>
                                    Spiega se l'immobile è abitato o vuoto, se gli impianti risalgono a molti anni fa o se sono presenti problemi evidenti come infiltrazioni, tubature arrugginite o crepe.
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-navy-700/60 flex items-start gap-3">
                                <span className="h-6 w-6 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">3</span>
                                <div>
                                    <strong className="text-white block mb-0.5">I materiali e le forniture:</strong>
                                    Chiarisci se intendi acquistare tu stesso piastrelle e sanitari o se desideri che sia la ditta a occuparsi della fornitura completa.
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-navy-700/60 flex items-start gap-3">
                                <span className="h-6 w-6 rounded-full bg-brand/20 text-brand font-bold flex items-center justify-center shrink-0">4</span>
                                <div>
                                    <strong className="text-white block mb-0.5">Accessibilità e tempistiche:</strong>
                                    Segnala il piano dell'alloggio, l'eventuale presenza dell'ascensore (importante per il calcolo della movimentazione macerie e materiali) e la data indicativa entro cui vorresti iniziare.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 4: Come funziona */}
                    <section id="come-funziona-piattaforma" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">04.</span>
                            Come funziona la richiesta su CasaLavoroPRO
                        </h2>
                        <p className="mb-3">
                            Il percorso di contatto tra privati e professionisti è stato strutturato per essere lineare e senza passaggi superflui:
                        </p>
                        <ul className="space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li><strong>Compilazione guidata:</strong> Dalla pagina "Nuova richiesta" selezioni la categoria (es. <em>Ristrutturazioni</em> o <em>Edilizia</em>), inserisci la zona e descrivi il lavoro.</li>
                            <li><strong>Notifica agli operatori locali:</strong> La piattaforma recapita l'avviso alle ditte e agli artigiani abilitati della provincia selezionata.</li>
                            <li><strong>Esame e risposta:</strong> I professionisti disponibili valutano la richiesta e possono risponderti con una quotazione preliminare o ricontattarti per concordare un sopralluogo tecnico di verifica.</li>
                            <li><strong>Scelta in piena libertà:</strong> Non c'è alcun obbligo di accettazione. Sei tu a decidere se e con quale impresa procedere alla firma del contratto d'opera.</li>
                        </ul>
                    </section>

                    {/* Sezione 5: Costi e preventivi */}
                    <section id="costi-e-preventivi" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">05.</span>
                            Costi, preventivi e variabili di cantiere
                        </h2>
                        <p className="mb-3">
                            Nel settore dell'edilizia non esistono tariffe orarie o al metro quadro standardizzate valide per qualunque situazione. Ogni immobile presenta variabili strutturali e logistiche determinanti:
                        </p>
                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2 mb-3">
                            <p><strong>Costi di demolizione e conferimento:</strong> Lo smaltimento delle macerie presso centri autorizzati, gli oneri di trasporto e l'eventuale noleggio di cassoni scarrabili o gru incidono sensibilmente sul totale.</p>
                            <p><strong>Impianti tecnologici:</strong> Il rifacimento di un impianto idrico o termico comporta aperture di tracce e chiusure a malta, oltre alle asseverazioni previste per legge.</p>
                            <p><strong>Ubicazione dell'immobile:</strong> Un cantiere al quarto piano senza ascensore o in centro storico con vincoli di transito ZTL richiede una logistica differente rispetto a un piano terra indipendente con agevole spazio di manovra.</p>
                        </div>
                        <p className="text-xs text-slate-400">
                            Proprio per queste ragioni, diffidare da preventivi "a scatola chiusa" troppo frettolosi è una buona regola: un'impresa seria richiederà sempre di verificare lo stato reale dei luoghi prima di siglare l'offerta definitiva.
                        </p>
                    </section>

                    {/* Sezione 6: Permessi e CILA */}
                    <section id="permessi-cila-detrazioni" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">06.</span>
                            Permessi edilizi: CILA, SCIA ed edilizia libera
                        </h2>
                        <p className="mb-3">
                            Prima di avviare qualsiasi cantiere è indispensabile inquadrare correttamente la tipologia edilizia delle opere in base al <strong>D.P.R. 380/2001 (Testo Unico dell'Edilizia)</strong>:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 rounded-xl border border-white/10 bg-navy-700/60 space-y-2">
                                <span className="font-bold text-emerald-400 text-sm block">Edilizia Libera (Art. 6 D.P.R. 380/2001)</span>
                                <p className="text-slate-300">
                                    Include le opere di <em>manutenzione ordinaria</em>: tinteggiatura pareti, sostituzione piastrelle a parità di scarichi, cambio infissi con dimensioni invariate, riparazione impianti esistenti.
                                </p>
                                <p className="text-slate-400">
                                    Non richiede alcuna pratica o comunicazione all'Ufficio Tecnico Comunale (rif. D.M. 2 marzo 2018 - Glossario Edilizia Libera).
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-navy-700/60 space-y-2">
                                <span className="font-bold text-brand text-sm block">CILA (Art. 6-bis D.P.R. 380/2001)</span>
                                <p className="text-slate-300">
                                    Necessaria per le opere di <em>manutenzione straordinaria</em> interna che non toccano parti strutturali: spostamento di pareti tramezze, apertura di vani porta su muri non portanti, rifacimento integrale degli impianti con nuove tracce.
                                </p>
                                <p className="text-slate-400">
                                    Deve essere asseverata e presentata in Comune da un tecnico abilitato (geometra, architetto o ingegnere).
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                            <p className="font-semibold text-white mb-1">Detrazioni fiscali e adempimenti</p>
                            <p className="mb-2">
                                Gli interventi di manutenzione straordinaria consentono di accedere alle detrazioni fiscali previste dal Bonus Casa (art. 16-bis D.P.R. 917/1986). Per fruirne è obbligatorio effettuare i pagamenti tramite bonifico bancario parlante dedicato e, per le opere che comportano un risparmio energetico, trasmettere la scheda descrittiva all'ENEA entro 90 giorni dalla fine dei lavori.
                            </p>
                            <Link
                                to="/blog/bonus-edilizi-2027"
                                className="text-brand hover:underline font-semibold inline-flex items-center gap-1"
                            >
                                Consulta la nostra guida dettagliata: Bonus edilizi 2027 <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </section>

                    {/* Sezione 7: FAQ */}
                    <section id="faq" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-4 flex items-center gap-2">
                            <HelpCircle className="h-6 w-6 text-brand" />
                            Domande Frequenti sulle Ristrutturazioni Casa (FAQ)
                        </h2>
                        <div className="space-y-4">
                            {FAQ_ITEMS.map((item, idx) => (
                                <div key={idx} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5 text-xs text-slate-300">
                                    <h3 className="font-display font-bold text-sm text-white mb-2">
                                        {item.q}
                                    </h3>
                                    <p className="leading-relaxed text-slate-400">
                                        {item.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sezione 8: Fonti consultate */}
                    <section id="fonti-consultate" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">07.</span>
                            Fonti istituzionali consultate
                        </h2>
                        <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2 text-xs text-slate-400">
                            <div>
                                <strong className="text-white">Normattiva / Gazzetta Ufficiale:</strong> Testo Unico dell'Edilizia (D.P.R. 6 giugno 2001, n. 380, artt. 6 e 6-bis) e Decreto Ministero delle Infrastrutture e dei Trasporti 2 marzo 2018 (Glossario Edilizia Libera).
                            </div>
                            <div>
                                <strong className="text-white">Agenzia delle Entrate:</strong>{" "}
                                <a href="https://www.agenziaentrate.gov.it/portale/ristrutturazioni-edilizie-le-agevolazioni-fiscali" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">
                                    Guida alle Ristrutturazioni Edilizie <ExternalLink className="h-3 w-3" />
                                </a> (art. 16-bis D.P.R. 917/1986).
                            </div>
                            <div>
                                <strong className="text-white">ENEA:</strong>{" "}
                                <a href="https://www.efficienzaenergetica.enea.it/detrazioni-fiscali/ecobonus/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">
                                    Portale Detrazioni Fiscali e obblighi di comunicazione telematica <ExternalLink className="h-3 w-3" />
                                </a>.
                            </div>
                        </div>
                    </section>

                    {/* Disclaimer */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-400 space-y-1.5">
                        <p className="font-semibold text-white">Avvertenza e nota di trasparenza:</p>
                        <p>
                            Questo articolo ha carattere divulgativo e informativo alla data del 2 novembre 2026. Non costituisce consulenza tecnica, progettuale o tributaria. La fattibilità degli interventi e la corretta qualificazione edilizia (CILA, SCIA o edilizia libera) devono essere verificate sul posto da un tecnico abilitato in conformità al regolamento edilizio vigente nel Comune di riferimento.
                        </p>
                    </div>
                </article>

                {/* Call To Action Finale (Unica e non aggressiva) */}
                <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-brand/15 via-navy-700/80 to-navy-700/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-brand">Stai valutando una ristrutturazione?</span>
                        <h3 className="font-display font-bold text-xl text-white mt-1">
                            Invia la tua richiesta alle imprese della tua zona
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
                            Descrivi l'intervento che desideri realizzare su CasaLavoroPRO: ricevi e valuta preventivi gratuiti senza commissioni a tuo carico.
                        </p>
                    </div>
                    <Button asChild className="bg-brand hover:bg-brand/90 text-white shrink-0">
                        <Link to="/nuova-richiesta?categoria=Ristrutturazioni">
                            Richiedi preventivo gratuito
                            <ArrowRight className="h-4 w-4 ml-1.5" />
                        </Link>
                    </Button>
                </div>

                {/* Footer Articolo */}
                <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Torna a tutti gli articoli del Blog
                    </Link>
                    <Link to="/aziende?categoria=Ristrutturazioni" className="text-brand hover:underline">
                        Visualizza le imprese verificate per ristrutturazioni →
                    </Link>
                </div>
            </div>
        </div>
    );
}
