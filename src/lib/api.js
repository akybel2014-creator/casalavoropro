import axios from "axios";

const TOKEN_KEY = "clpro_access_token";
const REFRESH_KEY = "clpro_refresh_token";

export function setStoredTokens(accessToken, refreshToken) {
    try {
        if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    } catch {
        // Ignore storage errors in restricted environments
    }
}

export function clearStoredTokens() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
    } catch {
        // Ignore storage errors
    }
}

export function getStoredRefreshToken() {
    try {
        return localStorage.getItem(REFRESH_KEY) || "";
    } catch {
        return "";
    }
}

export const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // Ignore storage errors
    }
    return config;
});

export function formatApiError(e) {
    const detail = e?.response?.data?.detail;
    if (detail == null) return e?.message || "Qualcosa è andato storto. Riprova.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((x) => (x && typeof x.msg === "string" ? x.msg : JSON.stringify(x)))
            .filter(Boolean)
            .join(" ");
    }
    if (typeof detail?.msg === "string") return detail.msg;
    return String(detail);
}
