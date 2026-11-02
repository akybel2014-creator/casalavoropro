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
    Zap,
    Flame,
    Home,
    Gauge,
    HelpCircle,
    Info,
    ExternalLink,
    ShieldCheck,
    Building2,
    AlertTriangle,
    ArrowRight,
    FileText,
    Sparkles,
    Thermometer,
    Layers,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const ARTICLE_EFFICIENZA_METADATA = {
    slug: "efficienza-energetica-casa",
    title: "Efficienza energetica in casa: interventi e consumi da valutare",
    seoTitle: "Efficienza Energetica Casa: Interventi e Consumi da Valutare",
    metaDescription: "Come migliorare l'efficienza energetica della casa: isolamento, infissi, consumi e lettura della bolletta. Guida pratica e incentivi aggiornati al 2026.",
    canonicalUrl: "/blog/efficienza-energetica-casa",
    date: "2 Novembre 2026",
    updatedDate: "Aggiornato al 2 novembre 2026",
    readTime: "9 min di lettura",
    category: "efficienza",
    categoryLabel: "Efficienza energetica",
    author: "Redazione Tecnica CasaLavoroPRO",
    reviewer: "Revisione Efficienza Energetica & Edilizia Sostenibile",
    excerpt: "Guida pratica per comprendere dove si disperde l'energia in casa, come interpretare i consumi della bolletta, quali interventi valutare tra involucro e impianti e quali incentivi verificare."
};

const FAQ_ITEMS = [
    {
        q: "Che cosa significa efficienza energetica di una casa?",
        a: "Migliorare l'efficienza energetica di un'abitazione significa ridurre la quantità di energia (termica ed elettrica) necessaria per riscaldarla, raffrescarla, illuminarla e produrre acqua calda, mantenendo o migliorando il comfort abitativo interno ed eliminando le dispersioni superflue."
    },
    {
        q: "Quali interventi possono ridurre gli sprechi energetici?",
        a: "Gli interventi principali si dividono in due grandi famiglie: quelli sull'involucro edilizio (coibentazione di coperture, pareti e sottotetti, sostituzione di infissi e cassonetti) per trattenere il calore d'inverno e schermarlo d'estate, e quelli sugli impianti (generatori ad alta efficienza come pompe di calore o caldaie a condensazione, valvole termostatiche, cronotermostati intelligenti e fotovoltaico)."
    },
    {
        q: "Da quale intervento conviene iniziare?",
        a: "L'approccio più razionale consiste nel ridurre prima il fabbisogno termico dell'edificio intervenendo sulle dispersioni maggiori (ad esempio coibentando un sottotetto non isolato o sostituendo serramenti con forti spifferi). Riducendo le dispersioni si evita infatti di sovradimensionare inutilmente la potenza del generatore termico che verrà installato successivamente."
    },
    {
        q: "Come capisco se la casa disperde calore?",
        a: "Segnali evidenti sono: pareti o pavimenti gelidi al tatto, correnti d'aria fredda in prossimità di finestre o cassonetti delle tapparelle, condensa sui vetri o formazione di muffe negli spigoli in alto (indici di ponti termici) e una temperatura interna che precipita rapidamente poco dopo aver spento il riscaldamento. Per una verifica scientifica, un tecnico può eseguire una termografia all'infrarosso."
    },
    {
        q: "Gli infissi nuovi migliorano sempre l'efficienza?",
        a: "I nuovi serramenti ad alta tenuta riducono drasticamente gli spifferi e le dispersioni per conduzione. Tuttavia, rendendo l'abitazione molto più 'ermetica', richiedono una corretta gestione del ricambio d'aria (aperture controllate o sistemi di ventilazione meccanica controllata - VMC) per evitare che l'umidità interna generi condensa e muffe."
    },
    {
        q: "La lettura della bolletta può indicare dove intervenire?",
        a: "Sì, come indicazione preliminare. L'analisi dei consumi annui espressi in kWh elettrici e Smc di gas, confrontati tra mesi invernali ed estivi, aiuta a capire se la spesa preponderante è legata al riscaldamento invernale, al condizionamento estivo o ai consumi elettrici continuativi di base."
    },
    {
        q: "Quali incentivi sono attivi per gli interventi energetici?",
        a: "Alla data di novembre 2026 sono operative le detrazioni fiscali IRPEF per la riqualificazione energetica (Ecobonus con aliquote e massimali differenziati secondo la normativa vigente e previa trasmissione scheda descrittiva all'ENEA) e gli incentivi diretti del Conto Termico gestito dal GSE per la sostituzione di impianti di climatizzazione con pompe di calore, biomasse certificate e solare termico."
    },
    {
        q: "Come posso chiedere un preventivo tramite CasaLavoroPRO?",
        a: "Accedendo al modulo 'Richiedi Preventivo', è possibile selezionare la categoria di riferimento (come 'Termoidraulica', 'Infissi e serramenti' o 'Edilizia'), indicare la propria città o provincia e descrivere le caratteristiche dell'abitazione e il lavoro desiderato, ricevendo proposte senza impegno da artigiani e imprese locali abilitate."
    }
];

export default function ArticleEfficienzaEnergetica() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = `${ARTICLE_EFFICIENZA_METADATA.seoTitle} | CasaLavoroPRO`;
        return () => {
            document.title = prevTitle;
        };
    }, []);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: ARTICLE_EFFICIENZA_METADATA.title,
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
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <Link to="/blog" className="hover:text-white transition-colors">Blog & Guide</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-400">Efficienza energetica</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200 truncate">Efficienza energetica in casa</span>
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
                            {ARTICLE_EFFICIENZA_METADATA.categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {ARTICLE_EFFICIENZA_METADATA.updatedDate}
                        </span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                        {ARTICLE_EFFICIENZA_METADATA.title}
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                        {ARTICLE_EFFICIENZA_METADATA.excerpt}
                    </p>

                    {/* Metadati Autore / Data / Tempo */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <User className="h-3.5 w-3.5 text-brand" />
                                {ARTICLE_EFFICIENZA_METADATA.author}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_EFFICIENZA_METADATA.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_EFFICIENZA_METADATA.readTime}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 text-xs transition-colors"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            Condividi articolo
                        </button>
                    </div>
                </header>

                {/* Box In Evidenza: "In Breve" */}
                <div className="mb-10 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-navy-700/80 to-navy-700/80 p-6 sm:p-7">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-brand shrink-0" />
                        <h2 className="font-display font-bold text-white text-base sm:text-lg">
                            In breve: punti chiave per l'efficienza energetica della casa
                        </h2>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Nessuna soluzione universale:</strong> le priorità d'intervento variano radicalmente a seconda dell'epoca di costruzione dell'immobile, della zona climatica di appartenenza, della tipologia strutturale e delle abitudini di chi vi abita.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Principio dell'efficienza prima della potenza:</strong> ridurre prima le dispersioni dell'involucro (copertura, pareti, serramenti) consente di installare generatori termici più piccoli ed efficienti, abbattendo costi d'acquisto e consumi futuri.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>La bolletta come indizio, non come diagnosi:</strong> i consumi annui in kWh e Smc forniscono un quadro utile sui picchi e sui profili d'uso, ma non sostituiscono una valutazione tecnica in loco dello stato effettivo dell'immobile.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Verifica preventiva di norme e incentivi:</strong> prima di avviare interventi è indispensabile verificare la regolarità edilizia dell'abitazione, i requisiti tecnici previsti da ENEA e i massimali di spesa ammessi a detrazione fiscale.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Indice dei Contenuti */}
                <nav aria-label="Indice dell'articolo" className="mb-12 rounded-2xl border border-white/10 bg-navy-800/60 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-brand" />
                        Indice dell'articolo
                    </p>
                    <ol className="space-y-2 text-xs sm:text-sm text-slate-300">
                        <li>
                            <a href="#come-migliorare" className="hover:text-brand transition-colors">
                                1. Come si può migliorare l'efficienza energetica di una casa?
                            </a>
                        </li>
                        <li>
                            <a href="#dove-si-disperde-energia" className="hover:text-brand transition-colors">
                                2. Dove può disperdersi energia in casa
                            </a>
                        </li>
                        <li>
                            <a href="#interventi-da-valutare" className="hover:text-brand transition-colors">
                                3. Interventi da valutare: involucro, impianti e rinnovabili
                            </a>
                        </li>
                        <li>
                            <a href="#da-dove-iniziare" className="hover:text-brand transition-colors">
                                4. Da dove iniziare: un percorso pratico e prudente in 5 passi
                            </a>
                        </li>
                        <li>
                            <a href="#diagnosi-vs-stime" className="hover:text-brand transition-colors">
                                5. Diagnosi energetica professionale vs stime preliminari
                            </a>
                        </li>
                        <li>
                            <a href="#analisi-bolletta-casalavoropro" className="hover:text-brand transition-colors">
                                6. Analisi della bolletta con AI su CasaLavoroPRO: funzionamento e limiti
                            </a>
                        </li>
                        <li>
                            <a href="#incentivi-agevolazioni" className="hover:text-brand transition-colors">
                                7. Quadro normativo e incentivi fiscali (aggiornato al 2026)
                            </a>
                        </li>
                        <li>
                            <a href="#come-chiedere-preventivo" className="hover:text-brand transition-colors">
                                8. Come richiedere un preventivo o supporto su CasaLavoroPRO
                            </a>
                        </li>
                        <li>
                            <a href="#faq" className="hover:text-brand transition-colors">
                                9. Domande frequenti (FAQ)
                            </a>
                        </li>
                        <li>
                            <a href="#fonti-ufficiali" className="hover:text-brand transition-colors">
                                10. Fonti ufficiali e riferimenti normativi
                            </a>
                        </li>
                    </ol>
                </nav>

                {/* Corpo dell'articolo */}
                <article className="space-y-12 text-sm sm:text-base text-slate-300 leading-relaxed">
                    
                    {/* Sezione 1: Come si può migliorare */}
                    <section id="come-migliorare" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            1. Come si può migliorare l'efficienza energetica di una casa?
                        </h2>
                        <p className="mb-4">
                            Migliorare l'efficienza energetica di un'abitazione significa ridurre la quantità di energia (termica ed elettrica) necessaria per garantire condizioni ottimali di benessere e comfort, riscaldando gli ambienti in inverno, rinfrescandoli in estate, illuminandoli e producendo acqua calda sanitaria, eliminando gli sprechi e massimizzando il rendimento dei sistemi tecnologici impiegati.
                        </p>
                        <p className="mb-4">
                            L'obiettivo fondamentale non è rinunciare al comfort abitativo, ma ottenere lo stesso risultato (o un livello di benessere superiore) utilizzando meno risorse energetiche primarie. In Italia, dove una quota rilevante del patrimonio residenziale è stata realizzata prima della prima legge organica sul contenimento dei consumi energetici (la Legge 373/1976), il potenziale di miglioramento è significativo.
                        </p>
                        <div className="rounded-xl border border-white/10 bg-navy-800/40 p-4 text-xs sm:text-sm text-slate-300">
                            <p className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                                <span>
                                    <strong>Principio di cautela:</strong> non esistono interventi universalmente prioritari o convenienti in ogni contesto. La combinazione ottimale di opere deve essere sempre tarata sulla specifica situazione costruttiva, sulla zona climatica di appartenenza (dalla zona A alla zona F) e sulla reale disponibilità economica del proprietario.
                                </span>
                            </p>
                        </div>
                    </section>

                    {/* Sezione 2: Dove può disperdersi energia */}
                    <section id="dove-si-disperde-energia" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            2. Dove può disperdersi energia in casa
                        </h2>
                        <p className="mb-4">
                            Per comprendere quali interventi valutare, è essenziale individuare le vie attraverso cui il calore fuoriesce dall'abitazione in inverno o entra indesiderato durante i mesi estivi. Nelle costruzioni non coibentate o con impianti datati, le dispersioni si distribuiscono su diverse componenti:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                            <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
                                <h3 className="font-display font-semibold text-white text-sm sm:text-base flex items-center gap-2 mb-2">
                                    <Home className="h-4 w-4 text-brand" />
                                    Tetto e sottotetto
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300">
                                    Poiché l'aria calda tende a salire per naturale convezione termica, una copertura o un sottotetto non coibentati possono essere responsabili di una percentuale rilevante (spesso stimata tra il 20% e il 30%) delle dispersioni termiche complessive di una villetta o dell'ultimo piano di un condominio.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
                                <h3 className="font-display font-semibold text-white text-sm sm:text-base flex items-center gap-2 mb-2">
                                    <Layers className="h-4 w-4 text-brand" />
                                    Pareti perimetrali e ponti termici
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300">
                                    Le murature esterne disperdono calore per trasmissione termica. I ponti termici (intersezioni tra solette, pilastri in cemento armato e pareti in laterizio privi di isolamento continuo) creano zone fredde localizzate che favoriscono la formazione di condensa e muffe.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
                                <h3 className="font-display font-semibold text-white text-sm sm:text-base flex items-center gap-2 mb-2">
                                    <Thermometer className="h-4 w-4 text-brand" />
                                    Infissi, vetri e cassonetti
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300">
                                    Finestre con vetri singoli o vetrocamere datate, telai metallici senza taglio termico, guarnizioni consumate e soprattutto cassonetti delle tapparelle non isolati creano continui spifferi e scambi termici indesiderati.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
                                <h3 className="font-display font-semibold text-white text-sm sm:text-base flex items-center gap-2 mb-2">
                                    <Flame className="h-4 w-4 text-brand" />
                                    Impianti termici obsoleti e tubazioni
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300">
                                    Generatori a combustione tradizionali non a condensazione, canne fumarie con tiraggi non regolati, tubazioni dell'acqua calda che attraversano cantine o solai senza adeguata coibentazione disperdono energia prima che arrivi ai radiatori.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-400">
                            A queste dispersioni termiche si sommano i consumi legati alla ventilazione non controllata (finestre aperte a lungo invece di ricambi brevi a riscontro) e i carichi elettrici passivi dovuti ad apparecchiature lasciate costantemente in standby o a illuminazione tradizionale non a LED.
                        </p>
                    </section>

                    {/* Sezione 3: Interventi da valutare */}
                    <section id="interventi-da-valutare" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            3. Interventi da valutare: involucro, impianti e rinnovabili
                        </h2>
                        <p className="mb-4">
                            La riqualificazione energetica di una casa comprende diverse categorie di opere. Ciascuna presenta vantaggi, costi e complessità esecutive differenti:
                        </p>

                        <div className="space-y-4 my-6">
                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2">
                                    Miglioramento dell'isolamento dell'involucro
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    Comprende la posa di cappotto termico esterno o interno, l'isolamento dell'estradosso del solaio del sottotetto (uno degli interventi più rapidi ed economici nelle case con soffitta non abitabile) o l'insufflaggio di materiale isolante nelle intercapedini murarie laddove presenti.
                                </p>
                                <p className="text-xs text-slate-400">
                                    <strong>Quando valutarlo:</strong> quando le pareti risultano fredde al contatto, le dispersioni termiche complessive sono elevate e l'edificio consente la posa senza violare vincoli architettonici o confini condominiali.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2">
                                    Verifica o sostituzione dei serramenti
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    Installazione di serramenti con vetrocamera a bassa emissività (con gas argon), telai a taglio termico (in PVC, legno o alluminio a taglio termico) e coibentazione interna del vano cassonetto avvolgibile.
                                </p>
                                <p className="text-xs text-slate-400">
                                    <strong>Attenzione:</strong> la sola sostituzione degli infissi, rendendo l'involucro molto a tenuta d'aria, richiede una puntuale gestione del ricambio d'aria per evitare condense superficiali su pareti fredde non coibentate.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2">
                                    Regolazione evoluta e controllo dei sistemi di riscaldamento
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    Installazione di valvole termostatiche a bassa inerzia su ciascun corpo scaldante (obbligatorie nei condomini ai sensi del D.Lgs. 102/2014) e di cronotermostati modulanti con sonda climatica esterna (classi V, VI o VIII).
                                </p>
                                <p className="text-xs text-slate-400">
                                    <strong>Vantaggio:</strong> è tra gli interventi a costo più contenuto e consente di evitare il surriscaldamento delle stanze esposte a sud o inutilizzate durante le ore diurne.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2">
                                    Sostituzione o miglioramento degli impianti termici
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    Passaggio da generatori tradizionali a caldaie a condensazione ad alto rendimento, pompe di calore elettriche ad alta efficienza o sistemi ibridi compatti certificati, previa verifica del bilancio termico e dei terminali di emissione esistenti.
                                </p>
                                <p className="text-xs text-slate-400">
                                    <strong>Da ricordare:</strong> una pompa di calore rende al massimo con temperature di mandata basse (30-35 °C con pavimenti radianti o fancoil); con vecchi termosifoni in ghisa richiede una perizia termotecnica dedicata.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2">
                                    Gestione dell'illuminazione e degli apparecchi elettrici
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    Sostituzione integrale di lampade alogene e a fluorescenza con sorgenti LED ad alta resa cromatica e scelta di elettrodomestici di classe energetica elevata secondo la classificazione UE (Regolamento UE 2017/1369), eliminando lo standby tramite prese smart o ciabatte con interruttore.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2">
                                    Produzione da fonti rinnovabili
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    Installazione di impianti fotovoltaici con o senza sistema di accumulo elettrochimico e di collettori solari termici per la produzione di acqua calda sanitaria. Il dimensionamento deve basarsi sul reale profilo di autoconsumo dell'abitazione.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 4: Da dove iniziare */}
                    <section id="da-dove-iniziare" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            4. Da dove iniziare: un percorso pratico e prudente in 5 passi
                        </h2>
                        <p className="mb-4">
                            Per evitare di spendere denaro in interventi secondari trascurando le cause principali degli sprechi, è opportuno procedere con metodo:
                        </p>

                        <div className="space-y-4 my-6">
                            <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-navy-850">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-sm">
                                    1
                                </span>
                                <div>
                                    <h3 className="font-display font-semibold text-white text-base">
                                        Raccogliere le bollette e osservare i consumi
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-300">
                                        Recupera le bollette degli ultimi 12-24 mesi per quantificare i consumi effettivi in kWh di energia elettrica e in Smc di gas (o quintali di legna/pellet). Confronta i mesi invernali con quelli estivi per capire quanto pesa la climatizzazione rispetto agli usi domestici di base.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-navy-850">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-sm">
                                    2
                                </span>
                                <div>
                                    <h3 className="font-display font-semibold text-white text-base">
                                        Individuare problemi evidenti di comfort
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-300">
                                        Ispeziona la casa cercando spifferi attorno a finestre e cassonetti, zone perimetrali fredde, radiatori che scaldano solo parzialmente o tracce di condensa e muffa negli angoli esposti a nord o dietro gli armadi.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-navy-850">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-sm">
                                    3
                                </span>
                                <div>
                                    <h3 className="font-display font-semibold text-white text-base">
                                        Valutare l'immobile con un tecnico qualificato
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-300">
                                        Se prevedi interventi rilevanti, richiedi un sopralluogo a un termotecnico, ingegnere, architetto o geometra abilitato. Un'analisi professionale sul posto permette di individuare la stratigrafia muraria, la reale consistenza dell'involucro e la fattibilità degli impianti.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-navy-850">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-sm">
                                    4
                                </span>
                                <div>
                                    <h3 className="font-display font-semibold text-white text-base">
                                        Confrontare preventivi dettagliati
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-300">
                                        Richiedi preventivi analitici specificando le stesse lavorazioni a più imprese. Verifica che siano compresi smaltimenti, ponteggi, opere murarie accessorie, collaudi e il rilascio della Dichiarazione di Conformità (D.M. 37/2008).
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl border border-white/10 bg-navy-850">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-sm">
                                    5
                                </span>
                                <div>
                                    <h3 className="font-display font-semibold text-white text-base">
                                        Verificare requisiti e incentivi prima di iniziare
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-300">
                                        Accertati che i prodotti scelti rispettino i valori limite di trasmittanza termica o di efficienza stagionale richiesti da ENEA e GSE, e che le modalità di pagamento (es. bonifico parlante per detrazioni) siano rigorosamente rispettate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 5: Diagnosi vs stime */}
                    <section id="diagnosi-vs-stime" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            5. Diagnosi energetica professionale vs stime preliminari
                        </h2>
                        <p className="mb-4">
                            È fondamentale chiarire la netta distinzione tra una stima indicativa e una diagnosi energetica ufficiale:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <div className="flex items-center gap-2 mb-2 text-white font-semibold font-display">
                                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                    Diagnosi Energetica (Energy Audit)
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 mb-3">
                                    È una procedura tecnica rigorosa disciplinata dal D.Lgs. 102/2014 e dalla norma tecnica UNI CEI EN 16247, condotta da un <strong>Esperto in Gestione dell'Energia (EGE certificato UNI CEI 11339)</strong>, da una ESCo o da un tecnico abilitato.
                                </p>
                                <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                                    <li>Rilievi dimensionali e strumentali in loco (termografia, Blower Door test).</li>
                                    <li>Calcolo analitico del bilancio energetico dinamico dell'edificio.</li>
                                    <li>Analisi costi-benefici dettagliata con stima realistica dei tempi di ammortamento.</li>
                                    <li>Valore asseverativo e ufficiale per piani complessi di riqualificazione.</li>
                                </ul>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <div className="flex items-center gap-2 mb-2 text-white font-semibold font-display">
                                    <Gauge className="h-5 w-5 text-amber-400" />
                                    Stima indicativa o simulatore online
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 mb-3">
                                    È uno strumento informativo preliminare basato su algoritmi statistici, medie parametriche o lettura digitale dei documenti di spesa.
                                </p>
                                <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                                    <li>Non analizza la stratigrafia reale né lo stato conservativo dei materiali.</li>
                                    <li>Fornisce un ordine di grandezza orientativo e individua possibili anomalie di spesa.</li>
                                    <li>Non ha valore legale o certificativo.</li>
                                    <li>Serve come primo passo per decidere se approfondire con un tecnico.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 6: Analisi della bolletta con AI su CasaLavoroPro */}
                    <section id="analisi-bolletta-casalavoropro" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            6. Analisi della bolletta con AI su CasaLavoroPRO: funzionamento e limiti
                        </h2>
                        <p className="mb-4">
                            Sulla piattaforma CasaLavoroPRO è attiva la funzione dedicata all'<strong>Analisi Energetica della Bolletta</strong>, accessibile previa registrazione o accesso gratuito. Lo strumento è progettato per aiutare famiglie e privati a decifrare la complessità delle bollette di fornitura luce e gas.
                        </p>

                        <div className="rounded-2xl border border-brand/20 bg-gradient-to-r from-navy-800 to-navy-700 p-6 my-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-5 w-5 text-brand" />
                                <h3 className="font-display font-bold text-white text-base">
                                    Come funziona lo strumento digitale
                                </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-300 mb-4">
                                Caricando il file PDF della bolletta (o una foto nitida da smartphone nei formati JPEG, PNG o WEBP), un modello di intelligenza artificiale scansiona il documento ed estrae i dati essenziali: consumi fatturati distinti per fasce (F1, F2, F3), potenza impegnata in kW, spesa per la materia energia confrontata con le componenti fisse e gli oneri di sistema.
                            </p>
                            
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-slate-200 space-y-2 mb-5">
                                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    Chiarimenti e limiti importanti dello strumento:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                                    <li><strong>Nessun risparmio garantito:</strong> le percentuali o le cifre stimate sono proiezioni indicative e non costituiscono una promessa contrattuale di risparmio.</li>
                                    <li><strong>Non sostituisce una diagnosi energetica:</strong> l'algoritmo legge esclusivamente la bolletta e non conosce la tipologia di muratura, gli infissi o gli impianti fisici della casa.</li>
                                    <li><strong>Dipendenza dai dati forniti:</strong> la precisione dell'estrazione dipende dalla nitidezza del documento e dalla completezza dei periodi di fatturazione caricati.</li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold rounded-xl">
                                    <Link to="/analisi-energetica" className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Accedi all'Analisi Energetica Bolletta
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <span className="text-xs text-slate-400">
                                    Strumento preliminare gratuito disponibile nell'area riservata
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 7: Incentivi e agevolazioni */}
                    <section id="incentivi-agevolazioni" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            7. Quadro normativo e incentivi fiscali (aggiornato al 2026)
                        </h2>
                        <p className="mb-4">
                            Chi intende realizzare opere di efficientamento energetico nella propria abitazione può verificare l'accesso a misure di sostegno economico nazionali, disciplinate dalle norme fiscali ed energetiche vigenti:
                        </p>

                        <div className="space-y-4 my-6">
                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2 flex items-center justify-between">
                                    <span>Ecobonus e detrazioni per il risparmio energetico (IRPEF)</span>
                                    <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Misura Vigente</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    Le detrazioni fiscali per gli interventi di riqualificazione energetica degli edifici consentono di detrarre dall'IRPEF una quota delle spese sostenute, suddivisa in quote annuali di pari importo. Tra gli interventi ammessi figurano la coibentazione dell'involucro opaco, la sostituzione dei serramenti e l'installazione di schermature solari, collettori solari e caldaie a condensazione ad alta efficienza.
                                </p>
                                <p className="text-xs text-slate-400">
                                    <strong>Obbligo ENEA:</strong> per tutti gli interventi di risparmio energetico è obbligatorio trasmettere all'ENEA la scheda descrittiva dei lavori entro 90 giorni dalla data di ultimazione dei lavori tramite il portale telematico ufficiale (<a href="https://www.efficienzaenergetica.enea.it/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">efficienzaenergetica.enea.it</a>).
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2 flex items-center justify-between">
                                    <span>Conto Termico (GSE - Gestore Servizi Energetici)</span>
                                    <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Misura Vigente</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    A differenza delle detrazioni fiscali a rate, il Conto Termico è un incentivo diretto erogato dal GSE tramite bonifico sul conto corrente del richiedente (in un'unica soluzione o in 2-5 rate annuali a seconda dell'importo). È rivolto a privati e condomini che sostituiscono impianti di riscaldamento obsoleti con pompe di calore elettriche, sistemi ibridi factory-made, caldaie a biomassa certificate (almeno 4 o 5 stelle ambientali ai sensi del D.M. 186/2017) o scaldacqua a pompa di calore.
                                </p>
                                <p className="text-xs text-slate-400">
                                    <strong>Requisiti:</strong> consultabili direttamente sul portale ufficiale del GSE (<a href="https://www.gse.it/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">gse.it</a>).
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5">
                                <h3 className="font-display font-semibold text-white text-base mb-2 flex items-center justify-between">
                                    <span>Bonus Casa per ristrutturazione edilizia</span>
                                    <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Misura Vigente</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300 mb-2">
                                    La detrazione IRPEF per recupero del patrimonio edilizio (art. 16-bis D.P.R. 917/1986) include interventi di manutenzione straordinaria finalizzati al conseguimento di risparmi energetici (ad esempio installazione di impianti fotovoltaici domestici o coibentazioni parziali).
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-navy-800/30 p-4 text-xs text-slate-400">
                            <p>
                                <strong>Avvertenza fiscale:</strong> le aliquote percentuali, i tetti di spesa ammissibili e la capienza d'imposta individuale variano in base alla legislazione vigente alla data di effettuazione del bonifico e alla specifica situazione tributaria del contribuente. Prima di procedere all'ordine dei materiali, consulta sempre un commercialista, un CAF abilitato o la guida aggiornata dell'Agenzia delle Entrate.
                            </p>
                        </div>
                    </section>

                    {/* Sezione 8: Come chiedere preventivo */}
                    <section id="come-chiedere-preventivo" className="scroll-mt-32">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-4">
                            8. Come richiedere un preventivo o supporto su CasaLavoroPRO
                        </h2>
                        <p className="mb-4">
                            Quando hai identificato gli interventi da approfondire e desideri raccogliere preventivi reali da tecnici e aziende qualificate attive nella tua provincia, puoi utilizzare il servizio di richiesta preventivo di CasaLavoroPRO:
                        </p>

                        <div className="rounded-2xl border border-white/15 bg-navy-800/60 p-6 my-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-xl border border-white/10 bg-navy-700/40">
                                    <p className="font-semibold text-white text-sm mb-1">1. Seleziona la categoria</p>
                                    <p className="text-xs text-slate-300">
                                        Scegli la specializzazione coerente con il lavoro: <em>Termoidraulica</em> per impianti e caldaie/pompe di calore, <em>Infissi e serramenti</em> per le finestre, o <em>Edilizia / Ristrutturazioni</em> per cappotti e coperture.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-navy-700/40">
                                    <p className="font-semibold text-white text-sm mb-1">2. Descrivi la tua casa</p>
                                    <p className="text-xs text-slate-300">
                                        Specifica il comune, la superficie approssimativa, il piano, il tipo di riscaldamento presente e allega foto o piantine indicative.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/10 bg-navy-700/40">
                                    <p className="font-semibold text-white text-sm mb-1">3. Confronta le offerte</p>
                                    <p className="text-xs text-slate-300">
                                        Ricevi i riscontri dei professionisti abilitati della tua zona, valuta le proposte e programma un sopralluogo conoscitivo senza vincoli.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-sm font-semibold text-white">Pronto a valutare i lavori per casa tua?</p>
                                    <p className="text-xs text-slate-400">Invia la richiesta gratuitamente e ricevi riscontri da imprese locali verificate.</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Button asChild className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white rounded-xl">
                                        <Link to="/nuova-richiesta">
                                            Richiedi preventivo gratuito
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="w-full sm:w-auto border-white/15 text-slate-200 hover:bg-white/10 rounded-xl">
                                        <Link to="/aziende">
                                            Esplora professionisti
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 9: FAQ */}
                    <section id="faq" className="scroll-mt-32">
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle className="h-5 w-5 text-brand" />
                            <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
                                9. Domande frequenti sull'efficienza energetica in casa (FAQ)
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mb-6">
                            Risposte pratiche e documentate ai quesiti più comuni posti da proprietari e condòmini.
                        </p>

                        <div className="space-y-4">
                            {FAQ_ITEMS.map((faq, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border border-white/10 bg-navy-800/40 p-5 transition-colors hover:border-white/20"
                                >
                                    <h3 className="font-display font-semibold text-white text-sm sm:text-base mb-2 flex items-start gap-2.5">
                                        <span className="text-brand font-bold shrink-0">D:</span>
                                        <span>{faq.q}</span>
                                    </h3>
                                    <div className="text-xs sm:text-sm text-slate-300 pl-6 border-l-2 border-brand/30 ml-1">
                                        <p>{faq.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sezione 10: Fonti ufficiali */}
                    <section id="fonti-ufficiali" className="scroll-mt-32 border-t border-white/10 pt-10">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-400" />
                            <h2 className="font-display font-bold text-lg sm:text-xl text-white">
                                10. Fonti ufficiali e riferimenti istituzionali consultati
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mb-6">
                            A garanzia dell'accuratezza e della trasparenza editoriale, le informazioni tecniche, procedurali e legislative contenute in questo articolo sono state verificate sui portali istituzionali competenti:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <a
                                href="https://www.efficienzaenergetica.enea.it/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-navy-800/50 hover:border-brand/40 hover:bg-navy-800 transition-colors group"
                            >
                                <span className="font-medium text-slate-200 group-hover:text-white">
                                    ENEA – Dipartimento Unità per l'Efficienza Energetica
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand shrink-0 ml-2" />
                            </a>

                            <a
                                href="https://www.mase.gov.it/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-navy-800/50 hover:border-brand/40 hover:bg-navy-800 transition-colors group"
                            >
                                <span className="font-medium text-slate-200 group-hover:text-white">
                                    MASE – Ministero dell'Ambiente e della Sicurezza Energetica
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand shrink-0 ml-2" />
                            </a>

                            <a
                                href="https://www.gse.it/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-navy-800/50 hover:border-brand/40 hover:bg-navy-800 transition-colors group"
                            >
                                <span className="font-medium text-slate-200 group-hover:text-white">
                                    GSE – Gestore dei Servizi Energetici (Conto Termico)
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand shrink-0 ml-2" />
                            </a>

                            <a
                                href="https://www.agenziaentrate.gov.it/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-navy-800/50 hover:border-brand/40 hover:bg-navy-800 transition-colors group"
                            >
                                <span className="font-medium text-slate-200 group-hover:text-white">
                                    Agenzia delle Entrate – Detrazioni fiscali e guide
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand shrink-0 ml-2" />
                            </a>

                            <a
                                href="https://www.arera.it/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-navy-800/50 hover:border-brand/40 hover:bg-navy-800 transition-colors group"
                            >
                                <span className="font-medium text-slate-200 group-hover:text-white">
                                    ARERA – Autorità di Regolazione per Energia Reti e Ambiente
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand shrink-0 ml-2" />
                            </a>

                            <a
                                href="https://www.normattiva.it/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-navy-800/50 hover:border-brand/40 hover:bg-navy-800 transition-colors group"
                            >
                                <span className="font-medium text-slate-200 group-hover:text-white">
                                    Normattiva – D.Lgs. 192/2005 e s.m.i. (Rendimento energetico)
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand shrink-0 ml-2" />
                            </a>
                        </div>
                    </section>

                    {/* Disclaimer di responsabilità */}
                    <div className="rounded-2xl border border-white/10 bg-navy-800/30 p-5 text-xs text-slate-400">
                        <p className="font-semibold text-slate-300 mb-1">Nota informativa e clausola di salvaguardia:</p>
                        <p>
                            Questo articolo ha finalità divulgativa e orientativa generale per i lettori di CasaLavoroPRO e non costituisce una diagnosi energetica, una perizia tecnica, un progetto esecutivo o una consulenza tributaria personalizzata. L'individuazione degli interventi più opportuni e la verifica dei requisiti tecnici e di detraibilità fiscale devono essere concordate con professionisti e installatori abilitati, previa ispezione diretta dello stato dell'immobile e verifica dei regolamenti edilizi locali.
                        </p>
                    </div>

                    {/* Navigazione tra guide del blog */}
                    <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Link
                            to="/blog/impianti-riscaldamento-casa"
                            className="w-full sm:w-1/2 p-4 rounded-xl border border-white/10 hover:border-brand/30 bg-navy-800/40 hover:bg-navy-800/70 transition-colors text-left group"
                        >
                            <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-brand">
                                <ArrowLeft className="h-3.5 w-3.5" /> Articolo correlato
                            </span>
                            <p className="mt-1 font-display font-semibold text-white text-sm line-clamp-1">
                                Impianti di riscaldamento: come scegliere, gestire e sostituire il sistema di casa
                            </p>
                        </Link>

                        <Link
                            to="/blog/ristrutturazioni-casa"
                            className="w-full sm:w-1/2 p-4 rounded-xl border border-white/10 hover:border-brand/30 bg-navy-800/40 hover:bg-navy-800/70 transition-colors text-right group"
                        >
                            <span className="text-xs text-slate-400 flex items-center justify-end gap-1 group-hover:text-brand">
                                Articolo correlato <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                            <p className="mt-1 font-display font-semibold text-white text-sm line-clamp-1">
                                Ristrutturazioni casa: guida pratica e richiesta di preventivo
                            </p>
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
}
