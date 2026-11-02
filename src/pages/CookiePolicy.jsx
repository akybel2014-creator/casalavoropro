import { Link } from "react-router-dom";
import { Cookie, ChevronRight, ShieldCheck, AlertTriangle, ArrowLeft, ExternalLink, SlidersHorizontal, Info } from "lucide-react";

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

const COOKIE_INVENTORY = [
    {
        name: "access_token",
        provider: "CasaLavoroPRO (Prima parte)",
        type: "Cookie HTTP (HttpOnly, Secure)",
        category: "Tecnico / Strettamente Necessario",
        duration: "2 ore",
        purpose: "Autenticazione sicura dell'utente, verifica della sessione attiva e protezione contro accessi non autorizzati alle chiamate API."
    },
    {
        name: "refresh_token",
        provider: "CasaLavoroPRO (Prima parte)",
        type: "Cookie HTTP (HttpOnly, Secure)",
        category: "Tecnico / Strettamente Necessario",
        duration: "14 giorni",
        purpose: "Rinnovo automatico della sessione autenticata senza richiedere il reinserimento continuativo di email e password."
    },
    {
        name: "clpro_access_token",
        provider: "CasaLavoroPRO (Prima parte)",
        type: "Web Storage (localStorage)",
        category: "Tecnico / Funzionale",
        duration: "Fino al logout o cancellazione dati del browser",
        purpose: "Memorizzazione locale del token di accesso per garantire la persistenza dell'autenticazione anche in ambienti con restrizioni sui cookie di terze parti (es. anteprime e dispositivi mobili)."
    },
    {
        name: "clpro_refresh_token",
        provider: "CasaLavoroPRO (Prima parte)",
        type: "Web Storage (localStorage)",
        category: "Tecnico / Funzionale",
        duration: "Fino al logout o cancellazione dati del browser",
        purpose: "Memorizzazione locale del token di rinnovo sessione per consentire il refresh trasparente della sessione."
    }
];

const THIRD_PARTY_RESOURCES = [
    {
        name: "Google Fonts",
        provider: "Google Ireland Limited / Google LLC",
        type: "Servizio di visualizzazione font (CDN)",
        purpose: "Caricamento e corretta visualizzazione dei caratteri tipografici di sistema (Outfit e Plus Jakarta Sans) utilizzati nell'interfaccia grafica.",
        dataProcessed: "Indirizzo IP del visitatore, intestazioni HTTP e dati tecnici di richiesta risorsa.",
        link: "https://policies.google.com/privacy"
    },
    {
        name: "OpenStreetMap / Leaflet Tiles",
        provider: "OpenStreetMap Foundation (OSMF)",
        type: "Mappe digitali e coordinate geografiche",
        purpose: "Fornitura delle porzioni grafiche di mappa (tiles) per la localizzazione geografica delle aziende e degli annunci nella directory e nei dettagli del cantiere.",
        dataProcessed: "Indirizzo IP per il download delle mappe georeferenziate.",
        link: "https://wiki.osmfoundation.org/wiki/Privacy_Policy"
    }
];

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-navy text-slate-300 pt-28 sm:pt-36 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-200">Cookie Policy</span>
                </nav>

                {/* Header */}
                <div className="border-b border-white/10 pb-8 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-4">
                        <Cookie className="h-3.5 w-3.5" />
                        Informativa sui Cookie e Tracciatori
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                        Informativa sull'Uso dei Cookie e Strumenti Analoghi
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                        In conformità alle Linee guida del Garante Privacy del 10 giugno 2021 e all'art. 122 del Codice Privacy (D.Lgs. 196/2003),
                        questa pagina descrive in modo trasparente tutti i cookie tecnici e gli strumenti di archiviazione locale effettivamente
                        utilizzati dalla piattaforma CasaLavoroPRO.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Ultimo aggiornamento: <LegalNotice type="DA COMPLETARE">Data di pubblicazione, es. 1 Maggio 2026</LegalNotice></span>
                        <span>·</span>
                        <span>Versione: 1.0</span>
                    </div>
                </div>

                {/* Box Stato del Consenso */}
                <div className="mb-10 rounded-2xl border border-white/10 bg-navy-700/60 p-6 sm:p-7">
                    <h2 className="font-display font-bold text-base text-white mb-2 flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-brand" />
                        Stato della Gestione del Consenso e Cookie Banner
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                        Dall'ispezione tecnica del codice sorgente di CasaLavoroPRO emerge che <strong>la piattaforma utilizza esclusivamente cookie e identificatori tecnici di prima parte</strong>, indispensabili per consentire l'accesso autenticato alle dashboard e la sicurezza del marketplace.
                    </p>
                    <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 space-y-2">
                        <p className="flex items-start gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                                <strong>Perché non è presente un cookie banner preventivo:</strong> ai sensi della normativa vigente (art. 122, comma 1 del Codice Privacy), i cookie tecnici e i token strettamente necessari per l'erogazione del servizio richiesto dall'utente non richiedono il consenso preventivo, ma unicamente la presente informativa dettagliata.
                            </span>
                        </p>
                        <p className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                            <span>
                                <strong>Assenza di cookie di profilazione o marketing:</strong> nel codice della piattaforma non sono presenti strumenti di profilazione commerciale, pixel di tracciamento pubblicitario o cookie analitici invasivi di terze parti.
                            </span>
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 text-xs">
                        <LegalNotice type="DA VERIFICARE">Se in futuro verranno integrati strumenti di web analytics (es. Google Analytics 4) o pixel pubblicitari (es. Meta Pixel), sarà obbligatorio installare una Consent Management Platform (CMP) certificata con blocco preventivo dei relativi script prima del consenso.</LegalNotice>
                    </div>
                </div>

                {/* Sezioni */}
                <div className="space-y-10 text-sm leading-relaxed text-slate-300">
                    {/* 1. Cosa sono i cookie */}
                    <section className="scroll-mt-28" id="cosa-sono">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">01.</span>
                            Cosa sono i cookie e gli strumenti di archiviazione locale
                        </h2>
                        <p>
                            I cookie sono stringhe di testo di piccole dimensioni che i siti web visitati dall'utente inviano al suo terminale
                            (computer, tablet o smartphone), dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla successiva visita.
                        </p>
                        <p className="mt-2">
                            Oltre ai cookie HTTP tradizionali, CasaLavoroPRO utilizza meccanismi di <strong>Web Storage (localStorage)</strong>.
                            Si tratta di tecnologie equivalenti che consentono all'applicazione web di salvare frammenti di dati tecnici direttamente
                            sul browser dell'utente, migliorando la reattività del sito e consentendo l'autenticazione persistente.
                        </p>
                    </section>

                    {/* 2. Inventario effettivo dei cookie */}
                    <section className="scroll-mt-28" id="inventario">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">02.</span>
                            Elenco Completo dei Cookie e Tracciatori Rilevati nel Progetto
                        </h2>
                        <p className="mb-4 text-xs text-slate-400">
                            La seguente tabella riporta tutti gli strumenti tecnici attivi rilevati nell'architettura software di CasaLavoroPRO:
                        </p>

                        <div className="space-y-4">
                            {COOKIE_INVENTORY.map((c) => (
                                <div key={c.name} className="rounded-2xl border border-white/10 bg-navy-700/60 p-5 text-xs text-slate-300">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <code className="font-mono text-sm font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                                            {c.name}
                                        </code>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                            {c.category}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-y border-white/5 my-2">
                                        <div><strong className="text-white">Fornitore:</strong> {c.provider}</div>
                                        <div><strong className="text-white">Tipologia:</strong> {c.type}</div>
                                        <div><strong className="text-white">Durata:</strong> {c.duration}</div>
                                    </div>
                                    <p className="text-slate-300">
                                        <strong className="text-white">Finalità:</strong> {c.purpose}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Risorse terze parti */}
                    <section className="scroll-mt-28" id="terze-parti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">03.</span>
                            Risorse Esterne e Terze Parti
                        </h2>
                        <p className="mb-4">
                            Per offrire un'esperienza visiva fluida e permettere la geolocalizzazione dei cantieri, il sito effettua richieste
                            tecniche verso i seguenti servizi esterni:
                        </p>

                        <div className="space-y-4">
                            {THIRD_PARTY_RESOURCES.map((r) => (
                                <div key={r.name} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-slate-300">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                        <h3 className="font-semibold text-white text-sm">{r.name}</h3>
                                        <a
                                            href={r.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-brand hover:underline"
                                        >
                                            Informativa privacy esterna <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <p className="text-slate-400 mb-2"><strong>Fornitore:</strong> {r.provider} ({r.type})</p>
                                    <p className="mb-1"><strong>Finalità:</strong> {r.purpose}</p>
                                    <p className="text-slate-400"><strong>Dati trattati:</strong> {r.dataProcessed}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. Come disabilitare i cookie */}
                    <section className="scroll-mt-28" id="gestione">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">04.</span>
                            Come gestire o disabilitare i cookie dal browser
                        </h2>
                        <p>
                            L'utente può in qualunque momento scegliere di bloccare o cancellare i cookie modificando le impostazioni del proprio browser.
                            Tuttavia, la disattivazione dei cookie tecnici di CasaLavoroPRO impedirà il corretto funzionamento dell'accesso all'area riservata
                            e l'invio delle richieste di preventivo.
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                            Istruzioni fornite dai principali produttori di browser:
                        </p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <a
                                href="https://support.google.com/chrome/answer/95647"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-white"
                            >
                                <span>Google Chrome</span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                            </a>
                            <a
                                href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-white"
                            >
                                <span>Mozilla Firefox</span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                            </a>
                            <a
                                href="https://support.apple.com/it-it/guide/safari/sfri11471/mac"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-white"
                            >
                                <span>Apple Safari</span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                            </a>
                            <a
                                href="https://support.microsoft.com/it-it/windows/gestire-i-cookie-in-microsoft-edge-168dab11-0753-043d-7c16-ede5947fc64d"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between text-white"
                            >
                                <span>Microsoft Edge</span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                            </a>
                        </div>
                    </section>

                    {/* 5. Contatti */}
                    <section className="scroll-mt-28" id="contatti">
                        <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                            <span className="text-brand font-mono text-base">05.</span>
                            Domande e Contatti
                        </h2>
                        <p>
                            Per qualsiasi chiarimento in merito all'uso dei cookie o delle tecnologie di tracciamento su CasaLavoroPRO, puoi contattare il Titolare all'indirizzo email <a href="mailto:info@casalavoropro.com" className="text-brand hover:underline">info@casalavoropro.com</a>.
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
                        <Link to="/termini" className="hover:text-white transition-colors">Termini di Servizio</Link>
                        <span>·</span>
                        <Link to="/gdpr" className="hover:text-white transition-colors">Diritti GDPR</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
