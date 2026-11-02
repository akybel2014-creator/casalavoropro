import { Link } from "react-router-dom";
import { Shield, ChevronRight, FileText, AlertTriangle, ArrowLeft } from "lucide-react";

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

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200">Privacy Policy</span>
                </nav>

                {/* Header */}
                <div className="border-b border-white/10 pb-8 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 mb-4">
                        <Shield className="h-3.5 w-3.5" />
                        Informativa sulla Privacy (Regolamento UE 2016/679 - GDPR)
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                        Informativa sul Trattamento dei Dati Personali
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                        Ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 ("General Data Protection Regulation" o "GDPR"),
                        la presente informativa illustra in modo chiaro, trasparente e dettagliato le modalità, le finalità, le basi giuridiche
                        e i tempi di conservazione dei dati personali raccolti e trattati tramite la piattaforma web CasaLavoroPRO.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Stato del documento: <LegalNotice type="DA COMPLETARE">Bozza tecnica da completare prima della pubblicazione</LegalNotice></span>
                        <span>·</span>
                        <span>Data di pubblicazione: <LegalNotice type="DA COMPLETARE">DATA DI PUBBLICAZIONE DA INSERIRE</LegalNotice></span>
                        <span>·</span>
                        <span>Versione: 1.0 (Revisione tecnica)</span>
                    </div>
                </div>

                {/* Box Avviso di Trasparenza e Stato di Bozza */}
                <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-xs text-amber-200/90 leading-relaxed space-y-2">
                    <p className="font-semibold text-white flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        Attenzione: informativa in bozza con segnaposto da completare
                    </p>
                    <p>
                        Il presente testo è stato predisposto sulla base dell'analisi tecnica delle funzionalità e dei flussi di dati
                        effettivamente implementati nel codice sorgente dell'applicazione. Prima della messa in produzione o pubblicazione legale,
                        il Titolare del trattamento deve provvedere alla compilazione di tutti i campi contrassegnati con appositi segnaposto
                        visibili (<code className="font-mono text-white">[DA COMPLETARE]</code>, <code className="font-mono text-white">[DA CONFERMARE]</code>, <code className="font-mono text-white">[DA VERIFICARE]</code>),
                        sottoponendo il documento a convalida da parte del proprio consulente legale o responsabile della conformità privacy.
                    </p>
                </div>

                {/* Sezioni informative */}
                <div className="space-y-10 text-sm leading-relaxed text-slate-300">
                    {/* 01. Titolare del Trattamento */}
                    <section className="scroll-mt-28" id="titolare">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">01.</span>
                            Titolare del Trattamento e Dati di Contatto
                        </h2>
                        <p>
                            Il Titolare del trattamento dei dati personali raccolti per il funzionamento della piattaforma CasaLavoroPRO è:
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-xs text-slate-300">
                            <p>
                                <strong className="text-white">Denominazione / Ragione Sociale:</strong>{" "}
                                <LegalNotice type="DA COMPLETARE">Denominazione e forma giuridica della società o ditta titolare, es. CasaLavoroPRO S.r.l.</LegalNotice>
                            </p>
                            <p>
                                <strong className="text-white">Sede Legale:</strong>{" "}
                                <LegalNotice type="DA COMPLETARE">Indirizzo completo (Via/Piazza, civico, CAP, Comune, Provincia, Nazione)</LegalNotice>
                            </p>
                            <p>
                                <strong className="text-white">Codice Fiscale e Partita IVA:</strong>{" "}
                                <LegalNotice type="DA COMPLETARE">Numero di Codice Fiscale e Partita IVA del Titolare</LegalNotice>
                            </p>
                            <p>
                                <strong className="text-white">Posta Elettronica Certificata (PEC):</strong>{" "}
                                <LegalNotice type="DA COMPLETARE">Indirizzo PEC ufficiale del Titolare</LegalNotice>
                            </p>
                            <p>
                                <strong className="text-white">Email di contatto per la privacy:</strong>{" "}
                                <LegalNotice type="DA COMPLETARE">Indirizzo email dedicato alla privacy o contatto generale, es. privacy@casalavoropro.com</LegalNotice>
                            </p>
                            <p>
                                <strong className="text-white">Responsabile della Protezione dei Dati (DPO / RPD):</strong>{" "}
                                <LegalNotice type="DA CONFERMARE">DA CONFERMARE SE NOMINATO: inserire nominativo e contatto del DPO qualora designato ai sensi dell'art. 37 GDPR, oppure specificare espressamente la non sussistenza dell'obbligo di nomina</LegalNotice>
                            </p>
                        </div>
                    </section>

                    {/* 02. Ruoli nel Trattamento */}
                    <section className="scroll-mt-28" id="ruolo">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">02.</span>
                            Ruolo di CasaLavoroPRO nei singoli servizi
                        </h2>
                        <p>
                            CasaLavoroPRO opera come piattaforma tecnologica e marketplace digitale finalizzato a favorire l'incontro
                            tra soggetti privati (committenti) e operatori economici (artigiani, professionisti e imprese edili o di impiantistica).
                            I ruoli privacy si articolano come segue:
                        </p>
                        <ul className="mt-3 space-y-2.5 list-disc list-inside text-xs sm:text-sm text-slate-300">
                            <li>
                                <strong>Gestione della piattaforma e degli account:</strong> CasaLavoroPRO tratta i dati degli iscritti
                                (privati e aziende) in qualità di <em>Titolare autonomo del trattamento</em> per quanto concerne la registrazione,
                                l'accesso autenticato, la directory aziendale, il rilascio dei badge di verifica, la fatturazione degli abbonamenti
                                e la sicurezza informatica del sistema.
                            </li>
                            <li>
                                <strong>Richieste di preventivo e relazioni bilaterali:</strong> Quando un privato compila e trasmette
                                una richiesta di preventivo, CasaLavoroPRO funge da intermediario tecnico rendendo disponibili la descrizione
                                e le fotografie del lavoro alle sole aziende iscritte e attive per la categoria e la zona indicate. Una volta
                                ricevuti i dati per la formulazione del preventivo o concordato l'intervento,{" "}
                                <em>l'impresa destinataria tratta i dati dell'utente privato in qualità di autonomo Titolare del trattamento</em>{" "}
                                per l'esecuzione dei propri preventivi, sopralluoghi o contratti d'opera.
                            </li>
                            <li>
                                <strong>Mercatino usato e noleggio attrezzature:</strong> I contratti di locazione operativa o di compravendita
                                di macchinari si concludono direttamente tra gli utenti inserzionisti e i richiedenti; ciascuna parte tratta i recapiti
                                dell'altra quale autonomo titolare del rapporto commerciale.
                            </li>
                        </ul>
                    </section>

                    {/* 03. Tipologie di Dati Trattati */}
                    <section className="scroll-mt-28" id="dati-raccolti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">03.</span>
                            Tipologie di Dati Personali Trattati
                        </h2>
                        <p>
                            In relazione ai servizi e alle funzionalità effettivamente operativi nella piattaforma, CasaLavoroPRO tratta
                            esclusivamente le seguenti categorie di dati:
                        </p>

                        <div className="mt-4 space-y-4">
                            {/* A. Privati */}
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-brand" />
                                    A. Account Utenti Privati
                                </h3>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                    <li><strong>Dati di registrazione e profilo:</strong> nome e cognome, indirizzo email, eventuale recapito telefonico.</li>
                                    <li><strong>Credenziali di accesso:</strong> password memorizzata nel database unicamente sotto forma di stringa crittografata (hash unidirezionale bcrypt con cost factor pari a 10), mai in chiaro.</li>
                                </ul>
                            </div>

                            {/* B. Richieste e foto */}
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-brand" />
                                    B. Richieste di Preventivo, Descrizioni e Fotografie dei Lavori
                                </h3>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                    <li><strong>Dati della richiesta:</strong> categoria dell'intervento (ristrutturazioni, idraulica, elettricità, muratura, infissi, ecc.), comune o zona geografica dell'immobile, titolo dell'esigenza, budget indicativo, tempistiche e indicazione di urgenza.</li>
                                    <li><strong>Descrizione del lavoro:</strong> testo facoltativo inserito dall'utente per spiegare le opere o le riparazioni da realizzare.</li>
                                    <li><strong>Fotografie allegate:</strong> immagini caricate dal committente (fino a 4 fotografie) ritraenti lo stato dei luoghi o gli elementi da riparare.</li>
                                    <li><strong>Regime di riservatezza e controllo degli accessi:</strong> a differenza delle immagini pubbliche di portfolio aziendale, le fotografie caricate a corredo di una richiesta di preventivo sono contrassegnate come non pubbliche e custodite con accesso protetto. Esse sono visionabili e scaricabili esclusivamente dall'utente privato che le ha caricate e dalle imprese registrate che ricevono la specifica richiesta nella propria area riservata.</li>
                                    <li><strong>Messaggistica interna:</strong> comunicazioni scambiate tra utente e azienda a seguito della risposta al preventivo.</li>
                                    <li><strong>Recensioni e valutazioni:</strong> giudizi numerici (da 1 a 5 stelle) e commenti testuali rilasciati sulle prestazioni delle imprese.</li>
                                </ul>
                            </div>

                            {/* C. Aziende */}
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-brand" />
                                    C. Imprese, Artigiani e Professionisti
                                </h3>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                    <li><strong>Dati anagrafici e societari:</strong> denominazione o ragione sociale, nome del titolare/referente, Partita IVA, numero di telefono aziendale, indirizzo internet del sito web, descrizione dei servizi e categorie d'opera presidiate.</li>
                                    <li><strong>Zone di operatività e geolocalizzazione:</strong> comuni o province di competenza, raggio chilometrico di intervento e coordinate geografiche per la visualizzazione sulla mappa della directory.</li>
                                    <li><strong>Dati di reperibilità ed emergenza:</strong> eventuale disponibilità dichiarata per pronto intervento (emergenze 24/7, reperibilità notturna, fine settimana) e relativo recapito telefonico dedicato.</li>
                                    <li><strong>Documenti di verifica professionale:</strong> numero e copia informatica del DURC (Documento Unico di Regolarità Contributiva), visura camerale o certificazioni professionali caricati per l'ottenimento del badge "Azienda Verificata". Tali documenti sono accessibili esclusivamente ai controllori amministrativi del portale.</li>
                                    <li><strong>Immagini di portfolio:</strong> fotografie dei lavori eseguiti e logo aziendale destinati alla consultazione pubblica nella scheda directory.</li>
                                    <li><strong>Annunci di lavoro e ricerca personale:</strong> offerte pubblicate dalle imprese contenenti mansione, tipologia di contratto (es. full-time, tirocinio, stagionale), retribuzione indicativa e recapiti per le candidature.</li>
                                    <li><strong>Registro cantieri e interventi:</strong> agenda gestionale interna all'area riservata aziendale, contenente nominativi dei clienti, recapiti, indirizzi di cantiere, date e note operative inseriti autonomamente dal professionista.</li>
                                </ul>
                            </div>

                            {/* D. Noleggio e Usato */}
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-brand" />
                                    D. Mercatino Noleggio Attrezzature e Usato Edile
                                </h3>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                    <li><strong>Dati degli annunci:</strong> fotografie dei macchinari o utensili, marca, modello, stato di conservazione (Nuovo, Ottimo, Buono, Revisionato, Da sistemare), tariffe di locazione o prezzo di cessione, cauzione richiesta.</li>
                                    <li><strong>Dati delle prenotazioni:</strong> date di inizio e fine noleggio, dati di recapito dei contraenti, note operative e valutazioni reciproche sul mezzo e sul servizio.</li>
                                </ul>
                            </div>

                            {/* E. Analisi Bolletta AI */}
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-brand" />
                                    E. Servizio di Analisi Energetica Bollette (Strumento AI)
                                </h3>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                    <li><strong>File caricati dall'utente:</strong> bollette di energia elettrica o gas in formato PDF o immagini (JPG, PNG, WEBP) trasmesse volontariamente dall'interessato.</li>
                                    <li><strong>Trattamento in memoria volatile:</strong> i file caricati sono conservati unicamente nella memoria temporanea (RAM) del server per il tempo strettamente necessario a eseguire la chiamata verso il servizio di intelligenza artificiale. I file originali (PDF/immagini) non vengono archiviati permanentemente nello storage dei file della piattaforma.</li>
                                    <li><strong>Dati tecnici estratti:</strong> l'elaborazione estrae esclusivamente parametri tecnici di consumo e fatturazione: fornitore, tipologia di fornitura, consumi annui (kWh o Smc), costo materia prima, spesa annua stimata, codici identificativi tecnici di fornitura (POD per energia elettrica, PDR per gas) e note tecniche di risparmio. Tali parametri sintetici vengono salvati nella scheda lead dell'utente.</li>
                                </ul>
                            </div>

                            {/* F. Dati tecnici */}
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-brand" />
                                    F. Dati Tecnici di Navigazione, Log e Sessione
                                </h3>
                                <p className="text-xs text-slate-300">
                                    Durante l'uso della piattaforma, i sistemi acquisiscono dati tecnici strettamente necessari al funzionamento
                                    delle comunicazioni web: indirizzo IP di connessione, User-Agent del browser, identificativi di sessione (token JWT
                                    crittografati con validità limitata trasmessi tramite cookie tecnici SameSite=Lax o header HTTP Authorization),
                                    timestamp delle richieste e preferenze di interfaccia. Non sono presenti cookie di profilazione pubblicitaria
                                    di terze parti. Per il dettaglio sui cookie tecnici si rimanda alla{" "}
                                    <Link to="/cookie-policy" className="text-brand hover:underline font-medium">Cookie Policy</Link>.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 04. Finalità e Basi Giuridiche */}
                    <section className="scroll-mt-28" id="finalita">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">04.</span>
                            Finalità del Trattamento, Basi Giuridiche e Natura del Conferimento
                        </h2>
                        <p className="mb-4">
                            I dati personali sono trattati in conformità all'art. 6 del GDPR sulla base delle seguenti condizioni di liceità.
                            Ove i dati siano raccolti direttamente presso l'interessato si applica l'art. 13 GDPR; qualora talune informazioni
                            vengano verificate o acquisite tramite fonti accessibili al pubblico (ad esempio verifica di visure camerali o casellari
                            della Camera di Commercio per il rilascio del badge "Azienda Verificata") trova applicazione l'art. 14 GDPR.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-white/20 text-white font-semibold">
                                        <th className="py-2.5 pr-4">Finalità del Trattamento</th>
                                        <th className="py-2.5 pr-4">Base Giuridica (GDPR)</th>
                                        <th className="py-2.5">Natura del Conferimento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 text-slate-300">
                                    <tr>
                                        <td className="py-2.5 pr-4">Creazione account, autenticazione sicura e gestione profilo (privato o azienda)</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione del contratto o di misure precontrattuali richieste dall'interessato</td>
                                        <td className="py-2.5">Obbligatorio per fruire dei servizi autenticati</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Pubblicazione e inoltro richieste di preventivo, inclusa descrizione e foto dei lavori, alle imprese della zona/categoria</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione della specifica richiesta inviata dall'utente</td>
                                        <td className="py-2.5">Obbligatorio per ricevere preventivi mirati; descrizione e foto sono facoltative</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Verifica dei requisiti professionali (DURC, dati societari) e rilascio del badge "Azienda Verificata"</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione condizioni di adesione e Art. 6(1)(f) — Legittimo interesse a garantire l'affidabilità e la sicurezza della piattaforma</td>
                                        <td className="py-2.5">Facoltativo; necessario per ottenere il badge di verifica</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Pubblicazione e gestione annunci di noleggio, mercatino dell'usato ed esecuzione prenotazioni</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione del servizio contrattuale di intermediazione vetrina</td>
                                        <td className="py-2.5">Obbligatorio per inserzionisti e conduttori</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Pubblicazione annunci di ricerca personale e ricezione candidature</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione di misure precontrattuali e contrattuali</td>
                                        <td className="py-2.5">Facoltativo per le imprese</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Analisi tecnica delle bollette energetiche tramite intelligenza artificiale e calcolo stime di consumo</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione del servizio di scansione e stima richiesto volontariamente dall'interessato</td>
                                        <td className="py-2.5">Facoltativo</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Gestione abbonamenti a pagamento per imprese (es. piano PRO), fatturazione e transazioni</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) Contratto e Art. 6(1)(c) — Adempimento di obblighi fiscali, tributari e civilistici</td>
                                        <td className="py-2.5">Obbligatorio per la sottoscrizione di piani a pagamento</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Sicurezza informatica, prevenzione frodi, rilevamento spam o tentativi di intrusione</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(f) — Legittimo interesse del Titolare alla salvaguardia dell'integrità dei sistemi e dei dati</td>
                                        <td className="py-2.5">Inerente all'uso delle reti di comunicazione elettronica</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Eventuale ricontatto commerciale da parte di partner o broker energetici convenzionati (ove attivato)</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(a) — Consenso espresso, libero e revocabile in qualsiasi momento</td>
                                        <td className="py-2.5">Facoltativo. L'eventuale revoca non pregiudica la liceità del trattamento anteriore</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 05. Trattamento AI */}
                    <section className="scroll-mt-28" id="ai-scan">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">05.</span>
                            Trattamento dei Documenti tramite Intelligenza Artificiale (Google Gemini)
                        </h2>
                        <p>
                            Nella sezione dedicata all'efficienza energetica e nel modulo di stima dei macchinari, la piattaforma integra
                            chiamate API protette verso il modello di intelligenza artificiale fornito da Google (<code className="text-brand font-mono">gemini-3.8-flash</code>).
                            In relazione a tale funzionalità si forniscono le seguenti garanzie:
                        </p>

                        <div className="mt-3 space-y-3">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <p className="font-semibold text-white mb-1">Assenza di decisioni automatizzate (Art. 22 GDPR)</p>
                                <p>
                                    L'elaborazione algoritmica effettua esclusivamente l'estrazione ottica del testo e l'organizzazione strutturata
                                    dei valori numerici presenti nel documento (consumi in kWh, consumi gas in Smc, spesa materia energia).
                                    Il sistema <strong>non adotta alcun processo decisionale automatizzato né produce effetti giuridici</strong> o
                                    misure vincolanti a carico dell'utente. I valori di risparmio energetico e le stime sui mercati PUN/PSV costituiscono
                                    simulazioni meramente orientative e non vincolanti.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <p className="font-semibold text-white mb-1">Volatilità dei file bolletta e localizzazione del servizio</p>
                                <p>
                                    I file originali (PDF o immagini fotografiche della bolletta) non vengono memorizzati in modo permanente
                                    nell'archivio documentale del sito: essi vengono analizzati dal server in memoria volatile (RAM) e successivamente eliminati,
                                    conservando unicamente i valori numerici e testuali sintetici del report nella scheda lead.
                                </p>
                                <div className="mt-2.5 space-y-2">
                                    <div>
                                        <LegalNotice type="DA VERIFICARE">Regione server e data residency per le API Google Gemini (indicare se data center UE o extra-UE)</LegalNotice>
                                    </div>
                                    <div>
                                        <LegalNotice type="DA CONFERMARE">Termini contrattuali del fornitore Google Cloud / Google AI Enterprise in merito all'assenza di riutilizzo dei documenti caricati per l'addestramento dei modelli fondazionali</LegalNotice>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 06. Comunicazione e Destinatari */}
                    <section className="scroll-mt-28" id="destinatari">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">06.</span>
                            Destinatari e Comunicazione dei Dati
                        </h2>
                        <p>I dati personali trattati non saranno diffusi al pubblico in modo indiscriminato, ma potranno essere comunicati a:</p>
                        <ul className="mt-2.5 space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li>
                                <strong>Imprese e artigiani registrati su CasaLavoroPRO:</strong> esclusivamente in relazione alle richieste
                                di preventivo inviate dal committente per le lavorazioni della relativa categoria e zona geografica (inclusi descrizione,
                                recapiti e fotografie allegate). Ciascuna azienda tratterà i dati per formulare il preventivo in qualità di autonomo Titolare.
                            </li>
                            <li>
                                <strong>Fornitori di servizi tecnici e infrastrutturali:</strong> società terze fornitrici di servizi di hosting,
                                connettività, archiviazione cloud, erogazione API di intelligenza artificiale (Google LLC) e gestione delle transazioni
                                elettroniche di pagamento, designate quali Responsabili del Trattamento ai sensi dell'art. 28 GDPR ove prescritto.
                            </li>
                            <li>
                                <strong>Consulenti legali, fiscali e amministrativi:</strong> per l'adempimento di obblighi di legge, tenuta contabile
                                o difesa dei diritti in giudizio.
                            </li>
                            <li>
                                <strong>Autorità pubbliche e forze dell'ordine:</strong> nei soli casi in cui la comunicazione sia imposta da norme
                                di legge, regolamenti o provvedimenti vincolanti dell'Autorità Giudiziaria.
                            </li>
                        </ul>
                    </section>

                    {/* 07. Trasferimenti Extra-SEE */}
                    <section className="scroll-mt-28" id="trasferimenti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">07.</span>
                            Trasferimento dei Dati verso Paesi Terzi (Extra-SEE)
                        </h2>
                        <p>
                            I dati trattati dalla piattaforma sono archiviati primariamente all'interno dello Spazio Economico Europeo (SEE).
                            Qualora singoli fornitori di servizi tecnologici o API (es. servizi cloud o fornitori di intelligenza artificiale)
                            elaborino dati al di fuori del territorio dello SEE, tale trasferimento avviene nel rispetto delle condizioni previste
                            dal Capo V del Regolamento (UE) 2016/679.
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                            <p className="mb-2">
                                In particolare, i trasferimenti sono subordinati all'esistenza di una Decisione di Adeguatezza della Commissione Europea
                                (quale l'EU-U.S. Data Privacy Framework per gli operatori statunitensi certificati) o, in alternativa, alla sottoscrizione
                                di Clausole Contrattuali Standard (Standard Contractual Clauses - SCC) con misure di sicurezza supplementari tecniche e organizzative.
                            </p>
                            <LegalNotice type="DA CONFERMARE">Elenco formale dei singoli fornitori tecnici extra-SEE e delle relative basi contrattuali/clausole SCC vigenti</LegalNotice>
                        </div>
                    </section>

                    {/* 08. Tempi di Conservazione */}
                    <section className="scroll-mt-28" id="conservazione">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">08.</span>
                            Tempi e Criteri di Conservazione dei Dati (Data Retention)
                        </h2>
                        <p>
                            I dati personali sono conservati per il tempo strettamente necessario al raggiungimento delle finalità per cui sono stati
                            raccolti, secondo i seguenti criteri temporali:
                        </p>
                        <ul className="mt-2.5 space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li>
                                <strong>Dati dell'account (privato o azienda):</strong> conservati per tutta la durata del rapporto di iscrizione
                                e cancellati tempestivamente in caso di chiusura dell'account, fatto salvo l'obbligo di conservazione dei dati contabili
                                o di sicurezza.
                            </li>
                            <li>
                                <strong>Richieste di preventivo, descrizioni del lavoro e fotografie allegate:</strong>{" "}
                                <LegalNotice type="DA CONFERMARE">Periodo di conservazione dello storico richieste e foto (es. 24 mesi dalla chiusura della richiesta, al fine di consentire la verifica e gestione di eventuali controversie tra committente e artigiano)</LegalNotice>.
                            </li>
                            <li>
                                <strong>Messaggi di chat interna:</strong>{" "}
                                <LegalNotice type="DA CONFERMARE">Periodo di conservazione dei messaggi scambiati tra utenti (es. 12-24 mesi dall'ultimo messaggio)</LegalNotice>.
                            </li>
                            <li>
                                <strong>Documenti aziendali (DURC, visure camerali):</strong> conservati per l'intero periodo di validità legale
                                del documento e per la durata della permanenza dello status di "Azienda Verificata".
                            </li>
                            <li>
                                <strong>File e dati per analisi energetica bollette:</strong> i file grafici o PDF della bolletta non vengono
                                conservati permanentemente nello storage; i dati numerici sintetici estratti (lead) sono conservati per{" "}
                                <LegalNotice type="DA CONFERMARE">Periodo di conservazione della scheda lead energetica (es. 12 mesi dalla simulazione)</LegalNotice>.
                            </li>
                            <li>
                                <strong>Dati amministrativi, contabili e transazionali:</strong> conservati per 10 anni in conformità all'art. 2220
                                del Codice Civile e agli obblighi fiscali e tributari applicabili.
                            </li>
                            <li>
                                <strong>Log tecnici e dati di navigazione:</strong> conservati per un periodo non superiore a 6 mesi per finalità di sicurezza delle reti e contrasto ad attacchi informatici, salvo diverse disposizioni dell'Autorità Giudiziaria.
                            </li>
                        </ul>
                    </section>

                    {/* 09. Diritti dell'Interessato */}
                    <section className="scroll-mt-28" id="diritti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">09.</span>
                            I Tuoi Diritti ai Sensi del GDPR (Artt. 15–22)
                        </h2>
                        <p>
                            In conformità agli articoli da 15 a 22 del Regolamento (UE) 2016/679, ciascun interessato può esercitare in qualsiasi
                            momento e a titolo gratuito i seguenti diritti nei confronti del Titolare del trattamento:
                        </p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                                <strong className="text-white block mb-1">Diritto di Accesso (Art. 15)</strong>
                                Ottenere conferma dell'esistenza di dati che ti riguardano e riceverne copia intelligibile con le informazioni sul trattamento.
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                                <strong className="text-white block mb-1">Diritto di Rettifica (Art. 16)</strong>
                                Richiedere l'aggiornamento, la correzione dei dati inesatti o l'integrazione dei dati personali incompleti.
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                                <strong className="text-white block mb-1">Diritto di Cancellazione / Oblio (Art. 17)</strong>
                                Chiedere la cancellazione dei dati personali quando non siano più necessari per le finalità o in caso di revoca del consenso.
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                                <strong className="text-white block mb-1">Diritto di Limitazione (Art. 18)</strong>
                                Ottenere la limitazione del trattamento in caso di contestazione sull'esattezza dei dati o di trattamento illecito.
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                                <strong className="text-white block mb-1">Diritto alla Portabilità (Art. 20)</strong>
                                Ricevere i propri dati in formato strutturato, di uso comune e leggibile da dispositivo automatico, e trasmetterli ad altro titolare.
                            </div>
                            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                                <strong className="text-white block mb-1">Diritto di Opposizione (Art. 21)</strong>
                                Opporsi in qualsiasi momento per motivi connessi alla propria situazione particolare al trattamento basato sul legittimo interesse.
                            </div>
                        </div>

                        <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                            <strong className="text-white block mb-1">Diritto di Revoca del Consenso</strong>
                            <p>
                                Qualora il trattamento sia fondato sul consenso (ad esempio per comunicazioni promozionali facoltative o condivisione
                                con partner energetici), l'interessato ha il diritto di revocare il proprio consenso in ogni momento, senza pregiudicare
                                la liceità del trattamento basata sul consenso prestato prima della revoca.
                            </p>
                        </div>

                        <div className="mt-4 p-4 rounded-xl border border-brand/30 bg-brand/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold text-white text-sm">Modalità per l'esercizio dei diritti</p>
                                <p className="text-xs text-slate-300">
                                    Puoi inviare una richiesta scritta indicando l'oggetto "Esercizio Diritti Privacy" all'indirizzo email del Titolare:{" "}
                                    <LegalNotice type="DA COMPLETARE">email privacy o PEC del Titolare</LegalNotice>.
                                </p>
                            </div>
                            <Link
                                to="/gdpr"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white font-semibold text-xs hover:bg-brand/90 transition-colors shrink-0"
                            >
                                Consulta la guida GDPR
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </section>

                    {/* 10. Reclamo al Garante */}
                    <section className="scroll-mt-28" id="reclamo">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">10.</span>
                            Diritto di Reclamo all'Autorità di Controllo Competente
                        </h2>
                        <p>
                            Fatto salvo ogni altro ricorso amministrativo o giurisdizionale, qualora l'interessato ritenga che il trattamento dei propri
                            dati personali violi le disposizioni del Regolamento (UE) 2016/679, ha il diritto di proporre reclamo all'Autorità di Controllo
                            nello Stato membro in cui risiede abitualmente, lavora, oppure nel luogo ove si è verificata la presunta violazione.
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-1.5">
                            <p><strong className="text-white">Autorità di Controllo per l'Italia:</strong> Garante per la Protezione dei Dati Personali</p>
                            <p><strong className="text-white">Sede istituzionale:</strong> Piazza Venezia n. 11 - 00187 Roma (RM)</p>
                            <p><strong className="text-white">Sito web ufficiale:</strong> <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">www.garanteprivacy.it</a></p>
                            <p><strong className="text-white">Centralino telefonico:</strong> (+39) 06.696771</p>
                            <p><strong className="text-white">Posta Elettronica Certificata:</strong> protocollo@pec.gpdp.it</p>
                            <p><strong className="text-white">Email ordinaria:</strong> garante@gpdp.it</p>
                        </div>
                    </section>

                    {/* 11. Modifiche */}
                    <section className="scroll-mt-28" id="modifiche">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">11.</span>
                            Aggiornamenti e Modifiche della Presente Informativa
                        </h2>
                        <p>
                            La presente informativa sul trattamento dei dati personali può essere soggetta a revisioni o integrazioni periodiche
                            in conseguenza dell'introduzione di nuove disposizioni normative, dell'adeguamento ad orientamenti giurisprudenziali
                            o dell'implementazione di nuove funzionalità tecniche sulla piattaforma.
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                            Le modifiche sostanziali saranno comunicate agli utenti registrati mediante apposito avviso pubblicato sulla home page
                            della piattaforma o tramite comunicazione a mezzo email prima della loro effettiva applicazione.
                        </p>
                    </section>
                </div>

                {/* Footer link indietro */}
                <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                    <Link to="/" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Torna alla Home
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to="/termini" className="hover:text-white transition-colors">Termini di Servizio</Link>
                        <span>·</span>
                        <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
                        <span>·</span>
                        <Link to="/gdpr" className="hover:text-white transition-colors">Diritti GDPR</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
