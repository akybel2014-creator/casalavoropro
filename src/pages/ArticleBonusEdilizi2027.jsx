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
    ShieldAlert,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    HelpCircle,
    Building2,
    Home,
    FileSpreadsheet,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const ARTICLE_METADATA = {
    slug: "bonus-edilizi-2027",
    title: "Bonus edilizi 2027: cosa possono usare privati e imprese",
    seoTitle: "Bonus Edilizi 2027: Guida a Detrazioni, Aliquote e Novità",
    metaDescription: "Quali bonus casa sono confermati per il 2027? Guida alle aliquote 50% e 36%, massimali, differenze prima/seconda casa, Ecobonus, Sismabonus e regole per le imprese.",
    canonicalUrl: "/blog/bonus-edilizi-2027",
    date: "2 Novembre 2026",
    updatedDate: "Aggiornato al 2 novembre 2026",
    readTime: "9 min di lettura",
    category: "normative",
    categoryLabel: "Normative & Bonus Edili",
    author: "Redazione Tecnica CasaLavoroPRO",
    reviewer: "Revisione Ufficio Studi Normativi",
    excerpt: "Guida completa e verificata sulle detrazioni fiscali per i lavori in casa nel 2027: cosa prevede il DdL di Bilancio per prima casa (50%), seconde case (36%), condomìni e imprese."
};

const FAQ_ITEMS = [
    {
        q: "Quali bonus edilizi sono confermati per il 2027?",
        a: "A legislazione vigente (TUIR art. 16-bis), per il 2027 è strutturalmente attivo il Bonus Ristrutturazioni con aliquota ordinaria al 36% e massimale di 48.000 € (o le quote previste dalla disciplina transitoria). Il Disegno di Legge di Bilancio 2027 approvato dal Governo e in corso di esame parlamentare propone invece di prorogare le aliquote differenziate: 50% per la prima casa (massimale 96.000 €) e 36% per le seconde case (massimale 96.000 €), allineando a tali parametri anche Ecobonus e Sismabonus, oltre a rinnovare il Bonus Mobili al 50% fino a 5.000 €."
    },
    {
        q: "Qual è l'aliquota del Bonus Casa nel 2027?",
        a: "Nella proposta del Disegno di Legge di Bilancio 2027, l'aliquota è differenziata in base alla destinazione dell'immobile: 50% per l'abitazione principale (prima casa) e relative pertinenze, e 36% per le seconde case, immobili locati o a disposizione. Il massimale di spesa agevolabile è fissato a 96.000 € per unità immobiliare, ripartito in 10 quote annuali costanti."
    },
    {
        q: "Il Bonus Mobili è valido anche nel 2027?",
        a: "Il disegno di legge di Bilancio 2027 prevede la conferma della detrazione del 50% per l'acquisto di mobili e grandi elettrodomestici di classe energetica elevata, con un limite massimo di spesa agevolabile confermato a 5.000 € per unità abitativa. Il bonus spetta esclusivamente se collegato a interventi di ristrutturazione edilizia avviati a partire dall'anno solare precedente."
    },
    {
        q: "Cosa cambia esattamente tra abitazione principale e seconda casa?",
        a: "La disciplina applicabile nel 2027 riserva l'aliquota più favorevole del 50% ai possessori o detentori dell'immobile adibito a propria abitazione principale (dimora abituale e residenza anagrafica). Per tutte le altre unità immobiliari (seconde case di vacanza, appartamenti concessi in locazione o tenuti sfitti), l'aliquota detraibile scende al 36%."
    },
    {
        q: "Le imprese possono usare gli stessi bonus edilizi dei privati?",
        a: "No. Le detrazioni IRPEF disciplinate dall'art. 16-bis del TUIR sono riservate alle persone fisiche assoggettate all'imposta sui redditi. Come ribadito da costante prassi dell'Agenzia delle Entrate, le società e gli enti commerciali soggetti a IRES non possono fruire delle detrazioni del Bonus Casa per immobili patrimoniali o beni merce. Per le imprese esistono canali fiscali e contributivi distinti, come il Piano Transizione 5.0 per beni strumentali o gli incentivi del Conto Termico GSE."
    },
    {
        q: "Quali lavori richiedono obbligatoriamente la comunicazione all'ENEA?",
        a: "Tutti gli interventi di recupero edilizio che comportano risparmio energetico o l'utilizzo di fonti rinnovabili (es. sostituzione infissi, posa di isolamenti termici, installazione pompe di calore, pannelli solari termici, caldaie a condensazione ad alta efficienza) richiedono la trasmissione telematica dei dati all'ENEA entro 90 giorni dalla fine dei lavori o dal collaudo, ai sensi dell'art. 16, comma 2-bis del D.L. 63/2013."
    },
    {
        q: "Il Disegno di Legge di Bilancio 2027 è già legge definitiva?",
        a: "No. Il testo licenziato dal Consiglio dei Ministri è un disegno di legge (DdL) presentato al Parlamento. L'iter prevede la discussione e l'approvazione del testo da parte della Camera dei Deputati e del Senato della Repubblica, con possibili emendamenti. La manovra diventerà legge vigente solo dopo l'approvazione finale e la successiva pubblicazione nella Gazzetta Ufficiale, prevista entro il 31 dicembre."
    },
    {
        q: "È ancora possibile ottenere lo sconto in fattura o la cessione del credito nel 2027?",
        a: "No. A seguito dei decreti legge n. 11/2023 e n. 39/2024, le opzioni di sconto immediato in fattura e di cessione del credito d'imposta sono state abrogate per la generalità dei nuovi interventi. L'unica modalità di fruizione per il 2027 è la detrazione fiscale diretta in dichiarazione dei redditi (modello 730 o Redditi PF) ripartita in 10 rate annuali, nei limiti della capienza IRPEF del contribuente."
    }
];

export default function ArticleBonusEdilizi2027() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = `${ARTICLE_METADATA.seoTitle} | CasaLavoroPRO`;
        return () => {
            document.title = prevTitle;
        };
    }, []);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: ARTICLE_METADATA.title,
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
                    <span className="text-slate-200">Bonus edilizi 2027</span>
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
                            {ARTICLE_METADATA.categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {ARTICLE_METADATA.updatedDate}
                        </span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                        {ARTICLE_METADATA.title}
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                        {ARTICLE_METADATA.excerpt}
                    </p>

                    {/* Metadati Autore / Data / Tempo */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-slate-400">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                <User className="h-3.5 w-3.5 text-brand" />
                                {ARTICLE_METADATA.author}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_METADATA.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                {ARTICLE_METADATA.readTime}
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

                {/* Box In Evidenza: "In Breve" (3-5 punti verificati) */}
                <div className="mb-10 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-navy-700/80 to-navy-700/80 p-6 sm:p-7">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-brand shrink-0" />
                        <h2 className="font-display font-bold text-white text-base sm:text-lg">
                            In sintesi: cosa c'è da sapere per il 2027
                        </h2>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Prima casa al 50%:</strong> Nel Disegno di Legge di Bilancio 2027 in discussione alle Camere, l'aliquota per l'abitazione principale è proposta al 50% (tetto di spesa a 96.000 € in 10 rate annuali), evitando il calo al 36% previsto a legislazione ordinaria.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Seconde case al 36%:</strong> Per le unità immobiliari non adibite ad abitazione principale, la manovra propone di confermare il 36% (fino a 96.000 €), allontanando la discesa al 30%.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Nessuno sconto in fattura o cessione del credito:</strong> Le misure straordinarie sono definitivamente superate (D.L. 11/2023 e D.L. 39/2024). Il beneficio si ottiene esclusivamente come detrazione IRPEF a rimborso fiscale in 10 anni.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Regole separate per imprese e società (IRES):</strong> Le detrazioni del Bonus Casa (art. 16-bis TUIR) riguardano solo persone fisiche su immobili residenziali. Per le imprese operano incentivi dedicati (es. Conto Termico GSE o crediti d'imposta per beni strumentali).
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>Iter legislativo:</strong> La Manovra 2027 è in discussione parlamentare. Fino alla pubblicazione della Legge di Bilancio in Gazzetta Ufficiale (entro il 31 dicembre), le nuove percentuali costituiscono una proposta normativa e non una norma già vigente.
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
                        <li><a href="#quadro-normativo" className="hover:text-brand transition-colors">Legge vigente vs. Disegno di Legge di Bilancio 2027</a></li>
                        <li><a href="#privati-prima-seconda-casa" className="hover:text-brand transition-colors">Bonus Casa 2027: prima casa vs. seconda casa</a></li>
                        <li><a href="#ecobonus-sismabonus" className="hover:text-brand transition-colors">Ecobonus e Sismabonus: cosa cambia nel 2027</a></li>
                        <li><a href="#bonus-mobili" className="hover:text-brand transition-colors">Bonus Mobili ed Elettrodomestici 2027</a></li>
                        <li><a href="#superbonus" className="hover:text-brand transition-colors">Superbonus: la situazione al 2027</a></li>
                        <li><a href="#sconto-fattura-capienza" className="hover:text-brand transition-colors">Stop allo sconto in fattura e capienza fiscale IRPEF</a></li>
                        <li><a href="#tetti-reddito-alto" className="hover:text-brand transition-colors">Il nuovo tetto detrazioni sopra 75.000 euro</a></li>
                        <li><a href="#condomini" className="hover:text-brand transition-colors">Regole specifiche per i condomìni</a></li>
                        <li><a href="#imprese-professionisti" className="hover:text-brand transition-colors">Cosa possono usare imprese e partite IVA</a></li>
                        <li><a href="#adempimenti-enea" className="hover:text-brand transition-colors">Bonifico parlante e comunicazione ENEA</a></li>
                        <li><a href="#tabella-riepilogativa" className="hover:text-brand transition-colors">Tabella di sintesi delle agevolazioni 2027</a></li>
                        <li><a href="#faq" className="hover:text-brand transition-colors">Domande Frequenti (FAQ)</a></li>
                        <li><a href="#fonti-ufficiali" className="hover:text-brand transition-colors">Fonti primarie e documenti ufficiali</a></li>
                    </ol>
                </div>

                {/* Corpo editoriale */}
                <article className="space-y-10 text-sm leading-relaxed text-slate-300">
                    {/* Sezione 1: Quadro Normativo */}
                    <section id="quadro-normativo" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">01.</span>
                            Il quadro generale: norme vigenti vs. Disegno di Legge di Bilancio 2027
                        </h2>
                        <p className="mb-3">
                            Per comprendere con chiarezza quali agevolazioni saranno utilizzabili nel 2027, è indispensabile operare una rigorosa distinzione giuridica tra ciò che è <strong>attualmente iscritto nella legge vigente</strong> e ciò che è <strong>proposto nel Disegno di Legge di Bilancio 2027</strong> presentato dal Governo.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs space-y-1.5">
                                <span className="font-mono text-emerald-400 font-semibold uppercase block">A Legislazione Ordinaria TUIR</span>
                                <p className="text-slate-300">
                                    L'art. 16-bis del D.P.R. 917/1986 prevede una detrazione a regime del <strong>36%</strong> con un limite di spesa massimo di <strong>48.000 euro</strong> per unità immobiliare. I successivi interventi di riordino pluriennale avrebbero comportato per il 2027 un declassamento dell'aliquota al 36% per la prima casa e al 30% per le seconde case.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-brand/30 bg-brand/5 text-xs space-y-1.5">
                                <span className="font-mono text-brand font-semibold uppercase block">Nel DdL di Bilancio 2027 (In esame)</span>
                                <p className="text-slate-300">
                                    Il testo varato dall'Esecutivo introduce una <strong>proroga per il 2027</strong> che mantiene le aliquote al <strong>50% per la prima casa</strong> e al <strong>36% per le altre abitazioni</strong>, confermando il tetto di spesa a <strong>96.000 euro</strong> per unità immobiliare e rinviando gli ulteriori tagli di aliquota al 2028.
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 italic">
                            Nota di prudenza legislativa: il Disegno di Legge deve completare l'esame e l'approvazione formale presso la Camera dei Deputati e il Senato della Repubblica. Fino all'entrata in vigore della Legge definitiva (entro il 31 dicembre), il testo può subire emendamenti o rimodulazioni tecniche.
                        </p>
                    </section>

                    {/* Sezione 2: Privati, Prima e Seconda Casa */}
                    <section id="privati-prima-seconda-casa" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">02.</span>
                            Bonus Ristrutturazioni 2027: prima casa vs. seconda casa
                        </h2>
                        <p className="mb-3">
                            Il perno principale delle agevolazioni per i privati rimane il <strong>Bonus Casa (Recupero del patrimonio edilizio)</strong>.
                            La novità cardine del biennio 2026-2027 è la differenziazione strutturale dell'incentivo in funzione della destinazione dell'unità immobiliare:
                        </p>
                        <div className="space-y-4 my-4">
                            <div className="p-5 rounded-2xl border border-white/10 bg-navy-700/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                        <Home className="h-4 w-4 text-brand" /> Abitazione Principale (Prima Casa)
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/20 text-brand border border-brand/30 font-mono">
                                        50% Detrazione
                                    </span>
                                </div>
                                <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
                                    <li><strong>Requisito soggettivo:</strong> l'immobile deve essere destinato ad abitazione principale (dimora abituale del possessore o titolare di diritto reale di godimento con residenza anagrafica).</li>
                                    <li><strong>Limite di spesa:</strong> 96.000 euro per unità immobiliare, comprensiva delle relative pertinenze (garage, cantine, soffitte).</li>
                                    <li><strong>Ripartizione:</strong> 10 quote annuali di pari importo in dichiarazione dei redditi.</li>
                                    <li><strong>Lavori ammessi:</strong> manutenzione straordinaria, restauro e risanamento conservativo, ristrutturazione edilizia su singole unità residenziali.</li>
                                </ul>
                            </div>

                            <div className="p-5 rounded-2xl border border-white/10 bg-navy-700/60">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-slate-400" /> Seconde Case e Altri Immobili Residenziali
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/20 font-mono">
                                        36% Detrazione
                                    </span>
                                </div>
                                <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
                                    <li><strong>Ambito applicativo:</strong> seconde case per vacanze, appartamenti locati a terzi o immobili a disposizione.</li>
                                    <li><strong>Limite di spesa:</strong> 96.000 euro per unità immobiliare.</li>
                                    <li><strong>Ripartizione:</strong> 10 quote annuali costanti.</li>
                                    <li><strong>Lavori ammessi:</strong> medesime categorie di opere (manutenzione straordinaria, restauro, ristrutturazione).</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">
                            Fonte ufficiale: <a href="https://www.agenziaentrate.gov.it/portale/ristrutturazioni-edilizie-le-agevolazioni-fiscali" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">Agenzia delle Entrate, Scheda informativa sulle Ristrutturazioni Edilizie <ExternalLink className="h-3 w-3" /></a>.
                        </p>
                    </section>

                    {/* Sezione 3: Ecobonus e Sismabonus */}
                    <section id="ecobonus-sismabonus" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">03.</span>
                            Ecobonus e Sismabonus: cosa cambia nel 2027
                        </h2>
                        <p className="mb-3">
                            Nel quadro del riordino delle agevolazioni edilizie all'interno del TUIR, anche le detrazioni speciali per l'efficienza energetica (Ecobonus) e la riduzione del rischio sismico (Sismabonus) subiscono una razionalizzazione:
                        </p>
                        <div className="space-y-3 my-4">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <h3 className="font-bold text-white text-sm mb-1.5">Ecobonus (Riqualificazione Energetica)</h3>
                                <p className="mb-2">
                                    Non è confermata l'aliquota generalizzata del 65% del passato. Le misure proposte per il 2027 si allineano ai criteri del recupero edilizio (50% per abitazione principale, 36% per le altre unità).
                                </p>
                                <p>
                                    <strong>Interventi ammessi:</strong> sostituzione di impianti di climatizzazione invernale con pompe di calore o generatori ibridi ad alta efficienza, installazione di collettori solari termici per acqua calda sanitaria, coibentazione termica di pareti e coperture, sostituzione di serramenti e infissi con rispetto dei valori limite di trasmittanza termica (D.M. Requisiti Minimi).
                                </p>
                                <p className="mt-2 text-slate-400">
                                    Riferimento tecnico: <a href="https://www.efficienzaenergetica.enea.it/detrazioni-fiscali/ecobonus/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline inline-flex items-center gap-0.5">Portale ENEA Ecobonus <ExternalLink className="h-3 w-3" /></a>.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <h3 className="font-bold text-white text-sm mb-1.5">Sismabonus Ordinario</h3>
                                <p className="mb-2">
                                    Per gli interventi di messa in sicurezza statica e antisismica eseguiti su edifici situati nelle zone a rischio sismico 1, 2 e 3 (esclusa la zona 4 a bassissima sismicità), le percentuali si uniformano ai medesimi scaglioni (50% prima casa, 36% seconde case) con limite di spesa di 96.000 € ripartito in quote annuali.
                                </p>
                                <p className="text-slate-400">
                                    Riferimento normativo: Art. 16, commi 1-bis e ss. del D.L. 63/2013 e successive modifiche.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 4: Bonus Mobili */}
                    <section id="bonus-mobili" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">04.</span>
                            Bonus Mobili ed Elettrodomestici 2027
                        </h2>
                        <p className="mb-3">
                            Il <strong>Bonus Mobili</strong> è confermato all'interno del Disegno di Legge di Bilancio 2027. Ecco i paletti precisi e confermati dalle fonti ufficiali:
                        </p>
                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2">
                            <p><strong>Aliquota:</strong> Detrazione IRPEF del 50% ripartita in 10 rate annuali di pari importo.</p>
                            <p><strong>Limite massimo di spesa:</strong> 5.000 euro complessivi per singola unità immobiliare oggetto di ristrutturazione (comprensivi di eventuali spese di trasporto e montaggio).</p>
                            <p><strong>Vincolo di collegamento:</strong> L'agevolazione spetta solo se l'acquisto di arredi o grandi elettrodomestici è correlato a un intervento di recupero edilizio (manutenzione straordinaria, restauro o ristrutturazione) avviato a partire dal 1° gennaio dell'anno precedente a quello dell'acquisto.</p>
                            <p><strong>Requisiti elettrodomestici:</strong> Classe non inferiore alla classe A per i forni, alla classe E per le lavatrici, lavasciuga e lavastoviglie, alla classe F per i frigoriferi e congelatori (secondo le etichette energetiche europee vigenti).</p>
                        </div>
                    </section>

                    {/* Sezione 5: Superbonus */}
                    <section id="superbonus" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">05.</span>
                            Superbonus: la situazione al 2027
                        </h2>
                        <p className="mb-3">
                            È fondamentale chiarire un equivoco diffuso: <strong>nel 2027 non esiste alcun Superbonus ordinario (né al 110%, né al 70%, né al 65%)</strong> per la generalità dei proprietari di casa, villette o condomini.
                        </p>
                        <p className="text-xs text-slate-300">
                            La misura straordinaria nata con l'art. 119 del D.L. 34/2020 ha completato il suo ciclo temporale. Per le spese sostenute a partire dal 2026/2027, le detrazioni ordinarie di riferimento rimangono esclusivamente il Bonus Ristrutturazioni e l'Ecobonus. Rimangono applicabili unicamente limitatissime discipline speciali destinate agli immobili colpiti dagli eventi sismici del Centro Italia e dell'Abruzzo (D.L. 39/2024), per i quali operano fondi dedicati e vincoli stringenti di stanziamento.
                        </p>
                    </section>

                    {/* Sezione 6: Stop allo sconto in fattura e capienza fiscale */}
                    <section id="sconto-fattura-capienza" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">06.</span>
                            Stop a sconto in fattura e cessione del credito: la capienza IRPEF
                        </h2>
                        <p className="mb-3">
                            Con i provvedimenti del D.L. 11/2023 (Decreto Cessioni) e del successivo D.L. 39/2024, il legislatore italiano ha <strong>definitivamente chiuso la possibilità di richiedere lo sconto in fattura o di cedere il credito d'imposta</strong> a banche o intermediari per i nuovi lavori.
                        </p>
                        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 space-y-2 my-3">
                            <div className="flex items-center gap-2 font-bold text-white text-sm">
                                <ShieldAlert className="h-4 w-4 text-amber-400" /> Cos'è la "Capienza Fiscale" e perché è decisiva
                            </div>
                            <p>
                                Una detrazione fiscale non è un rimborso in denaro inviato sul conto corrente né un assegno dello Stato: è un abbattimento dell'Imposta sul Reddito delle Persone Fisiche (IRPEF) lorda dovuta annualmente dal contribuente.
                            </p>
                            <p>
                                <strong>Esempio pratico:</strong> Se un contribuente ha una spesa che genera una detrazione annuale di 4.000 euro (es. 40.000 € al 50% in 10 rate da 2.000 €), ma la sua IRPEF netta dovuta quell'anno è pari a 1.500 euro, potrà beneficiare solo di 1.500 euro di sgravio. La quota residua (500 euro) non può essere chiesta a rimborso né riportata all'anno successivo: viene definitivamente persa.
                            </p>
                        </div>
                    </section>

                    {/* Sezione 7: Tetto ai redditi elevati */}
                    <section id="tetti-reddito-alto" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">07.</span>
                            Il nuovo tetto alle detrazioni per i redditi sopra i 75.000 euro
                        </h2>
                        <p className="mb-3">
                            Un elemento di forte novità da considerare nel 2027 è l'introduzione dell'art. 16-ter del TUIR, che istituisce un <strong>tetto complessivo alle spese detraibili</strong> parametrato al reddito complessivo del contribuente e al numero di figli a carico:
                        </p>
                        <div className="overflow-x-auto my-3">
                            <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
                                <thead>
                                    <tr className="bg-navy-700 text-white font-semibold border-b border-white/10">
                                        <th className="p-3">Fascia di Reddito Complessivo</th>
                                        <th className="p-3">Importo Base Detraibile</th>
                                        <th className="p-3">Coefficiente Figli a Carico</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    <tr>
                                        <td className="p-3">Fino a 75.000 euro</td>
                                        <td className="p-3 text-emerald-400 font-semibold">Nessun tetto aggiuntivo</td>
                                        <td className="p-3">Detrazioni piene secondo massimali ordinari</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Oltre 75.000 e fino a 100.000 euro</td>
                                        <td className="p-3">Base di 14.000 euro</td>
                                        <td className="p-3">Moltiplicata per coefficiente (0,5 senza figli fino a 1 con più di 2 figli)</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3">Oltre 100.000 euro</td>
                                        <td className="p-3">Base di 8.000 euro</td>
                                        <td className="p-3">Moltiplicata per coefficiente familiare</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-400">
                            Nota: sono salvaguardate le rate residue delle spese sostenute in annualità pregresse. Il tetto si applica ai nuovi oneri sostenuti.
                        </p>
                    </section>

                    {/* Sezione 8: Condomìni */}
                    <section id="condomini" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">08.</span>
                            Regole specifiche per i Condomìni
                        </h2>
                        <p className="mb-3">
                            Per i lavori eseguiti sulle <strong>parti comuni degli edifici condominiali</strong> (facciate, tetti, vani scale, portoni d'ingresso, impianti centralizzati), la disciplina presenta specificità determinanti:
                        </p>
                        <ul className="space-y-2 list-disc list-inside text-xs text-slate-300 mb-3">
                            <li><strong>Manutenzione ordinaria agevolabile:</strong> a differenza dei singoli appartamenti (dove la manutenzione ordinaria è esclusa), sulle parti comuni condominiali anche i lavori di tinteggiatura, riparazione intonaci e impermeabilizzazioni ordinarie danno diritto alla detrazione fiscale.</li>
                            <li><strong>Ripartizione millesimale:</strong> ciascun condomino detrae la quota di spesa effettivamente versata al condominio entro la chiusura dell'anno fiscale, in proporzione ai propri millesimi di proprietà (o diversamente deliberato dall'assemblea).</li>
                            <li><strong>Adempimenti dell'Amministratore:</strong> il pagamento dell'impresa esecutrice deve essere eseguito dall'amministratore mediante bonifico parlante con il codice fiscale del condominio. L'amministratore rilascia ai condomini la certificazione delle quote versate e trasmette i dati all'Agenzia delle Entrate per la dichiarazione precompilata.</li>
                        </ul>
                    </section>

                    {/* Sezione 9: Imprese e Professionisti */}
                    <section id="imprese-professionisti" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">09.</span>
                            Imprese e Professionisti: cosa possono usare nel 2027?
                        </h2>
                        <p className="mb-3">
                            Occorre sgombrare il campo da equivoci: <strong>le agevolazioni per le persone fisiche non si estendono automaticamente alle imprese</strong>.
                        </p>
                        <div className="space-y-3 text-xs">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-bold text-white text-sm mb-1">Società di capitali e soggetti IRES</h3>
                                <p className="text-slate-300">
                                    Come stabilito da costante giurisprudenza e confermato dalle risoluzioni dell'Agenzia delle Entrate, le società commerciali non possono fruire delle detrazioni dell'art. 16-bis TUIR per interventi su fabbricati strumentali, beni merce o immobili patrimonio. I costi sostenuti concorrono alla determinazione del reddito d'impresa secondo i normali criteri di ammortamento e deducibilità ordinaria ex D.P.R. 917/1986.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-bold text-white text-sm mb-1">Quali incentivi energetici spettano alle imprese?</h3>
                                <p className="text-slate-300 mb-2">
                                    Le imprese che desiderano riqualificare i propri capannoni, uffici o stabilimenti produttivi possono accedere a canali alternativi:
                                </p>
                                <ul className="space-y-1 list-disc list-inside text-slate-300">
                                    <li><strong>Conto Termico (gestito dal GSE):</strong> incentivo a fondo perduto per la sostituzione di impianti di riscaldamento con pompe di calore industriali, caldaie a biomassa o solare termico.</li>
                                    <li><strong>Transizione 5.0 (crediti d'imposta beni strumentali):</strong> incentivi dedicati all'acquisto di beni materiali e immateriali 4.0 che garantiscano una riduzione certificata dei consumi energetici della struttura produttiva.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Sezione 10: Adempimenti e ENEA */}
                    <section id="adempimenti-enea" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">10.</span>
                            Adempimenti obbligatori: bonifico parlante e comunicazione ENEA
                        </h2>
                        <p className="mb-3">
                            Per non rischiare la revoca della detrazione in sede di controllo da parte dell'Agenzia delle Entrate, è obbligatorio rispettare alla lettera tre adempimenti:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <span className="font-bold text-brand block mb-1 text-sm">1. Bonifico Parlante</span>
                                Il pagamento deve avvenire tramite bonifico bancario o postale dedicato alle detrazioni fiscali edilizie. Deve contenere: causale di legge (art. 16-bis DPR 917/86), codice fiscale del committente e Partita IVA della ditta.
                            </div>
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <span className="font-bold text-brand block mb-1 text-sm">2. Titoli Abilitativi</span>
                                Pratica edilizia depositata in Comune (CILA o SCIA a seconda dei lavori). Per gli interventi in "edilizia libera" (es. sostituzione caldaia o infissi), occorre predisporre una dichiarazione sostitutiva di atto notorio con la data di avvio dei lavori.
                            </div>
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <span className="font-bold text-brand block mb-1 text-sm">3. Portale ENEA</span>
                                Per tutti i lavori che comportano risparmio energetico, la scheda descrittiva dell'intervento deve essere trasmessa sul portale ENEA entro 90 giorni dalla fine dei lavori o dal collaudo.
                            </div>
                        </div>
                    </section>

                    {/* Sezione 11: Tabella Comparativa di Sintesi */}
                    <section id="tabella-riepilogativa" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">11.</span>
                            Tabella comparativa Bonus Edilizi 2027
                        </h2>
                        <p className="mb-4 text-xs text-slate-400">
                            Riepilogo comparativo basato sulle normative vigenti e sulle previsioni del Disegno di Legge di Bilancio 2027:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse border border-white/10 rounded-2xl overflow-hidden">
                                <thead>
                                    <tr className="bg-navy-700/80 text-white font-semibold border-b border-white/10">
                                        <th className="p-3">Agevolazione</th>
                                        <th className="p-3">Destinatari</th>
                                        <th className="p-3">Aliquota Proposta 2027</th>
                                        <th className="p-3">Massimale di Spesa</th>
                                        <th className="p-3">Ripartizione</th>
                                        <th className="p-3">Stato Normativo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Bonus Ristrutturazioni (Prima Casa)</td>
                                        <td className="p-3">Persone fisiche (dimora abituale)</td>
                                        <td className="p-3 font-bold text-emerald-400">50%</td>
                                        <td className="p-3">96.000 € / unità</td>
                                        <td className="p-3">10 anni</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">In DdL Bilancio</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Bonus Ristrutturazioni (Seconde Case)</td>
                                        <td className="p-3">Persone fisiche (altri immobili)</td>
                                        <td className="p-3 font-bold text-slate-200">36%</td>
                                        <td className="p-3">96.000 € / unità</td>
                                        <td className="p-3">10 anni</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">In DdL Bilancio</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Ecobonus (Efficienza Energetica)</td>
                                        <td className="p-3">Persone fisiche su residenziale</td>
                                        <td className="p-3">50% (prima casa) / 36% (altri)</td>
                                        <td className="p-3">Variabile per intervento</td>
                                        <td className="p-3">10 anni</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">In DdL Bilancio</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Sismabonus Ordinario</td>
                                        <td className="p-3">Zone sismiche 1, 2, 3</td>
                                        <td className="p-3">50% (prima casa) / 36% (altri)</td>
                                        <td className="p-3">96.000 € / unità</td>
                                        <td className="p-3">10 anni</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">In DdL Bilancio</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Bonus Mobili ed Elettrodomestici</td>
                                        <td className="p-3">Collegato a ristrutturazione</td>
                                        <td className="p-3 font-bold text-emerald-400">50%</td>
                                        <td className="p-3">5.000 € complessivi</td>
                                        <td className="p-3">10 anni</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">In DdL Bilancio</span></td>
                                    </tr>
                                    <tr className="opacity-75">
                                        <td className="p-3 font-semibold text-white">Superbonus Ordinario</td>
                                        <td className="p-3">Generalità condomini e villette</td>
                                        <td className="p-3 font-bold text-rose-400">Non applicabile (0%)</td>
                                        <td className="p-3">—</td>
                                        <td className="p-3">—</td>
                                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">Misura conclusa</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Sezione 12: FAQ */}
                    <section id="faq" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-2xl text-white mb-4 flex items-center gap-2">
                            <HelpCircle className="h-6 w-6 text-brand" />
                            Domande Frequenti sui Bonus Edilizi 2027 (FAQ)
                        </h2>
                        <div className="space-y-4">
                            {FAQ_ITEMS.map((item, idx) => (
                                <div key={idx} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5 text-xs text-slate-300">
                                    <h3 className="font-display font-bold text-sm text-white mb-2">
                                        {item.q}
                                    </h3>
                                    <p className="leading-relaxed text-slate-300">
                                        {item.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sezione 13: Fonti Ufficiali Consultate */}
                    <section id="fonti-ufficiali" className="scroll-mt-28">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">12.</span>
                            Fonti ufficiali e riferimenti normativi consultati
                        </h2>
                        <p className="text-xs text-slate-400 mb-3">
                            Tutte le informazioni riportate nella presente guida derivano dalla consultazione diretta dei testi normativi e dei documenti istituzionali (consultati alla data del 2 novembre 2026):
                        </p>
                        <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2 text-xs">
                            <div>
                                <strong className="text-white">Gazzetta Ufficiale della Repubblica Italiana:</strong> Testo Unico delle Imposte sui Redditi (D.P.R. 22 dicembre 1986, n. 917, art. 16-bis e 16-ter); Decreto-Legge 16 febbraio 2023, n. 11; Decreto-Legge 29 marzo 2024, n. 39.
                            </div>
                            <div>
                                <strong className="text-white">Agenzia delle Entrate:</strong>{" "}
                                <a href="https://www.agenziaentrate.gov.it/portale/ristrutturazioni-edilizie-le-agevolazioni-fiscali" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                                    Guida ufficiale Ristrutturazioni Edilizie
                                </a>{" "}
                                e{" "}
                                <a href="https://www.agenziaentrate.gov.it/portale/aree-tematiche/casa/agevolazioni/agevolazioni-risparmio-energetico" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                                    Agevolazioni per il risparmio energetico
                                </a>.
                            </div>
                            <div>
                                <strong className="text-white">ENEA (Agenzia Nazionale Efficienza Energetica):</strong>{" "}
                                <a href="https://www.efficienzaenergetica.enea.it/detrazioni-fiscali/ecobonus/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                                    Portale Detrazioni Fiscali e Vademecum Tecnici
                                </a>.
                            </div>
                            <div>
                                <strong className="text-white">Presidenza della Repubblica (Quirinale):</strong>{" "}
                                <a href="https://www.quirinale.it/elementi/414249" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                                    Autorizzazione alla presentazione del Disegno di Legge di Bilancio alle Camere
                                </a>.
                            </div>
                            <div>
                                <strong className="text-white">Senato della Repubblica e Camera dei Deputati:</strong>{" "}
                                <a href="https://www.senato.it/show-doc?id=1439651&idoggetto=0&leg=19&part=dossier_dossier1-sezione_sezione9-h4_h413&tipodoc=DOSSIER" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                                    Dossier del Servizio Studi sulle disposizioni in materia di agevolazioni fiscali per la casa
                                </a>.
                            </div>
                        </div>
                    </section>

                    {/* Nota Metodologica e Disclaimer */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-400 space-y-2">
                        <p className="font-semibold text-white">Nota metodologica e avvertenza legale:</p>
                        <p>
                            Questo articolo ha finalità esclusivamente divulgative e informative alla data del 2 novembre 2026. Non costituisce consulenza tributaria, fiscale o finanziaria personalizzata. L'effettiva spettanza e la convenienza economica delle detrazioni dipendono dalla specifica situazione reddituale dell'interessato, dalla tipologia catastale dell'immobile, dalla qualificazione edilizia dell'opera e dal testo definitivo della Legge di Bilancio che sarà approvato dal Parlamento. Prima di effettuare spese o assumere impegni contrattuali si consiglia di consultare il proprio commercialista o CAF di fiducia e di verificare la fattibilità tecnica con un professionista abilitato.
                        </p>
                    </div>
                </article>

                {/* Call To Action Contestuale (Singola, non aggressiva) */}
                <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-brand/15 via-navy-700/80 to-navy-700/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-brand">Pianifichi un intervento di ristrutturazione?</span>
                        <h3 className="font-display font-bold text-xl text-white mt-1">
                            Richiedi preventivi chiari da imprese verificate
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
                            Un capitolato dettagliato e suddiviso per singole voci di costo è il primo requisito indispensabile per documentare correttamente le detrazioni fiscali.
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
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Torna a tutti gli articoli del Blog
                    </Link>
                    <Link to="/aziende" className="text-brand hover:underline">
                        Trova aziende edili verificate nella tua provincia →
                    </Link>
                </div>
            </div>
        </div>
    );
}
