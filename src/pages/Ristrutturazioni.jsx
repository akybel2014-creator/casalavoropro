import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Hammer,
    Wrench,
    Paintbrush,
    Layers,
    Flame,
    Zap,
    DoorClosed,
    ShieldCheck,
    CheckCircle2,
    HelpCircle,
    ChevronRight,
    ArrowRight,
    FileText,
    Info,
    MapPin,
    Calendar,
    Sparkles,
    AlertCircle,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const RISTRUTTURAZIONI_METADATA = {
    seoTitle: "Ristrutturazioni Casa: Preventivi Gratuiti e Imprese | CasaLavoroPRO",
    metaDescription: "Cerchi un'impresa per ristrutturare casa, bagno o cucina? Descrivi il tuo intervento, trova professionisti verificati nella tua zona e ricevi preventivi gratuiti.",
    canonicalUrl: "/ristrutturazioni"
};

const TIPI_INTERVENTO = [
    {
        title: "Ristrutturazione completa casa o appartamento",
        desc: "Interventi coordinati per rinnovare l'intero immobile: redistribuzione degli ambienti, rifacimento di tutti gli impianti (elettrico, idrico, riscaldamento), nuove pavimentazioni, intonaci e serramenti.",
        categoria: "Ristrutturazione Casa",
        icon: Hammer,
        tag: "Completa"
    },
    {
        title: "Rifacimento bagno",
        desc: "Demolizione e smaltimento vecchi rivestimenti, rifacimento delle tubazioni sottotraccia di carico e scarico, posa piastrelle, impermeabilizzazione con guaine liquide, installazione sanitari, box doccia o vasca.",
        categoria: "Idraulica",
        icon: Wrench,
        tag: "Bagno"
    },
    {
        title: "Ristrutturazione cucina",
        desc: "Riprogettazione dei punti presa elettrici per elettrodomestici, adeguamento allacci gas e scarichi idraulici, posa paraschizzi e rivestimenti, predisposizione cappa aspirante.",
        categoria: "Ristrutturazioni",
        icon: Sparkles,
        tag: "Cucina"
    },
    {
        title: "Pavimenti e rivestimenti",
        desc: "Posa in opera di gres porcellanato, parquet laminato o prefinito, resine e pietre naturali. Ripristino o rifacimento massetti di sottofondo e posa battiscopa.",
        categoria: "Ristrutturazioni",
        icon: Layers,
        tag: "Pavimenti"
    },
    {
        title: "Tinteggiatura e opere in cartongesso",
        desc: "Riparazione crepe, rasature a gesso, tinteggiature traspiranti o lavabili, trattamenti antimuffa. Creazione di pareti divisorie, contropareti termoisolanti e controsoffitti.",
        categoria: "Imbiancatura",
        icon: Paintbrush,
        tag: "Finiture"
    },
    {
        title: "Impianti termoidraulici e climatizzazione",
        desc: "Installazione o sostituzione pompe di calore, caldaie a condensazione, impianti a pavimento radiante, condizionatori split e rilascio delle dichiarazioni di conformità DM 37/08.",
        categoria: "Termoidraulica",
        icon: Flame,
        tag: "Impianti"
    },
    {
        title: "Impianto elettrico e illuminazione",
        desc: "Rifacimento quadro elettrico salvavita, passaggio nuovi conduttori sottotraccia, aggiunta punti luce e prese, certificazione di rispondenza e conformità normativa.",
        categoria: "Elettricità",
        icon: Zap,
        tag: "Elettricità"
    },
    {
        title: "Infissi, serramenti e zanzariere",
        desc: "Sostituzione finestre in PVC, legno o alluminio a taglio termico per miglioramento dell'isolamento acustico ed energetico, porte blindate e zanzariere su misura.",
        categoria: "Zanzariere",
        icon: DoorClosed,
        tag: "Serramenti"
    }
];

const PASSI_RICHIESTA = [
    {
        step: "01",
        title: "Scegli l'intervento e indica la zona",
        desc: "Seleziona se hai bisogno di una ristrutturazione globale o di un lavoro specifico (bagno, cucina, pavimenti, impianti) e indica il comune o la provincia in cui si trova l'immobile."
    },
    {
        step: "02",
        title: "Descrivi il lavoro in parole semplici",
        desc: "Non servono tecnicismi: spiega cosa desideri rinnovare, gli ambienti interessati, i problemi da risolvere (es. perdite, umidità) e le tue tempistiche indicative."
    },
    {
        step: "03",
        title: "La richiesta raggiunge le imprese locali",
        desc: "La tua richiesta viene notificata alle aziende e agli artigiani iscritti e verificati attivi nella tua zona per la categoria prescelta, senza costi di intermediazione per te."
    },
    {
        step: "04",
        title: "Valuta le risposte e scegli senza impegno",
        desc: "I professionisti esaminano la richiesta, possono concordare con te un eventuale sopralluogo tecnico e ti formulano un preventivo dettagliato che potrai valutare liberamente."
    }
];

const FAQ_LIST = [
    {
        q: "Come posso chiedere un preventivo per una ristrutturazione su CasaLavoroPRO?",
        a: "È sufficiente accedere alla sezione 'Nuova richiesta', selezionare la categoria del lavoro (ad esempio 'Ristrutturazione Casa', 'Edilizia' o 'Idraulica'), inserire la tua città o provincia e descrivere brevemente cosa intendi realizzare. La richiesta verrà inoltrata ai professionisti della tua zona."
    },
    {
        q: "Quali informazioni è consigliabile inserire nella richiesta?",
        a: "Per ricevere preventivi più accurati, indica quali ambienti desideri ristrutturare, la superficie indicativa (se la conosci), i lavori principali (es. rifacimento massetto, cambio sanitari, tinteggiatura), le condizioni attuali dell'immobile e il periodo ideale in cui vorresti iniziare i lavori."
    },
    {
        q: "Posso chiedere un preventivo solo per un lavoro parziale, come il bagno o la cucina?",
        a: "Certamente. Puoi richiedere preventivi per singoli interventi parziali come il rifacimento completo del bagno, la posa di nuovi pavimenti, l'adeguamento dell'impianto elettrico o la sola tinteggiatura degli interni."
    },
    {
        q: "Quanto costa ristrutturare casa e da cosa dipende il prezzo?",
        a: "Il costo effettivo dipende da numerose variabili specifiche del cantiere: superficie dell'immobile, complessità degli impianti, necessità di demolizioni e smaltimento macerie, accessibilità del piano, qualità dei materiali scelti e necessità di pratiche edilizie. Per questo è sempre opportuno richiedere una stima personalizzata dopo aver descritto le proprie esigenze."
    },
    {
        q: "Servono sempre permessi comunali per ristrutturare?",
        a: "Non per tutti i lavori. Le opere di manutenzione ordinaria (come tinteggiature, sostituzione piastrelle o sanitari senza spostare tubature principali) rientrano nell'edilizia libera. Lavori più rilevanti che modificano la disposizione interna (apertura o rimozione di tramezzi) o rinnovano gli impianti richiedono invece pratiche asseverate da un tecnico abilitato (CILA o SCIA)."
    },
    {
        q: "La richiesta tramite CasaLavoroPRO è gratuita?",
        a: "Sì. Per gli utenti privati, la registrazione al portale e l'invio delle richieste di preventivo sono completamente gratuiti e privi di vincoli contrattuali. Gli accordi economici e il contratto d'opera vengono concordati direttamente tra il committente e l'impresa selezionata."
    },
    {
        q: "Cosa succede dopo aver inviato la richiesta?",
        a: "Le imprese della tua zona abilitate per la categoria ricevono la notifica della tua richiesta. Gli artigiani interessati possono risponderti con una proposta preliminare o contattarti per concordare un sopralluogo tecnico per verificare lo stato dei luoghi prima di formulare il preventivo finale."
    }
];

export default function Ristrutturazioni() {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = RISTRUTTURAZIONI_METADATA.seoTitle;
        return () => {
            document.title = prevTitle;
        };
    }, []);

    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20" data-testid="ristrutturazioni-service-page">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200">Ristrutturazioni casa</span>
                </nav>

                {/* 1. SEZIONE INIZIALE HERO */}
                <header className="border-b border-white/10 pb-12 mb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 mb-4">
                        <Hammer className="h-3.5 w-3.5" />
                        Guida e Servizio Ristrutturazioni
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] max-w-4xl">
                        Ristrutturazioni casa: trova professionisti e chiedi un preventivo
                    </h1>

                    <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                        Devi rinnovare il bagno, rifare la cucina o pianificare la ristrutturazione completa del tuo appartamento?
                        Su CasaLavoroPRO descrivi il lavoro da fare, selezioni la tua zona e metti a confronto le proposte tecniche ed economiche di imprese e artigiani qualificati del territorio.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Button asChild className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25 px-6 py-3 text-sm">
                            <Link to="/nuova-richiesta?categoria=Ristrutturazioni">
                                Chiedi un preventivo gratuito
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl border-white/20 bg-navy-700/60 text-white hover:bg-white/10 text-sm">
                            <Link to="/aziende?categoria=Ristrutturazioni">
                                Esplora le imprese verificate
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5 text-slate-300">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Imprese controllate (P.IVA e visura)
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-brand" /> Richiesta 100% gratuita per privati
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-300">
                            <MapPin className="h-4 w-4 text-brand" /> Professionisti attivi nella tua zona
                        </span>
                    </div>
                </header>

                {/* 2. COME FUNZIONA */}
                <section className="mb-20 scroll-mt-28" id="come-funziona-richiesta">
                    <div className="max-w-2xl mb-8">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand">Procedura trasparente</span>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                            Come chiedere un preventivo per ristrutturare casa
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Quattro passaggi lineari per spiegare le tue necessità e ricevere preventivi confrontabili senza intermediari obbligatori.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {PASSI_RICHIESTA.map((p) => (
                            <div key={p.step} className="rounded-2xl border border-white/10 bg-navy-700/60 p-6 flex flex-col justify-between">
                                <div>
                                    <span className="font-mono text-2xl font-black text-brand/80 block mb-3">
                                        {p.step}
                                    </span>
                                    <h3 className="font-display font-bold text-white text-base mb-2">
                                        {p.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {p.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. TIPI DI RISTRUTTURAZIONE SUPPORTATI */}
                <section className="mb-20 scroll-mt-28" id="tipologie-lavori">
                    <div className="max-w-2xl mb-8">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand">Categorie coperte</span>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                            Principali interventi di ristrutturazione supportati
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Le lavorazioni realmente disponibili su CasaLavoroPRO per le quali puoi richiedere preventivi a ditte specializzate.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {TIPI_INTERVENTO.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <div key={item.title} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5 flex flex-col justify-between hover:border-brand/40 transition-colors">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                                                {item.tag}
                                            </span>
                                        </div>
                                        <h3 className="font-display font-bold text-white text-base mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <div className="mt-5 pt-3 border-t border-white/5">
                                        <Link
                                            to={`/nuova-richiesta?categoria=${encodeURIComponent(item.categoria)}`}
                                            className="text-xs text-brand hover:underline font-semibold inline-flex items-center gap-1"
                                        >
                                            Richiedi per questa categoria <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 4. COME PREPARARE UNA RICHIESTA UTILE */}
                <section className="mb-20 rounded-3xl border border-white/10 bg-gradient-to-br from-navy-700/80 via-navy-700/50 to-navy-700/80 p-6 sm:p-10 scroll-mt-28" id="preparare-richiesta">
                    <div className="max-w-2xl mb-8">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand">Guida per il privato</span>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                            Come preparare una descrizione utile del lavoro
                        </h2>
                        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                            Un artigiano ha bisogno di alcuni elementi chiave per comprendere la fattibilità e formulare una stima accurata. Ecco quali dettagli puoi indicare senza dover conoscere termini tecnici:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                            <strong className="text-white block text-sm font-semibold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-brand" /> Ambienti e porzione di casa
                            </strong>
                            <p className="text-slate-400">
                                Specifica quale parte dell'immobile vuoi ristrutturare: bagno principale, cucina abitabile, zona giorno, terrazzo o l'intero alloggio. Se conosci i metri quadri indicativi (anche approssimativi), indicali.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                            <strong className="text-white block text-sm font-semibold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-brand" /> Stato attuale e problemi riscontrati
                            </strong>
                            <p className="text-slate-400">
                                Racconta brevemente lo stato dei luoghi: immobile d'epoca o recente, presenza di tubature vecchie in ferro, infiltrazioni, piastrelle sollevate o umidità su alcune pareti.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                            <strong className="text-white block text-sm font-semibold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-brand" /> Opere desiderate ed eventuali forniture
                            </strong>
                            <p className="text-slate-400">
                                Chiarisci se hai già acquistato o sceglierai in autonomia sanitari, piastrelle o parquet, oppure se preferisci che la fornitura completa dei materiali sia a carico dell'impresa.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
                            <strong className="text-white block text-sm font-semibold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-brand" /> Accessibilità e tempistiche
                            </strong>
                            <p className="text-slate-400">
                                Indica il piano dell'immobile, l'eventuale presenza di ascensore (importante per il trasporto materiali) e il periodo in cui vorresti avviare i lavori (es. "entro due mesi" o "data flessibile").
                            </p>
                        </div>
                    </div>
                </section>

                {/* 5. PREZZI, PREVENTIVI E VARIABILI DI COSTO */}
                <section className="mb-20 scroll-mt-28" id="costi-e-variabili">
                    <div className="max-w-2xl mb-6">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand">Economia del cantiere</span>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                            Da cosa dipende il costo di una ristrutturazione?
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Diffida da tabelle con costi forfettari al metro quadro: ogni casa presenta caratteristiche strutturali e impiantistiche uniche.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-slate-300">
                        <p className="leading-relaxed">
                            I preventivi per lavori edili e impiantistici variano sensibilmente in base a fattori oggettivi:
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-disc list-inside text-xs text-slate-300">
                            <li><strong>Entità delle demolizioni:</strong> rimozione di tramezzi, pavimenti esistenti e relativo trasporto a discarica autorizzata.</li>
                            <li><strong>Stato degli impianti:</strong> adeguamento parziale o rifacimento completo sotto traccia con rilascio delle conformità di legge.</li>
                            <li><strong>Tipologia dei materiali:</strong> finiture standard rispetto a gres di grande formato, marmi, resine o parquet pregiati.</li>
                            <li><strong>Logistica del cantiere:</strong> facilità di carico/scarico, presenza di cortili, montacarichi o limitazioni da ZTL.</li>
                            <li><strong>Pratiche autorizzative:</strong> necessità di asseverazione tecnica da parte di un geometra o architetto (CILA/SCIA).</li>
                        </ul>
                        <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/5 text-xs text-slate-400 flex items-start gap-2.5">
                            <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                            <span>
                                <strong>La richiesta su CasaLavoroPRO è gratuita:</strong> la piattaforma non impone commissioni sui preventivi ai privati. Il prezzo finale delle opere viene concordato in modo trasparente direttamente con l'artigiano dopo l'esame puntuale dei lavori o l'eventuale sopralluogo conoscitivo.
                            </span>
                        </div>
                    </div>
                </section>

                {/* 6. PERMESSI, PRATICHE E AGEVOLAZIONI */}
                <section className="mb-20 scroll-mt-28" id="permessi-e-normative">
                    <div className="max-w-2xl mb-6">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand">Quadro normativo sintetico</span>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">
                            Permessi edilizi e detrazioni fiscali
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Informazioni essenziali verificate per orientarsi tra adempimenti comunali e opportunità di sgravio fiscale (aggiornato a novembre 2026).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                        {/* Permessi comunali */}
                        <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-6 space-y-3">
                            <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-brand" /> Permessi e Titoli Abilitativi
                            </h3>
                            <p className="leading-relaxed text-slate-400">
                                In base al D.P.R. 380/2001 (Testo Unico Edilizia) e al D.M. 2 marzo 2018 (Glossario Edilizia Libera):
                            </p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li><strong>Edilizia libera:</strong> manutenzione ordinaria (tinteggiatura, posa piastrelle, sostituzione sanitari con allacci invariati, infissi della medesima misura). Non richiede comunicazioni al Comune.</li>
                                <li><strong>CILA (Comunicazione Inizio Lavori Asseverata):</strong> necessaria per manutenzione straordinaria senza modifiche strutturali (spostamento di tramezzi interni, apertura porte su pareti non portanti, rifacimento impianti con nuove tracce). Richiede la relazione asseverata di un professionista abilitato.</li>
                                <li><strong>SCIA:</strong> necessaria per interventi che toccano elementi portanti o modificano la sagoma dell'edificio.</li>
                            </ul>
                        </div>

                        {/* Detrazioni fiscali */}
                        <div className="rounded-2xl border border-white/10 bg-navy-700/60 p-6 space-y-3">
                            <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-emerald-400" /> Detrazioni per Ristrutturazioni
                            </h3>
                            <p className="leading-relaxed text-slate-400">
                                Il Bonus Casa (art. 16-bis D.P.R. 917/1986) e la normativa sulle detrazioni fiscali consentono di recuperare in dichiarazione dei redditi una percentuale delle spese sostenute per interventi di manutenzione straordinaria e riqualificazione.
                            </p>
                            <ul className="space-y-1.5 list-disc list-inside">
                                <li>Obbligo di pagamento con bonifico bancario/postale parlante dedicato.</li>
                                <li>Comunicazione telematica all'ENEA entro 90 giorni dal collaudo per tutti i lavori che determinano risparmio energetico.</li>
                                <li>Differenziazione tra abitazione principale e altri immobili.</li>
                            </ul>
                            <div className="pt-2">
                                <Link
                                    to="/blog/bonus-edilizi-2027"
                                    className="text-brand hover:underline font-semibold inline-flex items-center gap-1"
                                >
                                    Leggi la nostra guida completa: Bonus edilizi 2027 <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-[11px] text-slate-500 italic">
                        Nota: le prescrizioni edilizie possono variare a seconda dei regolamenti edilizi locali adottati dal singolo Comune. Questa sezione ha scopo puramente informativo e non sostituisce il parere di un tecnico abilitato.
                    </p>
                </section>

                {/* 7. DOMANDE FREQUENTI (FAQ) */}
                <section className="mb-20 scroll-mt-28" id="faq-ristrutturazioni">
                    <div className="max-w-2xl mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 mb-2">
                            <HelpCircle className="h-3.5 w-3.5 text-brand" />
                            Risposte rapide
                        </div>
                        <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
                            Domande Frequenti sulle Ristrutturazioni Casa
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {FAQ_LIST.map((item, idx) => (
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

                {/* 8. CALL TO ACTION FINALE */}
                <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-brand/20 via-navy-700/80 to-navy-700/80 p-8 sm:p-12 text-center max-w-4xl mx-auto">
                    <span className="text-xs uppercase tracking-wider font-semibold text-brand">Pronto a iniziare?</span>
                    <h2 className="font-display font-black text-2xl sm:text-4xl text-white mt-2 mb-3">
                        Descrivi il tuo progetto e ricevi preventivi
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed mb-8">
                        Bastano due minuti per inserire i dettagli del lavoro. Le aziende verificate della tua provincia riceveranno la richiesta e formuleranno la loro proposta senza alcun impegno da parte tua.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button asChild className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25 px-6 py-3 text-sm">
                            <Link to="/nuova-richiesta?categoria=Ristrutturazioni">
                                Invia richiesta di preventivo
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl border-white/20 bg-navy-700/60 text-white hover:bg-white/10 text-sm">
                            <Link to="/aziende?categoria=Ristrutturazioni">
                                Guarda le imprese nella directory
                            </Link>
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
