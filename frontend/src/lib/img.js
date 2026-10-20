// Ottimizza le immagini remote (Unsplash/Pexels) richiedendo WebP, qualità e larghezza
// adeguate. Le immagini del nostro dominio (già ottimizzate in WebP lato backend) restano invariate.
export function optimizeRemoteImg(url, width = 800) {
    if (!url || typeof url !== "string") return url;
    try {
        const u = new URL(url);
        if (u.hostname.includes("unsplash.com")) {
            u.searchParams.set("fm", "webp");
            u.searchParams.set("q", "70");
            u.searchParams.set("w", String(width));
            u.searchParams.set("auto", "format,compress");
            u.searchParams.set("fit", "crop");
            return u.toString();
        }
        if (u.hostname.includes("pexels.com")) {
            u.searchParams.delete("dpr");
            u.searchParams.delete("h");
            u.searchParams.set("auto", "compress");
            u.searchParams.set("cs", "tinysrgb");
            u.searchParams.set("w", String(width));
            return u.toString();
        }
        return url;
    } catch {
        return url;
    }
}
