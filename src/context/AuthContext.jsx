import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearStoredTokens } from "@/lib/api";

const AuthCtx = createContext(null);

export const useAuth = () => useContext(AuthCtx);

function normalizeAziendaRow(row) {
    if (!row) return null;
    return {
        ...row,
        logo: row.logo_url || row.logo || null,
        foto: Array.isArray(row.foto) ? row.foto : [],
        categorie: Array.isArray(row.categorie) ? row.categorie : [],
        zone: Array.isArray(row.zone) ? row.zone : [],
        verified: row.verificata !== undefined ? Boolean(row.verificata) : Boolean(row.verified),
        plan: row.piano || row.plan || "free",
        recensioni: Number(row.recensioni_count ?? row.recensioni ?? 0),
        rating: Number(row.rating) || 0,
    };
}

function translateAuthError(err) {
    const msg = String(err?.message || err || "");
    const lower = msg.toLowerCase();
    if (lower.includes("invalid login credentials")) return "Email o password non validi.";
    if (lower.includes("email not confirmed")) return "Email non ancora confermata. Controlla la tua posta elettronica.";
    if (lower.includes("already registered") || lower.includes("user already exists")) {
        return "Questa email è già registrata. Prova ad accedere.";
    }
    if (lower.includes("password should be at least")) return "La password deve contenere almeno 8 caratteri.";
    if (lower.includes("rate limit") || lower.includes("too many requests")) {
        return "Troppi tentativi ravvicinati. Attendi qualche minuto e riprova.";
    }
    if (lower.includes("unable to validate email address") || lower.includes("invalid format")) {
        return "Inserisci un indirizzo email valido.";
    }
    return msg || "Si è verificato un errore durante l'autenticazione.";
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [azienda, setAzienda] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUserAndAzienda = useCallback(async (authUser) => {
        if (!authUser) {
            setUser(null);
            setAzienda(null);
            return { user: null, azienda: null };
        }

        let profile = null;
        try {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .maybeSingle();
            profile = data || null;
        } catch {
            /* fallback sui metadati utente */
        }

        const meta = authUser.user_metadata || {};
        const role = profile?.role || meta.role || "privato";
        const name = profile?.name || meta.name || (authUser.email ? authUser.email.split("@")[0] : "Utente");

        const userObj = {
            id: authUser.id,
            email: profile?.email || authUser.email,
            name,
            role,
            telefono: profile?.telefono || "",
            avatar_url: profile?.avatar_url || null,
        };

        let aziendaObj = null;
        if (role === "azienda") {
            try {
                const { data: azData } = await supabase
                    .from("aziende")
                    .select("*")
                    .eq("owner_id", authUser.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                aziendaObj = normalizeAziendaRow(azData);
            } catch {
                /* ignora */
            }
        }

        setUser(userObj);
        setAzienda(aziendaObj);
        return { user: userObj, azienda: aziendaObj };
    }, []);

    const refreshMe = useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session?.user) {
                setUser(null);
                setAzienda(null);
                return false;
            }
            await loadUserAndAzienda(session.user);
            return true;
        } catch {
            setUser(null);
            setAzienda(null);
            return false;
        } finally {
            setLoading(false);
        }
    }, [loadUserAndAzienda]);

    useEffect(() => {
        refreshMe();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUserAndAzienda(session.user).finally(() => setLoading(false));
            } else {
                setUser(null);
                setAzienda(null);
                setLoading(false);
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, [refreshMe, loadUserAndAzienda]);

    const login = useCallback(async (email, password) => {
        const cleanEmail = String(email || "").trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
        });
        if (error) {
            throw new Error(translateAuthError(error));
        }
        return await loadUserAndAzienda(data.user);
    }, [loadUserAndAzienda]);

    const register = useCallback(async (payload) => {
        const cleanEmail = String(payload?.email || "").trim().toLowerCase();
        const cleanName = String(payload?.name || "").trim();
        const role = payload?.ruolo === "azienda" ? "azienda" : "privato";
        const azIn = payload?.azienda || null;

        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password: payload.password,
            options: {
                data: {
                    name: cleanName,
                    role,
                    azienda: role === "azienda" ? {
                        nome: (azIn?.nome || cleanName).trim(),
                        categorie: Array.isArray(azIn?.categorie) && azIn.categorie.length > 0 ? azIn.categorie : ["Altri Servizi"],
                        zone: Array.isArray(azIn?.zone) ? azIn.zone : [],
                        piva: azIn?.piva || null,
                        descrizione: azIn?.descrizione || null,
                    } : null,
                },
            },
        });

        if (error) {
            throw new Error(translateAuthError(error));
        }

        // In Supabase, se la conferma email è attiva ed è già registrato, identities può essere vuoto
        if (data?.user?.identities && data.user.identities.length === 0) {
            throw new Error("Questa email è già registrata. Prova ad accedere.");
        }

        const authUser = data?.user;
        const hasSession = Boolean(data?.session);

        if (!authUser) {
            throw new Error("Registrazione non riuscita. Riprova.");
        }

        if (hasSession) {
            let result = await loadUserAndAzienda(authUser);

            // Fallback di sicurezza: se per qualsiasi motivo il trigger non avesse ancora creato l'azienda, creala ora
            if (role === "azienda" && !result.azienda) {
                try {
                    const { data: insertedAz } = await supabase
                        .from("aziende")
                        .insert({
                            owner_id: authUser.id,
                            nome: (azIn?.nome || cleanName || "Nuova Azienda").trim(),
                            categorie: Array.isArray(azIn?.categorie) && azIn.categorie.length > 0 ? azIn.categorie : ["Altri Servizi"],
                            zone: Array.isArray(azIn?.zone) ? azIn.zone : [],
                            piva: azIn?.piva || null,
                            descrizione: azIn?.descrizione || null,
                            email: cleanEmail,
                            verificata: true,
                            rating: 5.0,
                            recensioni_count: 0,
                            piano: "free",
                        })
                        .select()
                        .maybeSingle();

                    if (insertedAz) {
                        const normAz = normalizeAziendaRow(insertedAz);
                        setAzienda(normAz);
                        result = { ...result, azienda: normAz };
                    }
                } catch {
                    /* ignora */
                }
            }

            return { ...result, needsEmailConfirmation: false };
        }

        // Se la conferma email su Supabase è ancora attiva, il trigger SQL ha comunque creato profile + azienda
        const optimisticUser = {
            id: authUser.id,
            email: cleanEmail,
            name: cleanName,
            role,
        };
        const optimisticAzienda = role === "azienda" ? normalizeAziendaRow({
            id: `pending-${authUser.id}`,
            owner_id: authUser.id,
            nome: (azIn?.nome || cleanName || "Nuova Azienda").trim(),
            categorie: Array.isArray(azIn?.categorie) && azIn.categorie.length > 0 ? azIn.categorie : ["Altri Servizi"],
            zone: Array.isArray(azIn?.zone) ? azIn.zone : [],
            piva: azIn?.piva || null,
            descrizione: azIn?.descrizione || null,
            email: cleanEmail,
            verificata: true,
            rating: 5.0,
            recensioni_count: 0,
            piano: "free",
        }) : null;

        return {
            user: optimisticUser,
            azienda: optimisticAzienda,
            needsEmailConfirmation: true,
        };
    }, [loadUserAndAzienda]);

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
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
    role === "azienda" ? "/dashboard" : "/area-privato";
