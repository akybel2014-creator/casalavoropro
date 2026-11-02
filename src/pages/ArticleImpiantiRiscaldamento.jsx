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
    Flame,
    Zap,
    HelpCircle,
    Info,
    ExternalLink,
    ShieldCheck,
    Building2,
    AlertTriangle,
    ShieldAlert,
    Gauge,
    Thermometer,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const ARTICLE_IMPIANTI_METADATA = {
    slug: "impianti-riscaldamento-casa",
    title: "Impianti di riscaldamento: come scegliere, gestire e sostituire il sistema di casa",
    seoTitle: "Impianti di Riscaldamento Casa: Guida a Scelta e Sostituzione",
    metaDescription: "Come scegliere o sostituire l'impianto di riscaldamento: caldaie a condensazione, pompe di calore, radiatori e riscaldamento a pavimento. Consigli e permessi.",
    canonicalUrl: "/blog/impianti-riscaldamento-casa",
    date: "2 Novembre 2026",
    updatedDate: "Aggiornato al 2 novembre 2026",
    readTime: "9 min di lettura",
    category: "impianti",
    categoryLabel: "Impianti e riscaldamento",
    author: "Redazione Tecnica CasaLavoroPRO",
    reviewer: "Revisione Termotecnica & Efficienza Energetica",
    excerpt: "Guida pratica per proprietari e inquilini: come valutare isolamento, spazi e consumi tra caldaie a condensazione, pompe di calore e sistemi ibridi, con obblighi di manutenzione e richiesta preventivi."
};

const FAQ_ITEMS = [
    {
        q: "Qual è l'impianto di riscaldamento più adatto a una casa?",
        a: "Non esiste una soluzione universale valida per tutti gli edifici. La scelta migliore dipende dal livello di isolamento termico dell'involucro (pareti, tetto, infissi), dalla zona climatica, dallo spazio disponibile all'esterno e all'interno, dai terminali esistenti (radiatori ad alta temperatura o pannelli radianti) e dalle abitudini di permanenza nell'alloggio."
    },
    {
        q: "Una pompa di calore può funzionare efficacemente con i vecchi radiatori in ghisa?",
        a: "Sì, ma richiede un'attenta verifica termotecnica. I vecchi termosifoni lavoravano a temperature di mandata elevate (65-75 °C). Le pompe di calore ad alta temperatura o le pompe di calore standard installate su edifici parzialmente isolati (con radiatori sovradimensionati) possono funzionare, ma per massimizzare il rendimento stagionale (COP) è consigliabile valutare un sistema ibrido o migliorare preventivamente l'isolamento della casa."
    },
    {
        q: "Quando conviene valutare la sostituzione del generatore di calore?",
        a: "Conviene intervenire quando l'apparecchio ha più di 12-15 anni di vita, manifesta guasti ricorrenti e cali di rendimento, quando i costi delle riparazioni superano il valore residuo o in occasione di una ristrutturazione edilizia per accedere alle agevolazioni fiscali o al Conto Termico GSE."
    },
    {
        q: "Quali informazioni servono per chiedere un preventivo per il riscaldamento?",
        a: "È utile indicare: il tipo di generatore attualmente installato (es. caldaia tradizionale murale a metano o a gasolio), la sua collocazione (interno o balcone/vano caldaia), la superficie dell'abitazione, il tipo di terminali (radiatori, ventilconvettori, riscaldamento a pavimento), la zona geografica e se l'impianto produce anche acqua calda sanitaria (ACS)."
    },
    {
        q: "Che differenza c'è tra impianto autonomo e impianto centralizzato con contabilizzazione?",
        a: "Nell'impianto autonomo ogni unità abitativa possiede un proprio generatore di calore e gestisce in totale indipendenza accensioni, temperature e manutenzioni. Nel centralizzato condominiale è presente un'unica centrale termica comune; dal 2017 la legge impone valvole termostatiche e contabilizzatori di calore su ogni radiatore, permettendo a ciascun condomino di pagare in base al consumo effettivo prelevato più una quota fissa di gestione involontaria."
    },
    {
        q: "Ogni quanto tempo va effettuata la manutenzione e il controllo fumi?",
        a: "La manutenzione ordinaria di sicurezza deve essere effettuata con la periodicità indicata nelle istruzioni tecniche del fabbricante dell'apparecchio e dall'installatore (generalmente con cadenza annuale). Il controllo dell'efficienza energetica (controllo fumi/rendimento di combustione con rilascio del bollino e trasmissione al Catasto Regionale) segue invece le scadenze fissate dal D.P.R. 74/2013 e dai singoli regolamenti regionali (solitamente ogni 1, 2 o 4 anni a seconda di potenza e combustibile)."
    },
    {
        q: "Posso installare da solo una caldaia o una pompa di calore acquistata online?",
        a: "Assolutamente no. In Italia, ai sensi del D.M. 37/2008, qualsiasi intervento di installazione, trasformazione o manutenzione straordinaria su impianti a gas, idraulici o elettrici deve essere eseguito esclusivamente da ditte o tecnici abilitati con rilascio obbligatorio della Dichiarazione di Conformità (Di.Co.). L'installazione fai-da-te è illegale e pericolosa per la sicurezza."
    },
    {
        q: "Posso chiedere un preventivo per la sostituzione dell'impianto tramite CasaLavoroPRO?",
        a: "Sì. Puoi accedere alla sezione di richiesta preventivo gratuita selezionando la categoria 'Termoidraulica' o 'Idraulica', indicare la tua provincia e descrivere l'impianto attuale e l'intervento desiderato. La richiesta verrà inoltrata agli installatori e termoidraulici qualificati attivi nella tua zona."
    }
];

export default function ArticleImpiantiRiscaldamento() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = `${ARTICLE_IMPIANTI_METADATA.seoTitle} | CasaLavoroPRO`;
        return () => {
            document.title = prevTitle;
        };
    }, []);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: ARTICLE_IMPIANTI_METADATA.title,
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
                    <span className="text-slate-400">Impianti e riscaldamento</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200 truncate">Impianti di riscaldamento casa</span>
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
                            {ARTICLE_IMPIANTI_METADATA.categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {ARTICLE_IMPIANTI_METADATA.updatedDate}
                        </span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                        {ARTICLE_IMPIANTI_METADATA.title}
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                        {ARTICLE_IMPIANTI_METADATA.excerpt}
                    </p>

                    {/* Metadati Autore / Data / Tempo */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <User className="h-3.5 w-3.5 text-brand" />
                                {ARTICLE_IMPIANTI_METADATA.author}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_IMPIANTI_METADATA.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_IMPIANTI_METADATA.readTime}
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
                            In sintesi: come orientarsi tra le opzioni di riscaldamento
                        </h2>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Nessuna soluzione universale:</strong> La scelta tra caldaia a condensazione, pompa di calore o sistema ibrido dipende prima di tutto dalle dispersioni termiche della casa, dalla zona climatica e dai radiatori o pannelli presenti.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>La pompa di calore rende al massimo a basse temperature:</strong> Si abbina in modo ottimale con riscaldamento a pavimento o ventilconvettori; con radiatori in ghisa richiede una verifica preventiva per evitare consumi elettrici elevati.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Manutenzione e sicurezza sono obbligatorie:</strong> Ai sensi del D.P.R. 74/2013 e del D.M. 37/2008, ogni impianto termico deve possedere il Libretto di Impianto unico e controlli fumi periodici affidati a tecnici abilitati con rilascio del bollino e della Dichiarazione di Conformità.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Incentivi e agevolazioni:</strong> La sostituzione con tecnologie ad alta efficienza permette di accedere al Conto Termico del GSE o alle detrazioni fiscali (Ecobonus e Bonus Casa), con obbligo di comunicazione all'ENEA.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Box Sommario / Indice dell'articolo */}
                <div className="mb-10 rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6">
                    <p className="font-display font-bold text-xs text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-brand" />
                        Indice della guida
                    </p>
                    <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                        <li><a href="#come-si-sceglie" className="hover:text-brand transition-colors">Come si sceglie o si sostituisce l'impianto di casa</a></li>
                        <li><a href="#tipi-di-impianto" className="hover:text-brand transition-colors">Le principali tecnologie: differenze e vantaggi</a></li>
                        <li><a href="#valutare-la-propria-casa" className="hover:text-brand transition-colors">Come capire cosa è adatto alla propria abitazione</a></li>
                        <li><a href="#manutenzione-e-sicurezza" className="hover:text-brand transition-colors">Manutenzione, bollino fumi e obblighi di legge</a></li>
                        <li><a href="#sostituzione-e-preventivo" className="hover:text-brand transition-colors">Sostituire l'impianto e chiedere un preventivo</a></li>
                        <li><a href="#incentivi-e-agevolazioni" className="hover:text-brand transition-colors">Incentivi fiscali e Conto Termico GSE</a></li>
                        <li><a href="#faq" className="hover:text-brand transition-colors">Domande Frequenti (FAQ)</a></li>
                        <li><a href="#fonti-ufficiali" className="hover:text-brand transition-colors">Fonti istituzionali consultate</a></li>
                    </ol>
                </div>

                {/* Corpo editoriale */}
                <article className="space-y-10 text-sm leading-relaxed text-slate-300">
                    {/* Sezione 1: Introduzione e risposta rapida */}
                    <section id="come-si-sceglie" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">01.</span>
                            Come si sceglie o si sostituisce l'impianto di riscaldamento di casa?
                        </h2>
                        <p className="mb-3">
                            La scelta o la sostituzione del generatore di calore non si riduce all'acquisto di una nuova macchina: si tratta di trovare l'equilibrio tra <strong>fabbisogno termico dell'edificio</strong>, <strong>terminali di emissione presenti</strong> (radiatori o pannelli a pavimento) e <strong>costi operativi del vettore energetico</strong> (gas naturale, energia elettrica o biomasse).
                        </p>
                        <p>
                            Un impianto tecnologicamente avanzato installato in un'abitazione con forti dispersioni o con terminali non idonei rischia di non raggiungere mai le prestazioni promesse, traducendosi in bollette elevate e scarso comfort. Per questa ragione, il primo passo razionale è sempre l'analisi dello stato reale dell'edificio e delle abitudini di vita della famiglia.
                        </p>
                    </section>

                    {/* Sezione 2: Tipi di impianto */}
                    <section id="tipi-di-impianto" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">02.</span>
                            Le principali tecnologie a confronto
                        </h2>
                        <p className="mb-4">
                            Nessuna tecnologia è perfetta per ogni scenario. Ecco un quadro equilibrato delle opzioni più diffuse:
                        </p>

                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl border border-white/10 bg-navy-700/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                        <Flame className="h-4 w-4 text-brand" /> Caldaia a condensazione a gas
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-300">Gas Metano / GPL</span>
                                </div>
                                <p className="text-xs text-slate-300 mb-2">
                                    Recupera il calore latente di condensazione contenuto nei fumi di scarico, raggiungendo rendimenti energetici superiori rispetto ai vecchi modelli tradizionali a camera aperta o stagna.
                                </p>
                                <ul className="text-xs space-y-1 list-disc list-inside text-slate-400">
                                    <li><strong>Quando è adatta:</strong> Sostituzione rapida in appartamenti serviti da rete di gas metano con radiatori esistenti, dove gli spazi esterni per unità moto-condensanti sono assenti o vincolati.</li>
                                    <li><strong>Aspetti da considerare:</strong> Necessita di scarico condensa acida a norma e canna fumaria idonea. Le normative europee (Direttiva EPBD) ne scoraggiano il finanziamento agevolato se non abbinate a sistemi ibridi o solari.</li>
                                </ul>
                            </div>

                            <div className="p-5 rounded-2xl border border-white/10 bg-navy-700/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-emerald-400" /> Pompa di calore elettrica (Aria-Acqua)
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Elettrico rinnovabile</span>
                                </div>
                                <p className="text-xs text-slate-300 mb-2">
                                    Preleva calore gratuito presente nell'aria esterna e lo trasferisce all'acqua dell'impianto di riscaldamento tramite un ciclo frigorifero azionato da energia elettrica. Può produrre riscaldamento invernale, raffrescamento estivo e acqua calda sanitaria.
                                </p>
                                <ul className="text-xs space-y-1 list-disc list-inside text-slate-400">
                                    <li><strong>Quando è adatta:</strong> Case ben isolate (cappotto, infissi recenti), riscaldamento a pavimento radiante o ventilconvettori, oppure in presenza di impianto fotovoltaico per autoconsumo.</li>
                                    <li><strong>Aspetti da considerare:</strong> Richiede spazio esterno ventilato per l'unità motrice, adeguata potenza al contatore elettrico (spesso 4,5 o 6 kW) e perde efficienza con temperature esterne rigidissime sotto zero se l'edificio disperde molto calore.</li>
                                </ul>
                            </div>

                            <div className="p-5 rounded-2xl border border-white/10 bg-navy-700/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                        <Thermometer className="h-4 w-4 text-sky-400" /> Sistemi ibridi (Pompa di calore + Caldaia)
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">Ibrido integrato</span>
                                </div>
                                <p className="text-xs text-slate-300 mb-2">
                                    Combinano un generatore a pompa di calore e una caldaia a condensazione gestiti da una centralina elettronica intelligente che seleziona in tempo reale il generatore più conveniente dal punto di vista energetico o economico.
                                </p>
                                <ul className="text-xs space-y-1 list-disc list-inside text-slate-400">
                                    <li><strong>Quando è adatta:</strong> Edifici parzialmente coibentati con radiatori tradizionali situati in zone climatiche fredde, per garantire la sicurezza del riscaldamento nei giorni di gelo estremo.</li>
                                    <li><strong>Aspetti da considerare:</strong> Costo d'acquisto iniziale superiore e necessità di manutenere entrambi i generatori.</li>
                                </ul>
                            </div>

                            <div className="p-5 rounded-2xl border border-white/10 bg-navy-700/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-amber-400" /> Riscaldamento Autonomo vs. Centralizzato con Contabilizzazione
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-300">
                                    Nei condomìni, la transizione verso il centralizzato ad alta efficienza offre economie di scala e spazi tecnici dedicati fuori dagli appartamenti. In Italia la normativa impone dal 2017 la contabilizzazione del calore e l'installazione di valvole termostatiche: ciascun proprietario regola autonomamente la temperatura nelle stanze e paga secondo i propri consumi reali rilevati dai ripartitori.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 3: Come capire cosa è adatto alla propria casa */}
                    <section id="valutare-la-propria-casa" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">03.</span>
                            Come capire cosa è adatto alla propria abitazione
                        </h2>
                        <p className="mb-3">
                            Prima di firmare qualsiasi preventivo o scegliere il modello dell'apparecchio, un tecnico qualificato valuta i seguenti fattori determinanti:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                                <strong className="text-white block text-sm font-semibold">1. Isolamento dell'involucro</strong>
                                La presenza di cappotto termico, infissi con doppi/tripli vetri e tetto isolato riduce il carico termico richiesto. Una casa non isolata disperde molto calore e può rendere inefficiente una pompa di calore sottodimensionata.
                            </div>
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                                <strong className="text-white block text-sm font-semibold">2. Zona climatica (D.P.R. 412/1993)</strong>
                                L'Italia è divisa in 6 zone climatiche (dalla A per le isole calde alla F per le zone alpine). A seconda dei gradi-giorno e delle temperature minime invernali storiche, le prestazioni dei generatori variano sensibilmente.
                            </div>
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                                <strong className="text-white block text-sm font-semibold">3. Terminali di emissione</strong>
                                I pannelli radianti a pavimento lavorano con acqua a 30-35 °C; i radiatori tradizionali in ghisa richiedono 60-70 °C. Abbassare la temperatura di mandata aumenta il rendimento di qualsiasi caldaia a condensazione o pompa di calore.
                            </div>
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                                <strong className="text-white block text-sm font-semibold">4. Spazi tecnici e vincoli condominiali</strong>
                                Per le pompe di calore serve uno spazio all'aperto (balcone, cortile, tetto) privo di vincoli acustici o di decoro architettonico condominiale. Per le caldaie occorrono canne fumarie a norma fino al tetto (art. 5 comma 9 D.P.R. 412/1993).
                            </div>
                        </div>
                    </section>

                    {/* Sezione 4: Manutenzione e sicurezza */}
                    <section id="manutenzione-e-sicurezza" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">04.</span>
                            Manutenzione, bollino fumi e obblighi di sicurezza
                        </h2>
                        <p className="mb-3">
                            Mantenere in efficienza l'impianto non serve solo a consumare meno combustibile, ma risponde a precisi <strong>doveri di legge e di pubblica sicurezza</strong>:
                        </p>

                        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 space-y-2 mb-4">
                            <div className="flex items-center gap-2 font-bold text-white text-sm">
                                <ShieldAlert className="h-4 w-4 text-amber-400" /> Obblighi di legge per il responsabile dell'impianto (D.P.R. 74/2013)
                            </div>
                            <p>
                                Il responsabile dell'impianto termico (il proprietario o l'inquilino per gli impianti autonomi; l'amministratore o terzo responsabile per i centralizzati) deve custodire il <strong>Libretto di Impianto</strong> (D.M. 10 febbraio 2014) costantemente aggiornato.
                            </p>
                            <p>
                                <strong>Nessun intervento fai-da-te:</strong> Manutenzioni, ricariche di gas refrigerante F-Gas, pulizia dei bruciatori e tarature devono essere effettuate unicamente da tecnici abilitati ai sensi del <strong>D.M. 37/2008</strong>. Gli interventi su apparecchi a gas o circuiti elettrici eseguiti da personale non qualificato espongono al rischio gravissimo di incendi, fughe di gas o asfissia da monossido di carbonio (CO).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-4 rounded-xl border border-white/10 bg-navy-700/60 space-y-1">
                                <strong className="text-white block font-semibold">Controllo periodico di sicurezza</strong>
                                Ha frequenza definita dalle istruzioni tecniche del costruttore dell'apparecchio e dell'installatore (di norma annuale). Comprende la pulizia del bruciatore, la verifica delle tenute idrauliche e gas e il funzionamento dei dispositivi di sicurezza.
                            </div>
                            <div className="p-4 rounded-xl border border-white/10 bg-navy-700/60 space-y-1">
                                <strong className="text-white block font-semibold">Rapporto di Controllo Efficienza Energetica (Bollino Fumi)</strong>
                                Ha scadenze stabilite dalla normativa nazionale (D.P.R. 74/2013, allegato A) e dai regolamenti regionali (solitamente ogni 2 o 4 anni per generatori a metano fino a 100 kW). Al termine viene rilasciato il bollino e il rapporto viene trasmesso al Catasto Regionale Impianti Termici (es. CURIT, CIT, CIRCE, CRITER).
                            </div>
                        </div>
                    </section>

                    {/* Sezione 5: Sostituzione e preventivo */}
                    <section id="sostituzione-e-preventivo" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">05.</span>
                            Sostituire l'impianto e richiedere un preventivo accurato
                        </h2>
                        <p className="mb-3">
                            Quando decidi di sostituire la vecchia caldaia o installare una pompa di calore, richiedere preventivi dettagliati ti aiuta a confrontare le offerte voce per voce. Ecco le informazioni fondamentali da preparare:
                        </p>
                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2 mb-4">
                            <p><strong>1. Caratteristiche dell'impianto attuale:</strong> Modello, marca, potenza termica indicativa (es. 24 kW o 28 kW), combustibile (metano, GPL, gasolio, legna/pellet) e anni di esercizio.</p>
                            <p><strong>2. Ubicazione e canna fumaria:</strong> Specificare se il generatore è situato in cucina, in un ripostiglio dedicato, all'esterno su balcone o in locale tecnico cantina, e la tipologia di scarico fumi esistente.</p>
                            <p><strong>3. Superficie e volumi:</strong> Metri quadri dell'alloggio, altezza dei soffitti ed eventuale presenza di interventi di isolamento già eseguiti.</p>
                            <p><strong>4. Fornitura acqua calda sanitaria:</strong> Se la caldaia produce anche acqua per docce e rubinetti (istantanea o con bollitore ad accumulo).</p>
                        </div>
                    </section>

                    {/* Sezione 6: Incentivi e agevolazioni */}
                    <section id="incentivi-e-agevolazioni" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">06.</span>
                            Incentivi fiscali e Conto Termico GSE
                        </h2>
                        <p className="mb-3">
                            Per la sostituzione dei generatori di calore con soluzioni ad alta efficienza esistono strumenti di supporto economico disciplinati a livello nazionale:
                        </p>
                        <div className="space-y-3 text-xs">
                            <div className="p-4 rounded-xl border border-white/10 bg-navy-700/60">
                                <h3 className="font-bold text-white text-sm mb-1">Conto Termico (Gestito dal GSE)</h3>
                                <p className="text-slate-300 mb-1">
                                    È un incentivo economico diretto (bonifico sul conto corrente entro pochi mesi dall'approvazione della pratica) rivolto a privati e imprese che sostituiscono impianti di riscaldamento esistenti con pompe di calore elettriche ad alta efficienza, sistemi ibridi o impianti a biomassa certificati con 4 o 5 stelle ambientali.
                                </p>
                                <a href="https://www.gse.it/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-1 font-semibold">
                                    Visita il portale ufficiale GSE Conto Termico <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-navy-700/60">
                                <h3 className="font-bold text-white text-sm mb-1">Detrazioni Fiscali IRPEF (Bonus Casa ed Ecobonus)</h3>
                                <p className="text-slate-300 mb-1">
                                    Consentono di recuperare in dichiarazione dei redditi una quota delle spese sostenute per la sostituzione degli impianti (in quote annuali costanti). La spesa deve essere pagata con bonifico parlante e, per tutti gli interventi di riqualificazione energetica, è obbligatorio trasmettere la scheda descrittiva al portale ENEA entro 90 giorni dalla fine dei lavori.
                                </p>
                                <Link to="/blog/bonus-edilizi-2027" className="text-brand hover:underline inline-flex items-center gap-1 font-semibold">
                                    Approfondisci requisiti e aliquote nella guida: Bonus edilizi 2027 <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 7: FAQ */}
                    <section id="faq" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-4 flex items-center gap-2">
                            <HelpCircle className="h-6 w-6 text-brand" />
                            Domande Frequenti sugli Impianti di Riscaldamento (FAQ)
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
                    <section id="fonti-ufficiali" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">07.</span>
                            Fonti ufficiali e riferimenti normativi consultati
                        </h2>
                        <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2 text-xs text-slate-400">
                            <div>
                                <strong className="text-white">Normattiva:</strong> D.P.R. 16 aprile 2013, n. 74 (Esercizio, controllo e manutenzione degli impianti termici); D.M. 22 gennaio 2008, n. 37 (Sicurezza degli impianti); D.P.R. 26 agosto 1993, n. 412 (Zone climatiche e rendimenti minimi).
                            </div>
                            <div>
                                <strong className="text-white">ENEA (Efficienza Energetica):</strong>{" "}
                                <a href="https://www.efficienzaenergetica.enea.it/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">
                                    Vademecum generatori a biomassa, caldaie a condensazione e pompe di calore <ExternalLink className="h-3 w-3" />
                                </a>.
                            </div>
                            <div>
                                <strong className="text-white">GSE (Gestore dei Servizi Energetici):</strong>{" "}
                                <a href="https://www.gse.it/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">
                                    Regole applicative per l'accesso agli incentivi del Conto Termico <ExternalLink className="h-3 w-3" />
                                </a>.
                            </div>
                            <div>
                                <strong className="text-white">MASE (Ministero dell'Ambiente e della Sicurezza Energetica):</strong>{" "}
                                <a href="https://www.mase.gov.it/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">
                                    Disposizioni sull'efficienza energetica e transizione ecologica <ExternalLink className="h-3 w-3" />
                                </a>.
                            </div>
                        </div>
                    </section>

                    {/* Disclaimer */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-400 space-y-1.5">
                        <p className="font-semibold text-white">Avvertenza e nota di trasparenza:</p>
                        <p>
                            Questo articolo ha carattere divulgativo e informativo aggiornato alla data del 2 novembre 2026. Non costituisce perizia tecnica, progetto impiantistico o consulenza fiscale personalizzata. Il corretto dimensionamento del generatore di calore, la verifica dei canali da fumo e l'idoneità dei terminali devono essere accertati da un termotecnico o da un installatore abilitato ai sensi del D.M. 37/2008 in base alla specifica configurazione dell'edificio e ai regolamenti locali regionali e comunali.
                        </p>
                    </div>
                </article>

                {/* Call To Action Finale (Unica e non aggressiva) */}
                <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-brand/15 via-navy-700/80 to-navy-700/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-brand">Devi sostituire o controllare l'impianto?</span>
                        <h3 className="font-display font-bold text-xl text-white mt-1">
                            Richiedi preventivi da termoidraulici qualificati
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
                            Descrivi il tuo generatore e la tua zona su CasaLavoroPRO: ricevi proposte tecniche trasparenti da imprese iscritte e verificate del tuo territorio.
                        </p>
                    </div>
                    <Button asChild className="bg-brand hover:bg-brand/90 text-white shrink-0">
                        <Link to="/nuova-richiesta?categoria=Termoidraulica">
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
                    <Link to="/aziende?categoria=Termoidraulica" className="text-brand hover:underline">
                        Visualizza le imprese termoidrauliche verificate →
                    </Link>
                </div>
            </div>
        </div>
    );
}
