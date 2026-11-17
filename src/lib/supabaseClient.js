import { createClient } from "@supabase/supabase-js";

/**
 * Gestione dinamica del client Supabase per CasaLavoroPRO.
 * Supporta:
 * 1. Override locale da localStorage (utile per test immediati in preview)
 * 2. Variabili Vite: import.meta.env.VITE_SUPABASE_URL e import.meta.env.SUPABASE_URL
 * 3. Variabili server: process.env.VITE_SUPABASE_URL e process.env.SUPABASE_URL
 * 4. Caricamento dinamico tramite /api/config/supabase
 */

export const STORAGE_KEY_URL = "casalavoropro_supabase_url";
export const STORAGE_KEY_ANON = "casalavoropro_supabase_anon_key";

export function cleanSupabaseUrl(rawUrl) {
    if (!rawUrl) return "";
    let u = String(rawUrl).trim().replace(/^["']|["']$/g, "");
    if (!u) return "";

    // Se è stata incollata per errore la stringa di connessione PostgreSQL diretta o del pooler:
    if (u.startsWith("postgres://") || u.startsWith("postgresql://")) {
        const match = u.match(/postgres(?:ql)?:\/\/postgres\.([a-zA-Z0-9_-]+):/);
        if (match && match[1]) {
            return `https://${match[1]}.supabase.co`;
        }
        return "";
    }

    if (!u.startsWith("http://") && !u.startsWith("https://")) {
        u = "https://" + u;
    }
    return u.replace(/\/+$/, "");
}

export function cleanSupabaseKey(rawKey) {
    if (!rawKey) return "";
    let k = String(rawKey).trim().replace(/^["']|["']$/g, "");
    if (k.toLowerCase().startsWith("bearer ")) {
        k = k.slice(7).trim();
    }
    return k.replace(/[\r\n\s]+/g, "");
}

function readEnv(key) {
    try {
        if (typeof import.meta !== "undefined" && import.meta?.env?.[key]) {
            return String(import.meta.env[key]).trim();
        }
    } catch {
        /* ignora */
    }
    try {
        if (typeof process !== "undefined" && process?.env?.[key]) {
            return String(process.env[key]).trim();
        }
    } catch {
        /* ignora */
    }
    return "";
}

function getStoredOrEnvCredentials() {
    let url = "";
    let key = "";

    if (typeof window !== "undefined") {
        try {
            const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
            const savedKey = localStorage.getItem(STORAGE_KEY_ANON);
            if (savedUrl && (savedUrl.includes("jlcxnvxrartesjhmkvax") || savedUrl.includes("placeholder"))) {
                localStorage.removeItem(STORAGE_KEY_URL);
                localStorage.removeItem(STORAGE_KEY_ANON);
            } else if (savedUrl && savedKey) {
                url = cleanSupabaseUrl(savedUrl);
                key = cleanSupabaseKey(savedKey);
            }
        } catch {
            /* ignora */
        }
    }

    if (!url) {
        url = cleanSupabaseUrl(
            readEnv("VITE_SUPABASE_URL") ||
            readEnv("SUPABASE_URL") ||
            readEnv("VITE_PUBLIC_SUPABASE_URL") ||
            readEnv("NEXT_PUBLIC_SUPABASE_URL") ||
            "https://jlrtbcqdqlajcyjjlnhk.supabase.co"
        );
    }
    if (!key) {
        key = cleanSupabaseKey(
            readEnv("VITE_SUPABASE_ANON_KEY") ||
            readEnv("SUPABASE_ANON_KEY") ||
            readEnv("VITE_SUPABASE_KEY") ||
            readEnv("SUPABASE_KEY") ||
            readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscnRiY3FkcWxhamN5ampsbmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NTAzNDYsImV4cCI6MjExMDAyNjM0Nn0.bPrG8NrlW9jbwed6HOWTUBkturWgXgzMiF4v_iub2Gg"
        );
    }

    return { url, key };
}

let { url: activeUrl, key: activeKey } = getStoredOrEnvCredentials();

export function isSupabaseConfiguredNow() {
    return Boolean(
        activeUrl &&
        activeKey &&
        !activeUrl.includes("placeholder-project") &&
        activeUrl.startsWith("https://")
    );
}

export let isSupabaseConfigured = isSupabaseConfiguredNow();

export function safeCreateClient(url, key) {
    const fallbackUrl = "https://placeholder-project.supabase.co";
    const fallbackKey = "placeholder-anon-key";
    try {
        const targetUrl = cleanSupabaseUrl(url) || fallbackUrl;
        const targetKey = cleanSupabaseKey(key) || fallbackKey;
        // Valida la sintassi dell'URL per prevenire TypeError all'avvio
        new URL(targetUrl);
        return createClient(targetUrl, targetKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
        });
    } catch (e) {
        console.warn("[CasaLavoroPRO] Inizializzazione sicura Supabase con fallback dummy:", e);
        try {
            return createClient(fallbackUrl, fallbackKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            });
        } catch {
            return {
                from: () => ({
                    select: () => ({
                        order: () => Promise.resolve({ data: [], error: null }),
                        eq: () => ({
                            order: () => ({
                                limit: () => Promise.resolve({ data: [], error: null }),
                            }),
                        }),
                    }),
                }),
                auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
            };
        }
    }
}

export let supabase = safeCreateClient(activeUrl, activeKey);

/**
 * Consente di riconfigurare il client a runtime pulendo eventuali spazi/virgolette
 */
export function configureSupabase(newUrl, newKey, saveToStorage = true) {
    const cleanedUrl = cleanSupabaseUrl(newUrl);
    const cleanedKey = cleanSupabaseKey(newKey);
    if (!cleanedUrl || !cleanedKey) return false;

    activeUrl = cleanedUrl;
    activeKey = cleanedKey;
    isSupabaseConfigured = isSupabaseConfiguredNow();

    if (saveToStorage && typeof window !== "undefined") {
        try {
            localStorage.setItem(STORAGE_KEY_URL, activeUrl);
            localStorage.setItem(STORAGE_KEY_ANON, activeKey);
        } catch {
            /* ignora */
        }
    }

    supabase = safeCreateClient(activeUrl, activeKey);

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("supabase-configured", { detail: { url: activeUrl } }));
    }
    return true;
}

export function resetSupabaseCredentials() {
    if (typeof window !== "undefined") {
        try {
            localStorage.removeItem(STORAGE_KEY_URL);
            localStorage.removeItem(STORAGE_KEY_ANON);
        } catch {
            /* ignora */
        }
    }
    const envCreds = getStoredOrEnvCredentials();
    activeUrl = envCreds.url;
    activeKey = envCreds.key;
    isSupabaseConfigured = isSupabaseConfiguredNow();
    supabase = safeCreateClient(activeUrl, activeKey);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("supabase-configured", { detail: { url: activeUrl } }));
    }
}

/**
 * Tenta di sincronizzare le credenziali runtime dal server se nel bundle frontend sono assenti
 */
export async function ensureSupabaseConfig() {
    if (isSupabaseConfiguredNow()) return true;

    try {
        const res = await fetch("/api/config/supabase");
        if (res.ok) {
            const data = await res.json();
            if (data.configured && data.url && data.anonKey) {
                configureSupabase(data.url, data.anonKey, false);
                return true;
            }
        }
    } catch {
        /* ignora fallback */
    }
    return isSupabaseConfiguredNow();
}

export function normalizeAziendaFlags(row = {}) {
    const hasOwner = Boolean(row.owner_id);
    const isClaimed = row.is_claimed !== undefined && row.is_claimed !== null ? Boolean(row.is_claimed) : hasOwner;
    const isVerified =
        row.is_verified !== undefined && row.is_verified !== null
            ? Boolean(row.is_verified)
            : Boolean(row.verificata ?? row.verified);
    const isPremium =
        row.is_premium !== undefined && row.is_premium !== null
            ? Boolean(row.is_premium)
            : (row.piano || row.plan) === "pro";

    return {
        is_claimed: isClaimed,
        is_verified: isVerified,
        is_premium: isPremium,
        unclaimed: hasOwner ? false : !isClaimed,
        verified: hasOwner ? Boolean(row.is_verified || row.verificata || row.verified) : isVerified,
        plan: isPremium ? "pro" : row.piano || row.plan || "free",
    };
}

export function createArtisanDraft(input = {}) {
    const categorie = Array.isArray(input.categorie)
        ? input.categorie.filter(Boolean)
        : input.categoria
        ? [String(input.categoria).trim()]
        : ["Idraulico"];
    const zone = Array.isArray(input.zone)
        ? input.zone.filter(Boolean)
        : input.zona
        ? [String(input.zona).trim()]
        : [];

    const isClaimed = Boolean(input.is_claimed ?? false);
    const isVerified = Boolean(input.is_verified ?? false);
    const isPremium = Boolean(input.is_premium ?? false);

    return {
        nome: String(input.nome || "").trim(),
        categorie,
        zone,
        piva: input.piva ? String(input.piva).trim() : null,
        descrizione: input.descrizione ? String(input.descrizione).trim() : null,
        telefono: input.telefono ? String(input.telefono).trim() : null,
        email: input.email ? String(input.email).trim().toLowerCase() : null,
        indirizzo: input.indirizzo ? String(input.indirizzo).trim() : null,
        logo_url: input.logo_url || null,
        foto: Array.isArray(input.foto) ? input.foto : [],
        verificata: isVerified,
        piano: isPremium ? "pro" : "free",
        emergenze: Boolean(input.emergenze ?? false),
        rating: Number(input.rating ?? 0),
        recensioni_count: Number(input.recensioni_count ?? 0),
        is_claimed: isClaimed,
        is_verified: isVerified,
        is_premium: isPremium,
        ...(input.owner_id ? { owner_id: input.owner_id } : {}),
        ...(input.created_at ? { created_at: input.created_at } : {}),
    };
}

export async function syncArtisanToSupabase(input, existingId = null) {
    const payload = createArtisanDraft(input);
    const sanitized = {
        ...payload,
        is_claimed: Boolean(payload.is_claimed),
        is_verified: Boolean(payload.is_verified),
        is_premium: Boolean(payload.is_premium),
    };

    if (existingId) {
        const { data, error } = await supabase
            .from("aziende")
            .update(sanitized)
            .eq("id", existingId)
            .select()
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    const { data, error } = await supabase
        .from("aziende")
        .insert(sanitized)
        .select()
        .maybeSingle();
    if (error) throw error;
    return data;
}

export default supabase;
