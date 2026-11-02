import { useState } from "react";
import { Link } from "react-router-dom";
import { UserCheck, ChevronRight, Mail, AlertTriangle, ArrowLeft, Copy, Check, ShieldAlert, FileText, Info } from "lucide-react";
import { toast } from "sonner";

function LegalNotice({ type = "DA COMPLETARE", children }) {
    const colorClasses =
        type === "DA CONFERMARE"
            ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
            : type === "DA VERIFICARE"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
            : "border-rose-500/30 bg-rose-500/10 text-rose-200";

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${colorClasses} my-1`}>
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>[{type}: {children}]</span>
        </span>
    );
}

const RIGHTS = [
    {
        id: "accesso",
        article: "Art. 15 GDPR",
        title: "Diritto di Accesso",
        summary: "Sapere se CasaLavoroPRO tratta i tuoi dati e ottenerne una copia.",
        desc: "Hai il diritto di ottenere la conferma che sia o meno in corso un trattamento di dati personali che ti riguardano e, in tal caso, di ottenere l'accesso ai dati personali, alle finalità del trattamento, alle categorie di dati trattati, ai destinatari o categorie di destinatari a cui i dati sono stati o saranno comunicati e al periodo di conservazione previsto.",
        practical: "Puoi richiedere l'elenco completo dei dati associati al tuo account (anagrafica, richieste preventivo, messaggi, annunci pubblicati, bollette caricate)."
    },
    {
        id: "rettifica",
        article: "Art. 16 GDPR",
        title: "Diritto di Rettifica e Aggiornamento",
        summary: "Correggere dati inesatti o integrare dati incompleti.",
        desc: "Hai il diritto di ottenere senza ingiustificato ritardo la rettifica dei dati personali inesatti che ti riguardano o l'integrazione dei dati incompleti, anche fornendo una dichiarazione integrativa.",
        practical: "Molti dati del tuo profilo (recapiti telefonici, zone coperte, categorie, listini noleggio) possono essere modificati in autonomia direttamente dalla tua Dashboard (Area Privato o Dashboard Azienda). Per variazioni non modificabili autonomamente, puoi scriverci."
    },
    {
        id: "cancellazione",
        article: "Art. 17 GDPR",
        title: "Diritto alla Cancellazione ('Diritto all'Oblio')",
        summary: "Chiedere la cancellazione definitiva del tuo account e dei tuoi dati personali.",
        desc: "Puoi chiedere la cancellazione dei dati quando non sono più necessari rispetto alle finalità per cui sono stati raccolti, in caso di revoca del consenso, se ti opponi al trattamento o se i dati sono stati trattati illecitamente. Sono fatti salvi gli obblighi di legge (es. fatture o documenti fiscali che devono essere conservati per 10 anni per obbligo di legge ex art. 2220 c.c.).",
        practical: "La cancellazione dell'account comporta l'anonimizzazione o la rimozione dei tuoi annunci e del tuo profilo pubblico dal marketplace."
    },
    {
        id: "limitazione",
        article: "Art. 18 GDPR",
        title: "Diritto di Limitazione del Trattamento",
        summary: "Congelare temporaneamente l'uso dei tuoi dati.",
        desc: "Puoi richiedere la limitazione del trattamento quando contesti l'esattezza dei dati (per il periodo necessario alla verifica), se il trattamento è illecito ma ti opponi alla cancellazione, o quando i dati ti servono per l'accertamento, l'esercizio o la difesa di un diritto in sede giudiziaria.",
        practical: "In caso di limitazione, i tuoi dati rimangono memorizzati sui server protetti ma non possono essere elaborati né visualizzati da altri utenti o imprese."
    },
    {
        id: "portabilita",
        article: "Art. 20 GDPR",
        title: "Diritto alla Portabilità dei Dati",
        summary: "Ricevere i tuoi dati in un formato strutturato e leggibile da dispositivo automatico.",
        desc: "Hai il diritto di ricevere in un formato strutturato, di uso comune e leggibile da dispositivo automatico (es. JSON o CSV) i dati personali che hai fornito a CasaLavoroPRO e hai il diritto di trasmettere tali dati a un altro titolare del trattamento senza impedimenti, qualora il trattamento si basi sul consenso o sul contratto e sia effettuato con mezzi automatizzati.",
        practical: "Puoi richiedere l'esportazione del tuo archivio cantieri, storico richieste o catalogo annunci."
    },
    {
        id: "opposizione",
        article: "Art. 21 GDPR",
        title: "Diritto di Opposizione",
        summary: "Opporti in qualsiasi momento al trattamento per motivi legittimi.",
        desc: "Hai il diritto di opporti in qualsiasi momento, per motivi connessi alla tua situazione particolare, al trattamento dei dati personali che ti riguardano basato sul legittimo interesse del Titolare. Nel caso di comunicazioni promozionali o newsletter, hai il diritto di opporti in qualsiasi momento senza dover fornire alcuna motivazione.",
        practical: "Se non desideri più ricevere notifiche informative non essenziali, puoi opporti in ogni momento con efficacia immediata."
    },
    {
        id: "revoca",
        article: "Art. 7(3) GDPR",
        title: "Revoca del Consenso",
        summary: "Ritirare in qualsiasi momento un consenso precedentemente concesso.",
        desc: "Qualora il trattamento sia basato sul tuo consenso (es. per iniziative promozionali facoltative o analisi opzionali), hai il diritto di revocarlo in qualsiasi momento. La revoca del consenso non pregiudica la liceità del trattamento basata sul consenso prestato prima della revoca.",
        practical: "La revoca ha effetto per il futuro a partire dalla ricezione della comunicazione."
    }
];

const EMAIL_TEMPLATE = `A: info@casalavoropro.com
Oggetto: Esercizio diritti GDPR - [Nome e Cognome / Ragione Sociale]

Gentile Titolare del Trattamento CasaLavoroPRO,
in qualità di interessato, con la presente richiedo l'esercizio del seguente diritto previsto dal Regolamento UE 2016/679 (GDPR):

[ ] Accesso ai dati personali (Art. 15)
[ ] Rettifica o aggiornamento dati (Art. 16)
[ ] Cancellazione dei dati / chiusura account (Art. 17)
[ ] Limitazione del trattamento (Art. 18)
[ ] Portabilità dei dati (Art. 20)
[ ] Opposizione al trattamento (Art. 21)
[ ] Revoca del consenso precedentemente espresso (Art. 7)

Dati identificativi associati all'account:
- Nome e Cognome / Ragione Sociale: [Inserisci qui]
- Email di registrazione al portale: [Inserisci qui]
- Ruolo sulla piattaforma: [Privato / Azienda o Professionista]
- Descrizione specifica della richiesta o delle modifiche desiderate: [Inserisci dettagli]

Resto in attesa di un vostro riscontro entro i termini di legge (30 giorni).
Cordiali saluti,
[Firma / Nome e Cognome]`;

export default function DirittiGdpr() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(EMAIL_TEMPLATE).then(() => {
            setCopied(true);
            toast.success("Modello email copiato negli appunti!");
            setTimeout(() => setCopied(false), 2500);
        }).catch(() => {
            toast.error("Impossibile copiare automaticamente. Seleziona e copia il testo.");
        });
    };

    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200">Diritti GDPR</span>
                </nav>

                {/* Header */}
                <div className="border-b border-white/10 pb-8 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                        <UserCheck className="h-3.5 w-3.5" />
                        Guida pratica per gli utenti
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                        I Tuoi Diritti sulla Privacy (GDPR)
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-2xl">
                        Il Regolamento Generale sulla Protezione dei Dati (Regolamento UE 2016/679) ti attribuisce il pieno controllo
                        sui dati personali che condividi su CasaLavoroPRO. In questa pagina trovi una spiegazione chiara di ciascun
                        diritto e le istruzioni pratiche su come esercitarlo senza intermediari e a costo zero.
                    </p>
                </div>

                {/* Box Come Esercitare i Diritti */}
                <div className="mb-12 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 to-navy-700/60 p-6 sm:p-7">
                    <h2 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-brand" />
                        Come esercitare i tuoi diritti su CasaLavoroPRO
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                        Per esercitare uno o più diritti garantiti dal GDPR, non occorrono formalità complesse. È sufficiente inviare
                        una comunicazione scritta ai recapiti ufficiali del Titolare indicando l'indirizzo email con cui ti sei registrato
                        alla piattaforma e l'oggetto della richiesta:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                            <p className="text-slate-400">Email ordinaria:</p>
                            <p className="font-semibold text-white">
                                <a href="mailto:info@casalavoropro.com?subject=Esercizio%20Diritti%20GDPR" className="text-brand hover:underline">
                                    info@casalavoropro.com
                                </a>
                            </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                            <p className="text-slate-400">Posta Elettronica Certificata (PEC):</p>
                            <p className="font-mono text-xs">
                                <LegalNotice type="DA COMPLETARE">indirizzo PEC del Titolare</LegalNotice>
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-start gap-2 text-xs text-slate-300">
                        <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                        <span>
                            <strong>Tempi di risposta:</strong> CasaLavoroPRO risponderà alla tua richiesta entro <strong>30 giorni</strong> dal
                            ricevimento della stessa. Tale termine può essere prorogato di ulteriori 60 giorni in caso di particolare complessità
                            o elevato numero di richieste, dandone tempestiva comunicazione motivata (art. 12, par. 3 GDPR).
                        </span>
                    </div>
                </div>

                {/* Elenco Diritti */}
                <div className="mb-14">
                    <h2 className="font-display font-bold text-2xl text-white mb-6">
                        I tuoi diritti in dettaglio (Artt. 15–22 GDPR)
                    </h2>
                    <div className="space-y-5">
                        {RIGHTS.map((r, i) => (
                            <div key={r.id} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6 transition-colors hover:border-white/20">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <span className="font-mono text-xs font-semibold text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
                                        {r.article}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">#{i + 1}</span>
                                </div>
                                <h3 className="font-display font-bold text-lg text-white mb-2">
                                    {r.title}
                                </h3>
                                <p className="text-xs font-medium text-slate-300 mb-2">
                                    {r.summary}
                                </p>
                                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                    {r.desc}
                                </p>
                                <div className="p-3 rounded-xl border border-white/5 bg-white/5 text-xs text-slate-300 flex items-start gap-2">
                                    <span className="font-semibold text-brand shrink-0">In pratica:</span>
                                    <span>{r.practical}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modello Email da Copiare */}
                <div className="mb-14 rounded-2xl border border-white/10 bg-navy-700/60 p-6 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-brand" />
                                Modello pronto all'uso per inviare la tua richiesta
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Copia il testo sottostante, personalizzalo con i tuoi dati e invialo a <strong className="text-white">info@casalavoropro.com</strong>.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    Copiato!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    Copia testo
                                </>
                            )}
                        </button>
                    </div>

                    <pre className="p-4 rounded-xl border border-white/10 bg-black/40 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {EMAIL_TEMPLATE}
                    </pre>
                </div>

                {/* Box Reclamo al Garante */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-7">
                    <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-400" />
                        Reclamo all'Autorità Garante per la Privacy
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        Se ritieni che una tua richiesta non sia stata evasa correttamente o che il trattamento dei tuoi dati
                        personali violi le disposizioni del Regolamento UE 2016/679, hai sempre il diritto di proporre reclamo formale
                        all'Autorità Garante per la Protezione dei Dati Personali o di adire le opportune sedi giudiziarie (art. 77 e 79 GDPR).
                    </p>
                    <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-xs text-slate-300 space-y-1.5">
                        <p><strong className="text-white">Garante per la Protezione dei Dati Personali</strong></p>
                        <p>Piazza Venezia n. 11 — 00187 Roma (RM)</p>
                        <p>Centralino telefonico: (+39) 06.696771</p>
                        <p>Email: <a href="mailto:garante@gpdp.it" className="text-brand hover:underline">garante@gpdp.it</a></p>
                        <p>PEC: <a href="mailto:protocollo@pec.gpdp.it" className="text-brand hover:underline">protocollo@pec.gpdp.it</a></p>
                        <p>Sito ufficiale per invio reclami online: <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">www.garanteprivacy.it</a></p>
                    </div>
                </div>

                {/* Footer link indietro */}
                <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                    <Link to="/privacy-policy" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Torna all'Informativa Privacy
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to="/termini" className="hover:text-white transition-colors">Termini di Servizio</Link>
                        <span>·</span>
                        <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
