import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Siren, Moon, CalendarCheck, PhoneCall, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HINTS = [
    { icon: Siren, label: "Interventi d'emergenza" },
    { icon: CalendarCheck, label: "Disponibili nel weekend" },
    { icon: Moon, label: "Disponibili di notte" },
];

export default function Emergenze() {
    const navigate = useNavigate();
    return (
        <section id="emergenze" className="relative overflow-hidden bg-navy py-16 sm:py-24 lg:py-32">
            <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden="true" />
            <div className="absolute top-1/3 left-1/4 h-80 w-80 rounded-full bg-brand/20 blur-[140px]" aria-hidden="true" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Emergenze 24/7</p>
                    <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white leading-tight">
                        Guasto improvviso? Le nostre aziende intervengono <span className="text-brand">subito</span>, anche di sabato notte.
                    </h2>
                    <p className="mt-4 text-slate-300 leading-relaxed max-w-lg">
                        Molte aziende del network dichiarano la disponibilità ad intervenire in emergenza:
                        weekend, ore notturne e festivi. Cerca chi è operativo adesso e chiama il numero dedicato.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2.5">
                        {HINTS.map((h) => (
                            <span key={h.label} className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
                                <h.icon className="h-4 w-4" /> {h.label}
                            </span>
                        ))}
                    </div>
                    <Button
                        data-testid="emergenze-cta-button"
                        onClick={() => navigate("/aziende?emergenze=true")}
                        className="mt-8 rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25 font-semibold px-6"
                    >
                        Trova aziende per emergenze <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="relative"
                >
                    <div className="rounded-3xl border border-white/10 bg-navy-700/80 p-7 sm:p-9 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                                <Siren className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="font-display font-bold text-white text-lg">Servizio attivo 24 ore su 24</h3>
                                <p className="text-xs text-slate-400">Aziende verificate che dichiarano la reperibilità</p>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3.5">
                            {[
                                { icon: CalendarCheck, t: "Sabato e domenica", d: "Guasti weekend senza sovrapprezzi nascosti" },
                                { icon: Moon, t: "Notturno", d: "Interventi nelle ore 22:00 – 6:00" },
                                { icon: PhoneCall, t: "Numero diretto", d: "Chiami l'azienda, senza attese" },
                            ].map((x) => (
                                <div key={x.t} className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-navy/60 p-4">
                                    <x.icon className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">{x.t}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{x.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-6 text-xs text-slate-500">
                            Le aziende dichiarano autonomamente la reperibilità: verifica sempre la badge "Azienda Verificata".
                        </p>
                    </div>
                    <div className="floaty absolute -top-5 -right-3 sm:-right-6 rounded-2xl bg-white/95 px-4 py-3 shadow-2xl border border-white/60">
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <p className="text-xs font-semibold text-slate-800">Aziende reperibili adesso</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
