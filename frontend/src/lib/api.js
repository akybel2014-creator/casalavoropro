import axios from "axios";

export const api = axios.create({
    baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
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
