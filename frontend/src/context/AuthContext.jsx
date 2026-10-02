import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [azienda, setAzienda] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshMe = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data.user);
            setAzienda(data.azienda);
            return true;
        } catch (e) {
            if (e?.response?.status === 401) {
                try {
                    await api.post("/auth/refresh");
                    const { data } = await api.get("/auth/me");
                    setUser(data.user);
                    setAzienda(data.azienda);
                    return true;
                } catch {
                    setUser(null);
                    setAzienda(null);
                    return false;
                }
            }
            setUser(null);
            setAzienda(null);
            return false;
        }
    }, []);

    useEffect(() => {
        refreshMe().finally(() => setLoading(false));
    }, [refreshMe]);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        setUser(data.user);
        setAzienda(data.azienda);
        return data;
    }, []);

    const register = useCallback(async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        setUser(data.user);
        setAzienda(data.azienda);
        return data;
    }, []);

    const logout = useCallback(async () => {
        await api.post("/auth/logout").catch(() => {});
        setUser(null);
        setAzienda(null);
    }, []);

    return (
        <AuthCtx.Provider value={{ user, azienda, loading, login, register, logout, refreshMe }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const dashboardPathFor = (role) =>
    role === "azienda" ? "/dashboard/azienda" : role === "admin" ? "/dashboard/admin" : "/dashboard";
