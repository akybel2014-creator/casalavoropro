import { Component, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Home from "@/pages/Home";
import Aziende from "@/pages/Aziende";
import AziendaDettaglio from "@/pages/AziendaDettaglio";
import Login from "@/pages/Login";
import Registrati from "@/pages/Registrati";
import NuovaRichiesta from "@/pages/NuovaRichiesta";
import DashboardPrivato from "@/pages/DashboardPrivato";
import DashboardAzienda from "@/pages/DashboardAzienda";
import DashboardAdmin from "@/pages/DashboardAdmin";
import { PaymentSuccess, PaymentCancel } from "@/pages/PaymentResult";
import ResetPassword from "@/pages/ResetPassword";
import "@/App.css";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-navy flex items-center justify-center p-8 text-center">
                    <div>
                        <h1 className="font-display font-black text-2xl text-white">Qualcosa è andato storto</h1>
                        <p className="mt-2 text-slate-400 text-sm">Ricarica la pagina per continuare.</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function SmoothScroll() {
    useEffect(() => {
        let lenis;
        let raf;
        import("lenis").then(({ default: Lenis }) => {
            lenis = new Lenis({ duration: 1.15, smoothWheel: true });
            window.__lenis = lenis;
            const loop = (t) => {
                lenis.raf(t);
                raf = requestAnimationFrame(loop);
            };
            raf = requestAnimationFrame(loop);
        });
        return () => {
            if (raf) cancelAnimationFrame(raf);
            if (lenis) lenis.destroy();
            window.__lenis = null;
        };
    }, []);
    return null;
}

function PublicLayout() {
    return (
        <div className="min-h-screen bg-navy">
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

function ProtectedRoute({ roles, children }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login", { state: { from: location.pathname }, replace: true });
        }
    }, [loading, user, navigate, location.pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <p className="text-slate-400 text-sm">Caricamento…</p>
            </div>
        );
    }
    if (!user) return null;
    if (roles && !roles.includes(user.role)) {
        const path = user.role === "azienda" ? "/dashboard/azienda" : user.role === "admin" ? "/dashboard/admin" : "/dashboard";
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center p-8 text-center">
                <div>
                    <p className="text-white font-semibold">Questa area è riservata a un altro tipo di account.</p>
                    <button onClick={() => navigate(path)} className="mt-4 text-brand font-semibold hover:underline">Vai alla tua area</button>
                </div>
            </div>
        );
    }
    return children;
}

function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <p className="font-display font-black text-7xl text-stroke">404</p>
            <h1 className="mt-4 font-display font-bold text-2xl text-white">Pagina non trovata</h1>
            <p className="mt-2 text-sm text-slate-400">Il link che hai seguito non esiste o è stato spostato.</p>
            <a href="/" className="mt-6 text-brand font-semibold hover:underline">Torna alla home</a>
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <SmoothScroll />
                    <ScrollToTop />
                    <Toaster theme="dark" position="top-center" richColors />
                    <Routes>
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/aziende" element={<Aziende />} />
                            <Route path="/aziende/:id" element={<AziendaDettaglio />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                        <Route path="/login" element={<Login />} />
                        <Route path="/registrati" element={<Registrati />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/nuova-richiesta" element={<ProtectedRoute roles={["privato"]}><NuovaRichiesta /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute roles={["privato"]}><DashboardPrivato /></ProtectedRoute>} />
                        <Route path="/dashboard/azienda" element={<ProtectedRoute roles={["azienda"]}><DashboardAzienda /></ProtectedRoute>} />
                        <Route path="/dashboard/admin" element={<ProtectedRoute roles={["admin"]}><DashboardAdmin /></ProtectedRoute>} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/cancel" element={<PaymentCancel />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
