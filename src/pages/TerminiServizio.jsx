import { Link } from "react-router-dom";
import { Scale, ChevronRight, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";

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

export default function TerminiServizio() {
    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200">Termini di Servizio</span>
                </nav>

                {/* Header */}
                <div className="border-b border-white/10 pb-8 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 mb-4">
                        <Scale className="h-3.5 w-3.5" />
                        Condizioni Generali di Contratto
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                        Termini e Condizioni di Servizio
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                        Le presenti Condizioni Generali di Servizio disciplinano l'accesso e l'utilizzo della piattaforma web
                        CasaLavoroPRO da parte degli utenti privati, dei consumatori, delle imprese artigiane e dei professionisti del settore casa.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Ultimo aggiornamento: <LegalNotice type="DA COMPLETARE">Data di entrata in vigore, es. 1 Maggio 2026</LegalNotice></span>
                        <span>·</span>
                        <span>Versione: 1.0</span>
                    </div>
                </div>

                {/* Box Avviso Ruolo Piattaforma */}
                <div className="mb-10 rounded-2xl border border-white/10 bg-navy-700/60 p-6 sm:p-7 text-xs text-slate-300 leading-relaxed">
                    <h2 className="font-display font-bold text-base text-white mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-brand" />
                        Natura del Servizio e Ruolo di CasaLavoroPRO
                    </h2>
                    <p className="mb-2">
                        CasaLavoroPRO mette a disposizione una piattaforma tecnologica digitale destinata a facilitare la consultazione,
                        il contatto, l'interscambio di preventivi, la locazione di attrezzature e la compravendita di macchinari usati tra utenti privati e operatori economici indipendenti.
                    </p>
                    <p className="mb-2">
                        <LegalNotice type="DA CONFERMARE">Qualificazione giuridica esatta di CasaLavoroPRO: mero fornitore di hosting e piattaforma di contatto informativo tra domanda e offerta, senza alcuna assunzione di garanzia o rappresentanza rispetto ai contratti d'opera o di compravendita perfezionati tra gli utenti.</LegalNotice>
                    </p>
                    <p>
                        Salvo dove espressamente indicato per iscritto, <strong>CasaLavoroPRO non è parte contraente</strong> nei contratti di appalto, prestazione d'opera o compravendita stipulati tra privati e imprese registrate.
                    </p>
                </div>

                {/* Sezioni */}
                <div className="space-y-10 text-sm leading-relaxed text-slate-300">
                    {/* 1. Definizioni */}
                    <section className="scroll-mt-28" id="definizioni">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">01.</span>
                            Definizioni
                        </h2>
                        <ul className="space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li><strong>Piattaforma / Portale:</strong> il sito web e i servizi digitali accessibili all'indirizzo casalavoropro.com e relativi sottodomini.</li>
                            <li><strong>CasaLavoroPRO / Gestore:</strong> l'entità giuridica <LegalNotice type="DA COMPLETARE">Ragione Sociale del Gestore, P.IVA e sede legale</LegalNotice> titolare della piattaforma.</li>
                            <li><strong>Utente Privato:</strong> la persona fisica che agisce per scopi estranei all'attività imprenditoriale o professionale eventualmente svolta (Consumatore ai sensi del D.Lgs. 206/2005 - Codice del Consumo).</li>
                            <li><strong>Azienda / Professionista:</strong> la persona fisica o giuridica che agisce nell'esercizio della propria attività imprenditoriale, commerciale, artigianale o professionale nel settore edile o impiantistico.</li>
                            <li><strong>Richiesta di Preventivo:</strong> la descrizione di lavori o interventi per la casa pubblicata da un Utente Privato per ricevere proposte tecniche ed economiche.</li>
                            <li><strong>Annuncio (Noleggio / Usato):</strong> l'inserzione pubblicata per concedere in noleggio o vendere attrezzature edili, elettroutensili o macchinari da cantiere.</li>
                        </ul>
                    </section>

                    {/* 2. Registrazione e Account */}
                    <section className="scroll-mt-28" id="account">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">02.</span>
                            Registrazione, Requisiti di Accesso e Sicurezza dell'Account
                        </h2>
                        <p>
                            L'accesso ad alcune funzionalità (pubblicazione richieste, risposte a preventivi, messaggistica, annunci) è subordinato alla registrazione di un account personale.
                        </p>
                        <ul className="mt-3 space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li>L'utente deve avere almeno 18 anni e piena capacità di agire.</li>
                            <li>Tutte le informazioni fornite in fase di registrazione (dati anagrafici, P.IVA, recapiti, zona operativa) devono essere veritiere, accurate e costantemente aggiornate.</li>
                            <li>Le credenziali di accesso sono strettamente personali e non cedibili a terzi. L'utente è l'unico responsabile della riservatezza della propria password e di ogni attività condotta tramite il proprio account.</li>
                            <li>CasaLavoroPRO si riserva il diritto di sospendere o cancellare account che utilizzino identità fittizie, recapiti inesistenti o svolgano attività contrarie alla legge o al decoro della piattaforma.</li>
                        </ul>
                    </section>

                    {/* 3. Verifica Aziende e Badge */}
                    <section className="scroll-mt-28" id="aziende-verifica">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">03.</span>
                            Aziende Iscritte, Documentazione Societaria e Badge Verificato
                        </h2>
                        <p>
                            Le aziende e gli artigiani possono richiedere il badge <strong>"Azienda Verificata"</strong> inserendo sulla piattaforma la propria Partita IVA, la visura camerale o le certificazioni di abilitazione professionale.
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2">
                            <p>
                                <strong>Portata del controllo:</strong> la verifica operata da CasaLavoroPRO consiste in un controllo formale e documentale sui file trasmessi dall'azienda al momento della richiesta.
                            </p>
                            <p>
                                <strong>Esclusione di garanzia sulle prestazioni d'opera:</strong> il conferimento del badge "Azienda Verificata" non costituisce in alcun modo fideiussione, approvazione qualitativa né garanzia da parte di CasaLavoroPRO sulla corretta, puntuale o perfetta esecuzione dei lavori commissionati dal privato. L'azienda resta l'unica ed esclusiva responsabile dell'osservanza delle regole dell'arte, delle norme sulla sicurezza sul lavoro (D.Lgs. 81/2008) e della garanzia legale per difformità o vizi dell'opera ai sensi degli artt. 1667 e ss. c.c.
                            </p>
                        </div>
                    </section>

                    {/* 4. Richieste di Preventivo */}
                    <section className="scroll-mt-28" id="preventivi">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">04.</span>
                            Richieste di Preventivo e Rapporti tra Privati e Imprese
                        </h2>
                        <p>
                            Il servizio di pubblicazione di richieste di preventivo è gratuito per gli utenti privati.
                        </p>
                        <ul className="mt-2 space-y-2 list-disc list-inside text-xs text-slate-300">
                            <li>Le richieste devono riguardare interventi reali, descritti con chiarezza e non contrari all'ordine pubblico o a disposizioni urbanistiche ed edilizie.</li>
                            <li>I preventivi trasmessi dalle aziende attraverso la piattaforma costituiscono proposte informative preliminari o offerte contrattuali soggette a eventuale sopralluogo tecnico.</li>
                            <li>L'accettazione di una risposta sulla piattaforma manifesta l'interesse del cliente ad avviare la trattativa diretta. L'accordo finale, il contratto d'appalto e i relativi pagamenti per le opere si perfezionano direttamente tra il committente e l'esecutore, senza intermediazione finanziaria obbligatoria da parte di CasaLavoroPRO.</li>
                        </ul>
                    </section>

                    {/* 5. Noleggio e Mercatino */}
                    <section className="scroll-mt-28" id="noleggio-usato">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">05.</span>
                            Noleggio Attrezzature e Mercatino dell'Usato
                        </h2>
                        <p>
                            La piattaforma ospita una sezione dedicata al noleggio di macchinari e attrezzatura da cantiere e alla compravendita di beni usati tra privati e aziende.
                        </p>
                        <div className="mt-3 space-y-3">
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <p className="font-semibold text-white mb-1">A. Condizioni per gli Inserzionisti</p>
                                <p>
                                    Chi pubblica un annuncio dichiara e garantisce di avere la piena e legittima disponibilità del bene, che l'attrezzatura risponde alle norme di sicurezza e marcatura CE applicabili e che le foto e descrizioni corrispondono allo stato effettivo d'uso del macchinario.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                                <p className="font-semibold text-white mb-1">B. Prenotazioni, Cauzioni e Politiche di Annullamento</p>
                                <p>
                                    Le date di noleggio e la conferma della disponibilità sono concordate tramite la piattaforma o i recapiti dell'inserzionista.
                                </p>
                                <p className="mt-2">
                                    <LegalNotice type="DA CONFERMARE">Condizioni e termini di custodia della caparra/cauzione sul noleggio: se incassata direttamente dal locatore o gestita tramite escrow/piattaforma di pagamento</LegalNotice>
                                </p>
                                <p className="mt-2">
                                    <LegalNotice type="DA CONFERMARE">Politiche di rimborso e termini massimi di disdetta gratuita prima dell'inizio del periodo di noleggio (es. disdetta con 48 ore di preavviso)</LegalNotice>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 6. Ricerca Operai */}
                    <section className="scroll-mt-28" id="offerte-lavoro">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">06.</span>
                            Annunci di Offerta di Lavoro e Ricerca Operai
                        </h2>
                        <p>
                            Le aziende possono pubblicare annunci per la ricerca di manodopera specializzata (muratori, idraulici, elettricisti, carpentieri, ecc.).
                        </p>
                        <p className="mt-2 text-xs text-slate-300">
                            Gli annunci devono rispettare rigorosamente le disposizioni di legge sul lavoro (D.Lgs. 276/2003 e D.Lgs. 198/2006 in tema di pari opportunità tra uomo e donna, senza discriminazioni di genere, età, nazionalità o convinzioni personali). CasaLavoroPRO funge da mero canale informativo e non opera come agenzia di somministrazione di lavoro.
                        </p>
                    </section>

                    {/* 7. Registro Interventi e Cantieri Certificati */}
                    <section className="scroll-mt-28" id="registro-cantieri">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">07.</span>
                            Registro Interventi e Fotografie di Cantiere
                        </h2>
                        <p>
                            Le aziende possono creare schede di cantiere documentando lo stato dei lavori (prima, durante, dopo) con datazione e marcatura temporale.
                        </p>
                        <p className="mt-2 text-xs text-slate-300">
                            L'utente che carica le fotografie garantisce di avere ottenuto il consenso del proprietario dell'immobile alla ripresa degli ambienti e di non ritrarre persone fisiche non consenzienti, targhe di autoveicoli o documenti riservati.
                        </p>
                    </section>

                    {/* 8. Analisi Energetica Bollette (AI) */}
                    <section className="scroll-mt-28" id="analisi-bollette">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">08.</span>
                            Strumento di Analisi Energetica delle Bollette (AI)
                        </h2>
                        <p>
                            Il servizio di lettura ed estrazione delle bollette di energia elettrica e gas tramite modelli di intelligenza artificiale
                            ha natura puramente indicativa ed estimativa.
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2">
                            <p>
                                I dati estratti (consumi annui, potenza, stima dei costi della materia energia) non costituiscono consulenza contrattuale, finanziaria o tariffaria vincolante. CasaLavoroPRO non garantisce il risparmio effettivo ottenibile con eventuali nuovi fornitori e raccomanda sempre la verifica puntuale delle schede di confrontabilità ufficiali ARERA prima di sottoscrivere nuovi contratti di fornitura.
                            </p>
                        </div>
                    </section>

                    {/* 9. Piani, Prezzi e Pagamenti */}
                    <section className="scroll-mt-28" id="prezzi">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">09.</span>
                            Piani di Abbonamento, Servizi a Pagamento e Recesso
                        </h2>
                        <p>
                            Allo stato attuale, l'iscrizione a CasaLavoroPRO è gratuita sia per gli utenti privati che per le aziende (Profilo Base e Promo Fondatori 50).
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2">
                            <p>
                                <strong>Futuro Profilo PRO e Servizi Avanzati:</strong> le condizioni economiche degli eventuali abbonamenti futuri a pagamento saranno comunicate con congruo anticipo e richiederanno l'espressa accettazione da parte dell'utente prima di qualsiasi addebito.
                            </p>
                            <p>
                                <LegalNotice type="DA CONFERMARE">Diritto di recesso di 14 giorni per gli utenti consumatori ai sensi dell'art. 52 del Codice del Consumo e relative modalità di rimborso in caso di acquisto di servizi digitali.</LegalNotice>
                            </p>
                            <p>
                                <LegalNotice type="DA CONFERMARE">Condizioni di rinnovo tacito o cancellazione dell'abbonamento PRO per i professionisti (utenti business).</LegalNotice>
                            </p>
                        </div>
                    </section>

                    {/* 10. Proprietà intellettuale */}
                    <section className="scroll-mt-28" id="proprieta-intellettuale">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">10.</span>
                            Proprietà Intellettuale e Contenuti dell'Utente
                        </h2>
                        <p>
                            Tutti i contenuti della piattaforma (grafica, codice sorgente, logo, marchi, testi e struttura del sito) sono di esclusiva proprietà di CasaLavoroPRO o dei suoi danti causa e sono protetti dalle leggi vigenti sul diritto d'autore e sui marchi registrati.
                        </p>
                        <p className="mt-2 text-xs text-slate-300">
                            Caricando immagini, loghi o descrizioni (es. foto cantieri o annunci di noleggio), l'utente concede a CasaLavoroPRO una licenza non esclusiva, gratuita e mondiale per visualizzare, riprodurre e distribuire tali contenuti esclusivamente per le finalità di funzionamento del marketplace e della directory.
                        </p>
                    </section>

                    {/* 11. Limitazione di Responsabilità */}
                    <section className="scroll-mt-28" id="responsabilita">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">11.</span>
                            Limitazione di Responsabilità
                        </h2>
                        <p>
                            Nei limiti massimi consentiti dalla legge applicabile, CasaLavoroPRO non sarà responsabile per:
                        </p>
                        <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs text-slate-300">
                            <li>Danni diretti o indiretti derivanti dall'inadempimento, dal ritardo o dalla scorretta esecuzione delle prestazioni artigianali o dei cantieri concordati tra privati e aziende;</li>
                            <li>Vizi, malfunzionamenti o difetti di conformità dei macchinari e delle attrezzature noleggiate o compravendute tramite gli annunci del mercatino;</li>
                            <li>Interruzioni temporanee del servizio dovute a manutenzione tecnica, guasti di rete o cause di forza maggiore;</li>
                            <li>Informazioni inesatte fornite dagli inserzionisti in merito a prezzi, disponibilità o caratteristiche dei servizi.</li>
                        </ul>
                    </section>

                    {/* 12. Legge applicabile e foro competente */}
                    <section className="scroll-mt-28" id="legge-foro">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">12.</span>
                            Legge Applicabile, Risoluzione delle Controversie e Foro Competente
                        </h2>
                        <p>
                            Le presenti Condizioni Generali sono regolate dalla legge italiana.
                        </p>
                        <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2">
                            <p>
                                <strong>Per gli utenti Privati (Consumatori):</strong> per qualsiasi controversia nascente dall'interpretazione, esecuzione o risoluzione dei presenti Termini, la competenza territoriale inderogabile spetta al giudice del luogo di residenza o di domicilio del consumatore, ai sensi del Codice del Consumo (D.Lgs. 206/2005). La Commissione Europea mette inoltre a disposizione una piattaforma per la risoluzione alternativa online delle controversie (ODR), accessibile su <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">ec.europa.eu/consumers/odr</a>.
                            </p>
                            <p>
                                <strong>Per gli utenti Professionisti e Aziende:</strong> per qualsiasi controversia tra CasaLavoroPRO e un utente business è competente in via esclusiva il Foro di <LegalNotice type="DA COMPLETARE">Città del Foro competente per utenti business, es. Milano o Roma</LegalNotice>.
                            </p>
                        </div>
                    </section>

                    {/* 13. Contatti */}
                    <section className="scroll-mt-28" id="contatti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">13.</span>
                            Comunicazioni e Assistenza Clienti
                        </h2>
                        <p>
                            Per richieste di supporto, segnalazioni su comportamenti scorretti di utenti o comunicazioni formali relative ai Termini di Servizio, è possibile contattare l'assistenza:
                        </p>
                        <p className="mt-2 text-xs text-white">
                            Email: <a href="mailto:info@casalavoropro.com" className="text-brand hover:underline">info@casalavoropro.com</a> · Assistenza attiva Lun–Ven 9:00–18:00
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
                        <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
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
