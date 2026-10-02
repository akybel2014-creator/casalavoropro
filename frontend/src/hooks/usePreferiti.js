import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function usePreferiti() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ids, setIds] = useState(new Set());
    const isPrivato = user?.role === "privato";

    useEffect(() => {
        if (!isPrivato) {
            setIds(new Set());
            return;
        }
        api.get("/preferiti/ids").then(({ data }) => setIds(new Set(data))).catch(() => {});
    }, [isPrivato]);

    const isPreferita = useCallback((id) => ids.has(id), [ids]);

    const toggle = useCallback(async (aziendaId, nome) => {
        if (!user) {
            toast.info("Accedi come privato per salvare le aziende preferite");
            navigate("/login");
            return;
        }
        if (!isPrivato) {
            toast.info("Solo gli account privati possono salvare aziende preferite");
            return;
        }
        const wasSaved = ids.has(aziendaId);
        setIds((prev) => {
            const next = new Set(prev);
            wasSaved ? next.delete(aziendaId) : next.add(aziendaId);
            return next;
        });
        try {
            if (wasSaved) {
                await api.delete(`/preferiti/${aziendaId}`);
                toast.success(`${nome || "Azienda"} rimossa dalle preferite`);
            } else {
                await api.put(`/preferiti/${aziendaId}`);
                toast.success(`${nome || "Azienda"} salvata tra le preferite`);
            }
        } catch (e) {
            setIds((prev) => {
                const next = new Set(prev);
                wasSaved ? next.add(aziendaId) : next.delete(aziendaId);
                return next;
            });
            toast.error(formatApiError(e));
        }
    }, [user, isPrivato, ids, navigate]);

    return { isPreferita, toggle, canSave: !user || isPrivato };
}
