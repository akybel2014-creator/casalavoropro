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
                        Informativa sulla Privacy (GDPR UE 2016/679)
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                        Informativa sul Trattamento dei Dati Personali
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                        Ai sensi dell'art. 13 e 14 del Regolamento (UE) 2016/679 ("GDPR"), questa informativa descrive come
                        CasaLavoroPRO raccoglie, utilizza, protegge e conserva i dati personali degli utenti privati, delle imprese
                        e dei professionisti che accedono al marketplace.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Data di pubblicazione: <LegalNotice type="DA COMPLETARE">Data di entrata in vigore, es. 1 Maggio 2026</LegalNotice></span>
                        <span>·</span>
                        <span>Versione: 1.0</span>
                    </div>
                </div>

                {/* Box Avviso Legale */}
                <div className="mb-10 rounded-2xl border border-white/10 bg-navy-700/60 p-5 text-xs text-slate-300 leading-relaxed">
                    <p className="font-semibold text-white mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand" />
                        Nota di trasparenza per l'utente
                    </p>
                    Questa informativa si applica a tutte le funzionalità della piattaforma CasaLavoroPRO: registrazione di account privati
                    e aziendali, richiesta di preventivi, consultazione della directory delle imprese, noleggio attrezzature, compravendita nel
                    mercatino dell'usato, registro cantieri e strumento di analisi energetica delle bollette.
                </div>

                {/* Sezioni */}
                <div className="space-y-10 text-sm leading-relaxed text-slate-300">
                    {/* 1. Titolare */}
                    <section className="scroll-mt-28" id="titolare">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">01.</span>
                            Titolare del Trattamento e Dati di Contatto
                        </h2>
                        <p>
                            Il Titolare del trattamento dei dati personali raccolti tramite la presente piattaforma web è:
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 space-y-1.5 text-xs text-slate-300">
                            <p><strong className="text-white">Denominazione:</strong> CasaLavoroPRO <LegalNotice type="DA COMPLETARE">Ragione Sociale completa, forma giuridica (es. S.r.l.)</LegalNotice></p>
                            <p><strong className="text-white">Sede Legale:</strong> <LegalNotice type="DA COMPLETARE">Indirizzo completo, CAP, Città, Nazione</LegalNotice></p>
                            <p><strong className="text-white">Partita IVA / C.F.:</strong> <LegalNotice type="DA COMPLETARE">Partita IVA e Codice Fiscale del titolare</LegalNotice></p>
                            <p><strong className="text-white">Email di contatto ordinaria:</strong> info@casalavoropro.com</p>
                            <p><strong className="text-white">PEC:</strong> <LegalNotice type="DA COMPLETARE">Indirizzo PEC ufficiale</LegalNotice></p>
                            <p><strong className="text-white">Responsabile della Protezione Dati (DPO):</strong> <LegalNotice type="DA COMPLETARE">Nominato / Non nominato; se nominato indicare email DPO</LegalNotice></p>
                        </div>
                    </section>

                    {/* 2. Ruolo di CasaLavoroPRO */}
                    <section className="scroll-mt-28" id="ruolo">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">02.</span>
                            Ruolo di CasaLavoroPRO nei singoli servizi
                        </h2>
                        <p>
                            CasaLavoroPRO opera come marketplace digitale e piattaforma di incontro tra domanda (privati cittadini)
                            e offerta (imprese e artigiani qualificati).
                        </p>
                        <ul className="mt-3 space-y-2 list-disc list-inside text-slate-300">
                            <li>
                                <strong>Per la gestione del sito, dell'infrastruttura, degli account e della directory:</strong> CasaLavoroPRO
                                agisce in qualità di <em>Titolare autonomo del trattamento</em> dei dati personali degli iscritti.
                            </li>
                            <li>
                                <strong>Per i contatti e i preventivi scambiati tra utenti:</strong> <LegalNotice type="DA CONFERMARE">ruolo di CasaLavoroPRO: intermediario tecnico con titolarità autonoma delle parti o responsabile del trattamento per le comunicazioni tra cliente e fornitore</LegalNotice>. Quando un privato invia una richiesta di preventivo o accetta la risposta di un'azienda, i suoi dati di contatto e le specifiche del cantiere vengono trasmessi all'azienda selezionata, che opera a sua volta come autonomo titolare per l'esecuzione del preventivo o del contratto d'opera.
                            </li>
                            <li>
                                <strong>Per i contratti di noleggio e compravendita di attrezzature usate:</strong> i contratti e le transazioni
                                si perfezionano direttamente ed esclusivamente tra le parti contraenti (locatore/conduttore, venditore/acquirente).
                            </li>
                        </ul>
                    </section>

                    {/* 3. Dati raccolti */}
                    <section className="scroll-mt-28" id="dati-raccolti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">03.</span>
                            Tipologie di Dati Personali Trattati
                        </h2>
                        <p>A seconda dei servizi utilizzati, CasaLavoroPRO tratta le seguenti categorie di dati:</p>

                        <div className="mt-4 space-y-4">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5">A. Utenti Privati (Registrazione e Richieste)</h3>
                                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                                    <li>Dati identificativi e di contatto: nome, cognome, indirizzo email, numero di telefono, città/zona di residenza o dell'immobile.</li>
                                    <li>Dati relativi alla richiesta di lavoro: categoria d'opera (idraulica, elettricità, muratura, pittura, serramenti, ecc.), descrizione delle lavorazioni richieste, budget indicativo, tempistiche di urgenza.</li>
                                    <li>Fotografie e allegati: immagini dello stato dei luoghi caricate a corredo della richiesta o per il registro cantieri.</li>
                                    <li>Dati di autenticazione: credenziali di accesso (password memorizzata esclusivamente in forma cifrata/hash bcrypt) e token tecnici di sessione.</li>
                                </ul>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5">B. Imprese, Artigiani e Professionisti (Aziende)</h3>
                                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                                    <li>Dati societari e fiscali: ragione sociale, Partita IVA, codice fiscale, numero di telefono aziendale, sito web, indirizzo della sede e raggio chilometrico di operatività.</li>
                                    <li>Documentazione per verifica e affidabilità: numero e documento DURC (Documento Unico di Regolarità Contributiva), visura camerale, certificazioni di abilitazione professionale, caricati per l'ottenimento del badge "Azienda Verificata".</li>
                                    <li>Dati di reperibilità e servizi: disponibilità per interventi di emergenza (emergenze 24h, reperibilità notturna, weekend).</li>
                                    <li>Portfolio professionale: fotografie di interventi realizzati, cantieri certificati (stato prima/durante/dopo con geo-tag e timestamp).</li>
                                    <li>Offerte di lavoro e ricerca manodopera: annunci di reclutamento operai, mansioni e relative candidature ricevute.</li>
                                </ul>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5">C. Noleggio Attrezzature e Mercatino dell'Usato</h3>
                                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                                    <li>Dati degli annunci: fotografie dei macchinari/attrezzi, marca, modello, anno, stato d'uso, tariffa giornaliera/oraria o prezzo di vendita, cauzione richiesta.</li>
                                    <li>Dati delle prenotazioni: date di noleggio richieste, recapiti del conduttore, note operative, storico delle conferme o degli annullamenti con relative motivazioni.</li>
                                </ul>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5">D. Strumento di Analisi Energetica Bollette (AI)</h3>
                                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                                    <li>Documenti caricati volontariamente dall'utente: bollette dell'energia elettrica o del gas in formato PDF o immagine (JPG/PNG).</li>
                                    <li>Dati estratti dal documento: fornitore, codice POD (energia elettrica), codice PDR (gas), tipologia fornitura, consumi storici (kWh o Smc), potenza impegnata, spesa della materia energia e totale fatturato.</li>
                                    <li>Eventuali dati personali presenti sul documento originale (es. codice fiscale o intestatario riportati sulla bolletta cartacea caricata dall'utente).</li>
                                </ul>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <h3 className="font-semibold text-white text-sm mb-1.5">E. Dati Tecnici di Navigazione e Cookie</h3>
                                <p className="text-xs text-slate-300">
                                    Indirizzi IP, identificativi di sessione (token JWT per autenticazione tecnica), parametri di navigazione e dati necessari al funzionamento delle mappe Leaflet/OpenStreetMap. Per i dettagli completi si rimanda alla{" "}
                                    <Link to="/cookie-policy" className="text-brand hover:underline font-medium">Cookie Policy</Link>.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 4. Finalità e basi giuridiche */}
                    <section className="scroll-mt-28" id="finalita">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">04.</span>
                            Finalità del Trattamento e Basi Giuridiche
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-white/20 text-white font-semibold">
                                        <th className="py-2.5 pr-4">Finalità</th>
                                        <th className="py-2.5 pr-4">Base Giuridica (GDPR)</th>
                                        <th className="py-2.5">Natura del conferimento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10 text-slate-300">
                                    <tr>
                                        <td className="py-2.5 pr-4">Registrazione account, erogazione servizi del marketplace, gestione profilo</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione del contratto o di misure precontrattuali</td>
                                        <td className="py-2.5">Obbligatorio per fruire della piattaforma</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Inoltro richieste di preventivo alle imprese selezionate e abilitazione chat diretta</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Richiesta espressa dell'utente privato</td>
                                        <td className="py-2.5">Obbligatorio per ricevere preventivi</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Verifica DURC, visure camerali e abilitazione badge "Azienda Verificata"</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione condizioni di servizio azienda e Art. 6(1)(f) Legittimo interesse a tutelare la sicurezza del marketplace</td>
                                        <td className="py-2.5">Obbligatorio per ottenere il badge di verifica</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Gestione annunci noleggio, mercatino usato e prenotazioni attrezzature</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione del servizio richiesto</td>
                                        <td className="py-2.5">Obbligatorio per pubblicare o prenotare</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Analisi tecnica energetica della bolletta tramite intelligenza artificiale</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(b) — Esecuzione del servizio richiesto volontariamente dall'utente</td>
                                        <td className="py-2.5">Facoltativo</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Adempimenti contabili, fiscali e normativi</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(c) — Adempimento di un obbligo legale a cui è soggetto il Titolare</td>
                                        <td className="py-2.5">Obbligatorio per legge</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-4">Sicurezza del sistema, prevenzione abusi, frodi o spam</td>
                                        <td className="py-2.5 pr-4">Art. 6(1)(f) — Legittimo interesse del Titolare a garantire l'integrità del portale</td>
                                        <td className="py-2.5">Necessario per la sicurezza della rete</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 5. Analisi AI e Bollette */}
                    <section className="scroll-mt-28" id="ai-bollette">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">05.</span>
                            Trattamento Documenti con Intelligenza Artificiale (Google Gemini)
                        </h2>
                        <p>
                            La piattaforma include una funzionalità opzionale di <strong>Analisi Energetica della Bolletta</strong> e di stima visiva delle macchine usate. In merito a questo specifico trattamento, si precisa quanto segue:
                        </p>
                        <div className="mt-3 space-y-3">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <p className="font-semibold text-white mb-1">Nessun processo decisionale automatizzato (Art. 22 GDPR)</p>
                                <p>
                                    L'algoritmo di intelligenza artificiale effettua esclusivamente l'estrazione ottica e la strutturazione dei dati tecnici di consumo (lettura consumi, potenza, costi unitari). Non viene adottata alcuna decisione automatizzata che produca effetti giuridici o incida significativamente sull'interessato. I suggerimenti di risparmio o le offerte energetiche costituiscono simulazioni meramente indicative.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <p className="font-semibold text-white mb-1">Fornitore tecnologico e localizzazione</p>
                                <p>
                                    L'elaborazione delle immagini e dei PDF avviene mediante chiamate API verso il modello Google Gemini (<code className="text-brand font-mono">gemini-3.8-flash</code>) fornito da Google LLC / Google Ireland Ltd.
                                </p>
                                <p className="mt-2">
                                    <LegalNotice type="DA VERIFICARE">Regione server e data residency per le API Google Gemini (es. Cloud region UE o USA)</LegalNotice>
                                </p>
                                <p className="mt-2">
                                    <LegalNotice type="DA VERIFICARE">Termini contrattuali Google Cloud / Google AI Enterprise in merito alla non-utilizzazione dei documenti inviati per l'addestramento dei modelli fondazionali</LegalNotice>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 6. Destinatari e Comunicazione */}
                    <section className="scroll-mt-28" id="destinatari">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">06.</span>
                            Destinatari e Trasferimento dei Dati
                        </h2>
                        <p>I dati personali potranno essere comunicati a:</p>
                        <ul className="mt-2 space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li><strong>Imprese ed artigiani iscritti:</strong> limitatamente ai dati anagrafici, recapiti e specifiche dell'opera necessari a formulare il preventivo o concordare l'intervento richiesto dall'utente.</li>
                            <li><strong>Fornitori di servizi tecnici e infrastrutturali:</strong> hosting provider, server farm, provider di database, servizi di backup, fornitori di API di intelligenza artificiale (Google LLC) designati quali Responsabili del Trattamento ai sensi dell'art. 28 GDPR ove applicabile.</li>
                            <li><strong>Consulenti contabili, fiscali o legali:</strong> per adempimenti di legge o per la tutela dei diritti di CasaLavoroPRO in sede giudiziaria.</li>
                            <li><strong>Autorità giudiziarie o amministrative:</strong> in adempimento di ordini vincolanti di legge.</li>
                        </ul>
                        <p className="mt-3">
                            <strong>Trasferimenti verso Paesi terzi al di fuori dello SEE:</strong> Qualora alcuni fornitori tecnici (es. servizi cloud o AI) abbiano sedi o server situati al di fuori dello Spazio Economico Europeo, il trasferimento avviene nel rispetto del Capo V del GDPR, sulla base di Decisioni di Adeguatezza della Commissione Europea (es. EU-US Data Privacy Framework) o mediante la sottoscrizione di Clausole Contrattuali Standard (SCC). <LegalNotice type="DA VERIFICARE">Elenco formale dei Paesi terzi e delle SCC sottoscritte con i singoli sub-responsabili</LegalNotice>
                        </p>
                    </section>

                    {/* 7. Tempi di conservazione */}
                    <section className="scroll-mt-28" id="conservazione">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">07.</span>
                            Tempi di Conservazione dei Dati
                        </h2>
                        <p>I dati personali vengono conservati per il tempo strettamente necessario a conseguire le finalità per cui sono stati raccolti:</p>
                        <ul className="mt-2 space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li><strong>Account e profilo:</strong> per tutta la durata dell'iscrizione alla piattaforma, fino a richiesta di cancellazione o chiusura dell'account.</li>
                            <li><strong>Richieste di preventivo e messaggi chat:</strong> <LegalNotice type="DA VERIFICARE">Periodo di conservazione dello storico preventivi e chat (es. 24 mesi dalla chiusura della richiesta)</LegalNotice>.</li>
                            <li><strong>Documentazione DURC e visure camerali:</strong> per il periodo di validità del documento e per la durata del rapporto contrattuale con l'azienda.</li>
                            <li><strong>Bollette caricate per analisi energetica:</strong> <LegalNotice type="DA VERIFICARE">Politica di conservazione o cancellazione automatica dei file PDF/immagini dopo l'estrazione dei dati</LegalNotice>.</li>
                            <li><strong>Dati amministrativi e contabili:</strong> conservati per 10 anni in conformità agli obblighi dell'art. 2220 del Codice Civile e della normativa fiscale applicabile.</li>
                        </ul>
                    </section>

                    {/* 8. Diritti dell'interessato */}
                    <section className="scroll-mt-28" id="diritti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">08.</span>
                            I Tuoi Diritti (Artt. 15–22 GDPR)
                        </h2>
                        <p>
                            In qualità di interessato, il GDPR ti garantisce il diritto di chiedere in qualsiasi momento l'accesso ai tuoi dati,
                            la rettifica, la cancellazione (oblio), la limitazione del trattamento, la portabilità dei dati in formato strutturato,
                            nonché di opporti al loro trattamento o revocare il consenso precedentemente prestato.
                        </p>
                        <div className="mt-4 p-4 rounded-xl border border-brand/30 bg-brand/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold text-white text-sm">Vuoi esercitare uno dei tuoi diritti?</p>
                                <p className="text-xs text-slate-300">Consulta la nostra guida pratica e scopri le modalità dirette per inoltrare la richiesta.</p>
                            </div>
                            <Link
                                to="/gdpr"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white font-semibold text-xs hover:bg-brand/90 transition-colors shrink-0"
                            >
                                Vai a "I Tuoi Diritti GDPR"
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </section>

                    {/* 9. Reclamo al Garante */}
                    <section className="scroll-mt-28" id="reclamo">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">09.</span>
                            Diritto di Reclamo all'Autorità di Controllo
                        </h2>
                        <p>
                            Fatto salvo ogni altro ricorso amministrativo o giurisdizionale, qualora l'utente ritenga che il trattamento dei propri dati
                            personali avvenga in violazione del GDPR, ha il diritto di proporre reclamo all'Autorità di Controllo nazionale competente.
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-1">
                            <p><strong className="text-white">Autorità competente per l'Italia:</strong> Garante per la Protezione dei Dati Personali</p>
                            <p><strong className="text-white">Sede:</strong> Piazza Venezia n. 11 - 00187 Roma (RM)</p>
                            <p><strong className="text-white">Sito web:</strong> <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">www.garanteprivacy.it</a></p>
                            <p><strong className="text-white">Centralino telefonico:</strong> (+39) 06.696771</p>
                            <p><strong className="text-white">Email / PEC:</strong> garante@gpdp.it · protocollo@pec.gpdp.it</p>
                        </div>
                    </section>

                    {/* 10. Modifiche */}
                    <section className="scroll-mt-28" id="modifiche">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">10.</span>
                            Aggiornamenti della Presente Policy
                        </h2>
                        <p>
                            CasaLavoroPRO si riserva il diritto di modificare o aggiornare la presente informativa per adeguarla a nuovi sviluppi
                            normativi o ad evoluzioni delle funzionalità del portale. Eventuali modifiche sostanziali saranno comunicate agli utenti
                            registrati tramite avviso sul sito o a mezzo posta elettronica.
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
