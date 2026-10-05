import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import Logo from "@/components/Logo";

const SOCIALS = [
    { id: "facebook", label: "Facebook", href: process.env.REACT_APP_SOCIAL_FACEBOOK || "https://www.facebook.com/casalavoropro", Icon: Facebook },
    { id: "instagram", label: "Instagram", href: process.env.REACT_APP_SOCIAL_INSTAGRAM || "https://www.instagram.com/casalavoropro", Icon: Instagram },
    { id: "linkedin", label: "LinkedIn", href: process.env.REACT_APP_SOCIAL_LINKEDIN || "https://www.linkedin.com/company/casalavoropro", Icon: Linkedin },
    { id: "tiktok", label: "TikTok", href: process.env.REACT_APP_SOCIAL_TIKTOK || "https://www.tiktok.com/@casalavoropro", Icon: TikTokIcon },
];

function TikTokIcon({ className = "" }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
            <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.9a2.55 2.55 0 1 1-2.55-2.55c.26 0 .51.04.74.11V9.2a5.86 5.86 0 0 0-.74-.05A5.75 5.75 0 1 0 15.54 15V8.9a7.46 7.46 0 0 0 4.36 1.4V7.1a4.29 4.29 0 0 1-3.3-1.28z" />
        </svg>
    );
}

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
                            {SOCIALS.map(({ id, label, href, Icon }) => (
                                <a
                                    key={id}
                                    data-testid={`footer-social-${id}`}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="p-2.5 rounded-full border border-white/10 text-slate-300 hover:border-brand hover:text-brand transition-colors"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <h4 className="font-display font-semibold text-white">Navigazione</h4>
                        <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
                            <li><Link className="hover:text-brand transition-colors" to="/#come-funziona">Come funziona</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/#categorie">Categorie</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/noleggio">Noleggio Attrezzi</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/mercatino">Mercatino Usato</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/aziende">Directory aziende</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/#per-le-aziende">Per le aziende</Link></li>
                            <li><Link className="hover:text-brand transition-colors" to="/#faq">FAQ</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4">
                        <h4 className="font-display font-semibold text-white">Contatti</h4>
                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            <li className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-brand" /> info@casalavoropro.com
                            </li>
                        </ul>
                        <p className="mt-5 text-xs text-slate-500">
                            Lun–Ven 9:00–18:00 · Assistenza dedicata per privati e aziende
                        </p>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">© 2026 CasaLavoroPRO. Tutti i diritti riservati.</p>
                    <p className="text-xs text-slate-500">Privacy Policy · Termini di servizio · Cookie</p>
                </div>
            </div>
        </footer>
    );
}
