import { Component, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth, dashboardPathFor } from "@/context/AuthContext";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Home from "@/pages/Home";
import Aziende from "@/pages/Aziende";
import AziendaDettaglio from "@/pages/AziendaDettaglio";
import Annunci from "@/pages/Annunci";
import Prezzi from "@/pages/Prezzi";
import AnnuncioDettaglio from "@/pages/AnnuncioDettaglio";
import Login from "@/pages/Login";
import Registrati from "@/pages/Registrati";
import NuovaRichiesta from "@/pages/NuovaRichiesta";
import DashboardPrivato from "@/pages/DashboardPrivato";
import DashboardAzienda from "@/pages/DashboardAzienda";
import AnalisiEnergetica from "@/pages/AnalisiEnergetica";
import DashboardAdmin from "@/pages/DashboardAdmin";
import { PaymentSuccess, PaymentCancel } from "@/pages/PaymentResult";
import ResetPassword from "@/pages/ResetPassword";
import ReportPubblico from "@/pages/ReportPubblico";
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

function RedirectWithMessage({ to, message }) {
    useEffect(() => {
        if (message) toast.error(message);
    }, [message]);
    return <Navigate to={to} replace />;
}

function ProtectedRoute({ roles, children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <p className="text-slate-400 text-sm">Caricamento…</p>
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    if (roles && !roles.includes(user.role)) {
        if (roles.includes("admin")) {
            return <RedirectWithMessage to="/" message="Accesso negato: area riservata all'amministratore." />;
        }
        return <Navigate to={dashboardPathFor(user.role)} replace />;
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

function DashLayout({ children }) {
    return (
        <div className="min-h-screen bg-navy">
            <Header />
            {children}
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
                            <Route path="/noleggio" element={<Annunci tipo="noleggio" />} />
                            <Route path="/mercatino" element={<Annunci tipo="usato" />} />
                            <Route path="/prezzi" element={<Prezzi />} />
                            <Route path="/annunci/:id" element={<AnnuncioDettaglio />} />
                            <Route path="/r/:token" element={<ReportPubblico />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                        <Route path="/login" element={<Login />} />
                        <Route path="/registrati" element={<Registrati />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/nuova-richiesta" element={<ProtectedRoute roles={["privato"]}><DashLayout><NuovaRichiesta /></DashLayout></ProtectedRoute>} />
                        <Route path="/area-privato" element={<ProtectedRoute roles={["privato"]}><DashLayout><DashboardPrivato /></DashLayout></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute roles={["azienda"]}><DashLayout><DashboardAzienda /></DashLayout></ProtectedRoute>} />
                        <Route path="/dashboard/azienda" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/analisi-energetica" element={<ProtectedRoute roles={["privato", "azienda"]}><DashLayout><AnalisiEnergetica /></DashLayout></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><DashLayout><DashboardAdmin /></DashLayout></ProtectedRoute>} />
                        <Route path="/dashboard/admin" element={<Navigate to="/admin" replace />} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/cancel" element={<PaymentCancel />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
