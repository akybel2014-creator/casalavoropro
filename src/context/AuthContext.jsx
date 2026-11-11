import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setStoredTokens, clearStoredTokens, getStoredRefreshToken } from "@/lib/api";

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [azienda, setAzienda] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshMe = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data?.user || null);
            setAzienda(data?.azienda || null);
            return true;
        } catch (e) {
            // Per un visitatore anonimo lo status 401 Unauthorized è il normale stato non autenticato:
            // non lanciare eccezioni, non propagare errori all'Error Boundary.
            const status = e?.response?.status;
            if (status === 401) {
                const rt = getStoredRefreshToken();
                // Prova il refresh SOLO se esiste un token di refresh memorizzato nel browser
                if (rt) {
                    try {
                        const res = await api.post("/auth/refresh", { refresh_token: rt });
                        if (res.data?.access_token) {
                            setStoredTokens(res.data.access_token, res.data.refresh_token);
                            const { data } = await api.get("/auth/me");
                            setUser(data?.user || null);
                            setAzienda(data?.azienda || null);
                            return true;
                        }
                    } catch {
                        clearStoredTokens();
                    }
                }
            }
            // Imposta lo stato disconnesso senza eccezioni
            setUser(null);
            setAzienda(null);
            return false;
        } finally {
            // Conclude sempre il caricamento
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshMe().catch(() => {
            setUser(null);
            setAzienda(null);
            setLoading(false);
        });
    }, [refreshMe]);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        if (data?.access_token) {
            setStoredTokens(data.access_token, data.refresh_token);
        }
        setUser(data?.user || null);
        setAzienda(data?.azienda || null);
        return data;
    }, []);

    const register = useCallback(async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        if (data?.access_token) {
            setStoredTokens(data.access_token, data.refresh_token);
        }
        setUser(data?.user || null);
        setAzienda(data?.azienda || null);
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            /* ignora */
        } finally {
            clearStoredTokens();
            setUser(null);
            setAzienda(null);
        }
    }, []);

    return (
        <AuthCtx.Provider value={{ user, azienda, loading, login, register, logout, refreshMe }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const dashboardPathFor = (role) =>
    role === "azienda" ? "/dashboard" : role === "admin" ? "/admin" : "/area-privato";
