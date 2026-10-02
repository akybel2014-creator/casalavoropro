import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MapPin, Navigation, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function LocationPicker({ value, onChange, placeholder, testPrefix = "location" }) {
    const [text, setText] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [busy, setBusy] = useState(false);
    const reqId = useRef(0);

    useEffect(() => {
        if (!MAPBOX_TOKEN) return undefined;
        if (text.trim().length < 3) {
            setSuggestions([]);
            return undefined;
        }
        const id = ++reqId.current;
        const timer = setTimeout(async () => {
            try {
                const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
                    text.trim(),
                )}&autocomplete=true&limit=5&language=it&access_token=${MAPBOX_TOKEN}`;
                const res = await fetch(url);
                const data = await res.json();
                if (id === reqId.current) setSuggestions(data.features || []);
            } catch {
                /* suggerimenti opzionali: ignora errori di rete */
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [text]);

    const locate = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocalizzazione non disponibile su questo browser");
            return;
        }
        setBusy(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setBusy(false);
                onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "La mia posizione" });
            },
            () => {
                setBusy(false);
                toast.error("Posizione non disponibile: consenti la geolocalizzazione al browser");
            },
            { timeout: 8000 },
        );
    };

    return (
        <div className="relative w-full" data-testid={`${testPrefix}-picker`}>
            {value ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-brand truncate" data-testid={`${testPrefix}-active-label`}>
                        <MapPin className="h-4 w-4 shrink-0" /> {value.label}
                    </span>
                    <button
                        type="button"
                        data-testid={`${testPrefix}-reset-button`}
                        onClick={() => { onChange(null); setText(""); }}
                        aria-label="Rimuovi posizione"
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                    {MAPBOX_TOKEN && (
                        <div className="relative flex-1">
                            <Input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={placeholder || "Cerca un indirizzo o una città"}
                                data-testid={`${testPrefix}-search-input`}
                                className="bg-navy/80 border-white/10 text-white placeholder:text-slate-500"
                            />
                            {suggestions.length > 0 && (
                                <ul className="absolute z-20 mt-1 w-full rounded-xl border border-white/10 bg-navy-700 shadow-2xl overflow-hidden" data-testid={`${testPrefix}-suggestions`}>
                                    {suggestions.map((s, i) => (
                                        <li key={s.id || i}>
                                            <button
                                                type="button"
                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5 hover:text-white"
                                                onClick={() => {
                                                    const [lng, lat] = s.geometry.coordinates;
                                                    onChange({ lat, lng, label: s.properties.full_address || s.properties.name || text });
                                                    setText(s.properties.full_address || s.properties.name || text);
                                                    setSuggestions([]);
                                                }}
                                            >
                                                {s.properties.full_address || s.properties.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        data-testid={`${testPrefix}-geolocate-button`}
                        onClick={locate}
                        disabled={busy}
                        className="rounded-xl border-brand/50 text-brand hover:bg-brand hover:text-white hover:border-brand shrink-0"
                    >
                        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
                        Usa la mia posizione
                    </Button>
                </div>
            )}
        </div>
    );
}
