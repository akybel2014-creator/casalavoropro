import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
    return (
        <footer id="contatti" className="border-t border-white/10 bg-navy/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-5">
                        <Link to="/" data-testid="footer-logo">
                            <Logo />
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-sm">
                            Il marketplace che unisce i privati alle aziende qualificate del settore casa.
                            Preventivi gratuiti, aziende verificate, un solo intermediario.
                        </p>
                        <div className="mt-6 flex items-center gap-3">
                            <a
                                data-testid="footer-social-facebook"
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="p-2.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:border-brand hover:text-brand transition-colors"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                data-testid="footer-social-instagram"
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="p-2.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:border-brand hover:text-brand transition-colors"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                data-testid="footer-social-linkedin"
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className="p-2.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:border-brand hover:text-brand transition-colors"
                            >
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <h4 className="font-display font-semibold text-white">Navigazione</h4>
                        <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
                            <li><Link className="hover:text-brand transition-colors" to="/#come-funziona">Come funziona</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/#categorie">Categorie</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/aziende">Directory aziende</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/#per-le-aziende">Per le aziende</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/#faq">FAQ</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4">
                        <h4 className="font-display font-semibold text-white">Contatti</h4>
                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            <li className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-brand" /> info@casalavoripro.it
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone className="h-4 w-4 text-brand" /> +39 02 0000 0000
                            </li>
                            <li className="flex items-center gap-2.5">
                                <MapPin className="h-4 w-4 text-brand" /> Via dei Lavori 1, 20100 Milano
                            </li>
                        </ul>
                        <p className="mt-5 text-xs text-slate-500">
                            Lun–Ven 9:00–18:00 · Assistenza dedicata per privati e aziende
                        </p>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">© 2026 CasaLavoriPRO. Tutti i diritti riservati.</p>
                    <p className="text-xs text-slate-500">Privacy Policy · Termini di servizio · Cookie</p>
                </div>
            </div>
        </footer>
    );
}
