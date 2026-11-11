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
            if (savedUrl && savedKey) {
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
            readEnv("NEXT_PUBLIC_SUPABASE_URL")
        );
    }
    if (!key) {
        key = cleanSupabaseKey(
            readEnv("VITE_SUPABASE_ANON_KEY") ||
            readEnv("SUPABASE_ANON_KEY") ||
            readEnv("VITE_SUPABASE_KEY") ||
            readEnv("SUPABASE_KEY") ||
            readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
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

export default supabase;
