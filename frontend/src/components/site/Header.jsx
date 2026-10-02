import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth, dashboardPathFor } from "@/context/AuthContext";

export const NAV_ITEMS = [
    { label: "Home", to: "/", id: "header-nav-home" },
    { label: "Come funziona", to: "/#come-funziona", id: "header-nav-come-funziona" },
    { label: "Categorie", to: "/#categorie", id: "header-nav-categorie" },
    { label: "Aziende", to: "/aziende", id: "header-nav-aziende" },
    { label: "Per le aziende", to: "/#per-le-aziende", id: "header-nav-per-aziende" },
    { label: "FAQ", to: "/#faq", id: "header-nav-faq" },
    { label: "Contatti", to: "/#contatti", id: "header-nav-contatti" },
];

export function scrollToSection(hash) {
    const id = hash.replace(/^#/, "");
    if (!id) return;
    if (window.__lenis) window.__lenis.scrollTo(`#${id}`, { offset: -84 });
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user || user.role === "admin") {
            setUnread(0);
            return undefined;
        }
        let alive = true;
        const fetchCount = async () => {
            try {
                const { data } = await api.get("/chat/unread-count");
                if (alive) setUnread(data.total);
            } catch {
                /* silenzioso: il poll riprova */
            }
        };
        fetchCount();
        const t = setInterval(fetchCount, 20000);
        window.addEventListener("chat-read", fetchCount);
        return () => {
            alive = false;
            clearInterval(t);
            window.removeEventListener("chat-read", fetchCount);
        };
    }, [user]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const onNavClick = (e, to) => {
        if (to.includes("#")) {
            e.preventDefault();
            const hash = to.split("#")[1];
            if (location.pathname !== "/") {
                navigate("/");
                setTimeout(() => scrollToSection(`#${hash}`), 450);
            } else {
                scrollToSection(`#${hash}`);
            }
        }
        setOpen(false);
    };

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
                scrolled
                    ? "bg-navy/85 backdrop-blur-xl border-white/10 shadow-2xl"
                    : "bg-navy/40 backdrop-blur-md border-white/5"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-[72px]">
                    <Link to="/" data-testid="header-logo" className="shrink-0">
                        <Logo />
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => (
                            <a
                                key={item.to}
                                href={item.to}
                                data-testid={item.id}
                                onClick={(e) => onNavClick(e, item.to)}
                                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden lg:flex items-center gap-2">
                        {user ? (
                            <>
                                <Button
                                    data-testid="header-dashboard-button"
                                    variant="ghost"
                                    className="text-slate-200 hover:text-white hover:bg-white/10"
                                    onClick={() => navigate(dashboardPathFor(user.role))}
                                >
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    {user.role === "azienda" ? "Area Aziende" : user.role === "admin" ? "Admin" : "Area Privati"}
                                    {unread > 0 && (
                                        <span data-testid="unread-badge-header" className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand text-white text-[11px] font-bold">
                                            {unread}
                                        </span>
                                    )}
                                </Button>
                                <Button
                                    data-testid="header-logout-button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Esci"
                                    className="text-slate-400 hover:text-brand hover:bg-white/10"
                                    onClick={() => logout()}
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    data-testid="header-login-button"
                                    variant="ghost"
                                    className="text-slate-200 hover:text-white hover:bg-white/10"
                                    onClick={() => navigate("/login")}
                                >
                                    Accedi
                                </Button>
                                <Button
                                    data-testid="header-register-button"
                                    className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25 rounded-full px-5"
                                    onClick={() => navigate("/registrati")}
                                >
                                    Registrati
                                </Button>
                            </>
                        )}
                    </div>

                    <button
                        data-testid="header-mobile-toggle"
                        className="lg:hidden p-2 text-slate-200 rounded-lg hover:bg-white/10"
                        aria-label="Apri menu"
                        onClick={() => setOpen((v) => !v)}
                    >
                        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {open && (
                <div className="lg:hidden border-t border-white/10 bg-navy/95 backdrop-blur-xl px-4 pb-6 pt-2">
                    <nav className="flex flex-col">
                        {NAV_ITEMS.map((item) => (
                            <a
                                key={item.to}
                                href={item.to}
                                data-testid={`${item.id}-mobile`}
                                onClick={(e) => onNavClick(e, item.to)}
                                className="px-3 py-3 text-base font-medium text-slate-200 hover:text-white border-b border-white/5"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                    <div className="mt-4 flex gap-3">
                        {user ? (
                            <Button
                                className="flex-1 rounded-full bg-brand hover:bg-brand-dark text-white"
                                onClick={() => navigate(dashboardPathFor(user.role))}
                            >
                                {user.role === "azienda" ? "Area Aziende" : user.role === "admin" ? "Admin" : "Area Privati"}
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10" onClick={() => navigate("/login")}>
                                    Accedi
                                </Button>
                                <Button className="flex-1 rounded-full bg-brand hover:bg-brand-dark text-white" onClick={() => navigate("/registrati")}>
                                    Registrati
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
