import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownOfferta } from "@/components/CountdownOfferta";

const BASE_FEATURES = [
    "Presenza nella directory",
    "Profilo aziendale completo",
    "Descrizione dei servizi",
    "Recapiti e contatti",
    "Funzioni essenziali della piattaforma",
];

const PRO_FEATURES = [
    "Maggiore visibilità nelle ricerche locali",
    "Più spazio per foto e portfolio",
    "Più annunci (noleggio e usato)",
    "Statistiche del profilo",
    "Supporto prioritario",
    "Funzioni avanzate senza acquistare crediti per ogni richiesta",
];

const SERVIZI = [
    { nome: "Profilo Pro mensile", prezzo: "€4,99 / mese" },
    { nome: "Profilo Pro annuale", prezzo: "€49,99 / anno" },
    { nome: "Annuncio in evidenza (7 giorni)", prezzo: "da €4,99 a €9,99" },
    { nome: "Profilo sponsorizzato nella tua zona", prezzo: "da €14,99 a €29,99 / mese" },
    { nome: "Annuncio attrezzatura usata in evidenza", prezzo: "da €2,99 a €6,99" },
    { nome: "Offerta di lavoro in evidenza", prezzo: "da €4,99 a €9,99" },
    { nome: "Verifica documentale avanzata", prezzo: "comunicato prima dell'acquisto" },
    { nome: "Creazione di portfolio professionale", prezzo: "una tantum, con preventivo" },
    { nome: "Pacchetto noleggio (più macchinari)", prezzo: "piano personalizzato" },
    { nome: "Pacchetto multi-sede / multi-categoria", prezzo: "piano personalizzato" },
];

export default function Prezzi() {
    return (
        <div className="min-h-screen bg-navy grid-pattern pt-32 pb-24" data-testid="prezzi-page">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl"
                >
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Piani e prezzi</p>
                    <h1 className="mt-3 font-display font-black tracking-tight text-4xl sm:text-5xl text-white">
                        Scegli il piano giusto per la tua impresa
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-300">
                        Il Profilo Base è sempre gratuito. Durante l'Offerta Lancio Fondatori anche il Profilo Pro è
                        100% gratuito fino al 31 Dicembre 2026, senza carta di credito.
                    </p>
                </motion.div>

                {/* Banner offerta lancio */}
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-brand/30 bg-brand/10 p-5" data-testid="prezzi-offerta-banner">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <Sparkles className="h-5 w-5 text-brand" />
                        Offerta Lancio Fondatori: Pro gratis fino al 31 Dicembre 2026
                    </div>
                    <div className="sm:ml-auto">
                        <CountdownOfferta compact tone="onDark" className="text-white" />
                    </div>
                </div>

                {/* Piani */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pay-As-You-Go */}
                    <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-7 sm:p-8" data-testid="plan-payg">
                        <h2 className="font-display font-bold text-white text-xl">Piano a Consumo (Pay-As-You-Go)</h2>
                        <p className="mt-2 font-display font-black text-4xl text-white">0€ <span className="text-base font-semibold text-slate-400">/ mese per sempre</span></p>
                        <p className="mt-1 text-sm text-slate-400">Nessun canone fisso: paghi solo i crediti quando usi i servizi speciali.</p>
                        <ul className="mt-6 space-y-3">
                            {["Bacheca lavoro e noleggio attrezzatura", "Crediti acquistabili solo quando servono", "Nessuna carta richiesta per iniziare"].map((f) => (
                                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Button asChild data-testid="plan-payg-cta"
                            className="mt-8 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                            <Link to="/registrati?ruolo=azienda">Crea Account Azienda Gratis</Link>
                        </Button>
                        <p className="mt-3 text-xs text-slate-400" data-testid="plan-payg-note">
                            Le funzioni gestionali (fatture, cantieri) restano bloccate; puoi usare la bacheca lavoro e il
                            noleggio attrezzatura acquistando i crediti solo quando servono.
                        </p>
                    </div>

                    {/* Base */}
                    <div className="rounded-3xl border border-white/10 bg-navy-700/70 p-7 sm:p-8" data-testid="plan-base">
                        <h2 className="font-display font-bold text-white text-xl">Profilo Base</h2>
                        <p className="mt-2 font-display font-black text-4xl text-white">Gratis</p>
                        <p className="mt-1 text-sm text-slate-400">Gratuito oggi e anche dopo il 31 Dicembre 2026.</p>
                        <ul className="mt-6 space-y-3">
                            {BASE_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Button asChild variant="outline" data-testid="plan-base-cta"
                            className="mt-8 w-full rounded-xl border-white/20 text-white hover:bg-white/10 font-semibold">
                            <Link to="/registrati?ruolo=azienda">Inizia gratis</Link>
                        </Button>
                    </div>

                    {/* Pro */}
                    <div className="relative rounded-3xl border-2 border-brand bg-gradient-to-b from-brand/15 to-navy-700/70 p-7 sm:p-8 shadow-2xl shadow-brand/10" data-testid="plan-pro">
                        <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">CONSIGLIATO</span>
                        <h2 className="font-display font-bold text-white text-xl">Profilo Pro</h2>
                        <p className="mt-2 font-display font-black text-4xl text-white" data-testid="plan-pro-price">
                            €4,99<span className="text-base font-semibold text-slate-400">/mese</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-400">oppure €49,99/anno (2 mesi gratis)</p>
                        <ul className="mt-6 space-y-3">
                            {PRO_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3 text-sm text-slate-200">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Button asChild data-testid="plan-pro-cta"
                            className="mt-8 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                            <Link to="/registrati?ruolo=azienda">Attiva Pro gratis ora <ArrowRight className="h-4 w-4 ml-1" /></Link>
                        </Button>
                    </div>
                </div>

                {/* Privati */}
                <div className="mt-6 rounded-3xl border border-brand/30 bg-brand/5 p-7 flex flex-col sm:flex-row sm:items-center gap-4" data-testid="plan-privati">
                    <div>
                        <h2 className="font-display font-bold text-white text-xl">Sei un privato?</h2>
                        <p className="mt-1 text-sm text-slate-300">Cercare professionisti e analizzare le bollette è sempre gratis, senza costi nascosti.</p>
                    </div>
                    <Button asChild data-testid="plan-privati-cta"
                        className="sm:ml-auto rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold shadow-lg shadow-orange-500/25">
                        <Link to="/registrati?ruolo=privato">Registrati Gratis come Privato (Nessun costo nascosto)</Link>
                    </Button>
                </div>

                {/* Servizi opzionali */}
                <div className="mt-14" data-testid="servizi-opzionali">
                    <h2 className="font-display font-bold text-white text-2xl">Servizi opzionali</h2>
                    <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                        Servizi promozionali per mettere in evidenza profili, annunci di attrezzatura usata e offerte di
                        lavoro. Prezzi indicativi; quello finale è mostrato prima della conferma dell'acquisto.
                    </p>
                    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                        <table className="w-full text-left">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Servizio</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 text-right">Prezzo indicativo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SERVIZI.map((s, i) => (
                                    <tr key={s.nome} className={i % 2 === 0 ? "bg-navy-700/40" : "bg-transparent"}>
                                        <td className="px-5 py-3.5 text-sm text-slate-200">{s.nome}</td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-brand text-right whitespace-nowrap">{s.prezzo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Condizioni */}
                <div className="mt-12 rounded-2xl border border-white/10 bg-navy-700/50 p-6" data-testid="prezzi-condizioni">
                    <h3 className="font-display font-semibold text-white">Condizioni</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        Le funzionalità incluse nei piani, i limiti di utilizzo, la disponibilità dei servizi promozionali
                        e i relativi prezzi sono indicati nella pagina dell'offerta al momento dell'attivazione o
                        dell'acquisto. Il Profilo Base è gratuito, mentre il Profilo Pro e i servizi opzionali sono
                        soggetti ai prezzi e alle condizioni visualizzati prima della conferma. Dati, documenti e
                        contenuti pubblicati dall'utente devono essere veritieri, aggiornati e conformi alla normativa
                        applicabile.
                    </p>
                </div>
            </div>
        </div>
    );
}
