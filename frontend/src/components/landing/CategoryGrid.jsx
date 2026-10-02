import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Flame, Zap, Hammer, Paintbrush, Trees, Layers, LayoutGrid, ArrowUpRight } from "lucide-react";

export const CATEGORIES = [
    { name: "Idraulica", count: "1.420 aziende", icon: Wrench, id: "category-card-idraulica" },
    { name: "Termoidraulica", count: "980 aziende", icon: Flame, id: "category-card-termoidraulica" },
    { name: "Elettricità", count: "1.850 aziende", icon: Zap, id: "category-card-elettricita" },
    { name: "Edilizia", count: "3.100 aziende", icon: Hammer, id: "category-card-edilizia" },
    { name: "Imbiancatura", count: "1.240 aziende", icon: Paintbrush, id: "category-card-imbiancatura" },
    { name: "Giardinaggio", count: "890 aziende", icon: Trees, id: "category-card-giardinaggio" },
    { name: "Pavimenti", count: "1.050 aziende", icon: Layers, id: "category-card-pavimenti" },
    { name: "Altri Servizi", count: "2.400 aziende", icon: LayoutGrid, id: "category-card-altri-servizi" },
];

export default function CategoryGrid() {
    return (
        <section id="categorie" className="relative bg-navy py-16 sm:py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.15 }}
                        transition={{ duration: 0.6 }}
                    >
                        <p className="text-xs uppercase tracking-[0.24em] font-semibold text-brand">Categorie</p>
                        <h2 className="mt-3 font-display font-black tracking-tight text-2xl sm:text-3xl lg:text-4xl text-white">
                            Ogni lavoro ha il suo professionista
                        </h2>
                    </motion.div>
                    <Link to="/aziende" className="text-sm font-semibold text-brand hover:text-white transition-colors inline-flex items-center gap-1.5">
                        Vedi tutte le aziende <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {CATEGORIES.map((c, i) => (
                        <motion.div
                            key={c.name}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.55, delay: (i % 4) * 0.08 }}
                        >
                            <Link
                                to={`/aziende?categoria=${encodeURIComponent(c.name)}`}
                                data-testid={c.id}
                                className="group flex flex-col items-start h-full rounded-2xl border border-white/10 bg-navy-700/60 p-5 sm:p-6 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-xl hover:shadow-brand/10 transition-all duration-300"
                            >
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand group-hover:bg-brand group-hover:text-navy transition-all duration-300">
                                    <c.icon className="h-6 w-6" />
                                </span>
                                <h3 className="mt-4 font-display font-bold text-white">{c.name}</h3>
                                <p className="mt-1 text-xs sm:text-sm text-slate-400">{c.count}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
