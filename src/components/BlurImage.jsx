import { useState } from "react";

/**
 * Immagine con effetto "blur-up": mostra una miniatura sfocata/placeholder animato
 * mentre la foto carica, poi la rivela con una dissolvenza fluida.
 * Da inserire dentro un contenitore con posizione `relative overflow-hidden`.
 */
export function BlurImage({ imgClassName = "", blur = "blur-lg", ...props }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <>
            <span
                aria-hidden="true"
                className={`absolute inset-0 bg-navy-700 bg-gradient-to-br from-white/[0.07] to-white/[0.02] transition-opacity duration-500 ${loaded ? "opacity-0 pointer-events-none" : "opacity-100 animate-pulse"}`}
            />
            <img
                {...props}
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}
                className={`${imgClassName} transition-[opacity,filter,transform] duration-700 ease-out ${loaded ? "opacity-100 blur-0" : `opacity-0 ${blur}`}`}
            />
        </>
    );
}
