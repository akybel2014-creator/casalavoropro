import { useEffect, useRef, useState } from "react";

/**
 * Monta i figli solo quando la sezione sta per entrare nel viewport (IntersectionObserver).
 * Alleggerisce il primo caricamento (soprattutto mobile): animazioni, immagini e chiamate API
 * delle sezioni sotto la piega partono solo quando servono. Riserva lo spazio con minHeight
 * per evitare salti di layout e per non far scattare tutti gli osservatori insieme.
 */
export default function LazySection({ children, minHeight = 420, rootMargin = "500px" }) {
    const ref = useRef(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === "undefined") {
            setShow(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setShow(true);
                    io.disconnect();
                }
            },
            { rootMargin }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [rootMargin]);

    return (
        <div ref={ref} style={show ? undefined : { minHeight }}>
            {show ? children : null}
        </div>
    );
}
