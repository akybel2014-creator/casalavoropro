import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase per CasaLavoroPRO.
 * Supporta la lettura delle credenziali sia da import.meta.env (Vite)
 * che da process.env (Node / ambienti container Render), con entrambi i prefissi.
 */
const getEnvVar = (viteKey, processKey) => {
    try {
        if (typeof import.meta !== "undefined" && import.meta?.env) {
            if (import.meta.env[viteKey]) return import.meta.env[viteKey];
            if (import.meta.env[processKey]) return import.meta.env[processKey];
        }
    } catch {
        /* ignora se import.meta non è accessibile */
    }
    try {
        if (typeof process !== "undefined" && process?.env) {
            if (process.env[viteKey]) return process.env[viteKey];
            if (process.env[processKey]) return process.env[processKey];
        }
    } catch {
        /* ignora se process non è accessibile */
    }
    return "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL", "SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && typeof window !== "undefined") {
    console.warn(
        "[CasaLavoroPRO] Supabase non è ancora configurato con credenziali reali. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nell'ambiente."
    );
}

export const supabase = createClient(
    supabaseUrl || "https://placeholder-project.supabase.co",
    supabaseAnonKey || "placeholder-anon-key",
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    }
);

export default supabase;
