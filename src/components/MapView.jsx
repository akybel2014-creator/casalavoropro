import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";

const ITALY_CENTER = [42.5, 12.5];

function pinIcon(label) {
    return L.divIcon({
        className: "cl-map-pin",
        html: `<span><b>${label}</b></span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -30],
    });
}

function userIcon() {
    return L.divIcon({
        className: "cl-map-user",
        html: "<span></span>",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });
}

function Recenter({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MapView({ items, geo, radius }) {
    const withCoords = (items || []).filter((a) => a.location?.coordinates?.length === 2);
    const center = geo ? [geo.lat, geo.lng] : withCoords.length > 0
        ? [withCoords[0].location.coordinates[1], withCoords[0].location.coordinates[0]]
        : ITALY_CENTER;
    const zoom = geo ? (radius <= 10 ? 11 : radius <= 25 ? 10 : radius <= 50 ? 9 : 8) : 5;

    return (
        <div className="rounded-3xl overflow-hidden border border-white/10 h-[520px]" data-testid="directory-map">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Recenter center={center} zoom={zoom} />
                {geo && <Circle center={center} radius={radius * 1000} pathOptions={{ color: "#FF5A1F", fillColor: "#FF5A1F", fillOpacity: 0.08, weight: 1.5 }} />}
                {geo && <Marker position={center} icon={userIcon()} />}
                {withCoords.map((a) => (
                    <Marker
                        key={a.id}
                        position={[a.location.coordinates[1], a.location.coordinates[0]]}
                        icon={pinIcon((a.nome || "?").slice(0, 1).toUpperCase())}
                    >
                        <Popup>
                            <div style={{ fontFamily: "system-ui" }}>
                                <strong>{a.nome}</strong>
                                <div style={{ fontSize: 12, color: "#475569" }}>{a.zone?.join(" · ")}</div>
                                {a.distance_km != null && <div style={{ fontSize: 12 }}>a {a.distance_km} km</div>}
                                <a href={`/aziende/${a.id}`} data-testid={`map-link-${a.id}`} style={{ color: "#E0480E", fontWeight: 600, fontSize: 13 }}>Vedi profilo →</a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
