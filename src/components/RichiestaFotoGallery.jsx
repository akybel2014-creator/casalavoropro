import { useState } from "react";
import { Camera, Eye, X, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function getProtectedFileUrl(path) {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const token = localStorage.getItem("clpro_access_token");
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = `/api/files/${cleanPath}`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

export default function RichiestaFotoGallery({ foto = [], titolo = "Foto allegate" }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    if (!foto || foto.length === 0) return null;

    return (
        <div className="mt-4 pt-3 border-t border-white/5" data-testid="richiesta-foto-gallery">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <Camera className="h-3.5 w-3.5 text-brand" />
                Foto del lavoro allegate ({foto.length})
            </p>

            <div className="flex flex-wrap gap-2.5">
                {foto.map((f, i) => {
                    const src = getProtectedFileUrl(f.path);
                    return (
                        <button
                            key={f.id || i}
                            type="button"
                            onClick={() => setSelectedPhoto(f)}
                            data-testid={`richiesta-foto-thumb-${f.id || i}`}
                            className="group relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-white/10 hover:border-brand/60 bg-navy transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                            <img
                                src={src}
                                alt={f.filename || `Foto ${i + 1}`}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white drop-shadow" />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Modal per visualizzare la foto a dimensione intera */}
            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="bg-navy-750 border-white/15 text-white max-w-2xl max-h-[90vh] p-4 sm:p-6 overflow-hidden flex flex-col">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-sm sm:text-base font-display font-bold text-white flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-brand" />
                            {selectedPhoto?.filename || titolo}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPhoto && (
                        <div className="relative flex-1 min-h-0 flex items-center justify-center rounded-xl bg-navy/80 overflow-hidden border border-white/10 p-2">
                            <img
                                src={getProtectedFileUrl(selectedPhoto.path)}
                                alt={selectedPhoto.filename || "Foto del lavoro"}
                                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
