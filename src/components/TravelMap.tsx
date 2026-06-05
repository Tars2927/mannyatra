import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Destination } from "@db/schema";

// Fix Leaflet's default icon path issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Status-colored marker icons using inline SVG data URIs
const statusMarkerColors: Record<string, string> = {
  Planning: "#6b7b8d",
  Booked: "#5a7fb5",
  InProgress: "#c0792a",
  Accomplished: "#3d8c5c",
};

function createColoredIcon(status: string) {
  const color = statusMarkerColors[status] ?? "#6b7b8d";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "travel-map-marker",
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -42],
  });
}

// Component to auto-fit bounds
function FitBounds({ destinations }: { destinations: Destination[] }) {
  const map = useMap();

  useMemo(() => {
    const pts = destinations.filter((d) => d.lat && d.lon);
    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.setView([pts[0].lat!, pts[0].lon!], 6);
    } else {
      const bounds = L.latLngBounds(pts.map((d) => [d.lat!, d.lon!]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [destinations, map]);

  return null;
}

const statusLabels: Record<string, string> = {
  Planning: "Planning",
  Booked: "Booked",
  InProgress: "In Progress",
  Accomplished: "Accomplished",
};

interface TravelMapProps {
  destinations: Destination[];
}

export default function TravelMap({ destinations }: TravelMapProps) {
  // Only show destinations with coordinates
  const mappable = useMemo(
    () => destinations.filter((d) => d.lat != null && d.lon != null),
    [destinations]
  );

  if (mappable.length === 0) {
    return (
      <div
        className="neu-inset flex flex-col items-center justify-center"
        style={{
          height: "400px",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "48px", color: "var(--outline-variant)", marginBottom: "12px" }}
        >
          map
        </span>
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--on-surface-variant)",
            marginBottom: "4px",
          }}
        >
          No destinations on the map yet
        </p>
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "13px",
            color: "var(--outline)",
          }}
        >
          Add destinations to see them pinned worldwide!
        </p>
      </div>
    );
  }

  return (
    <div
      className="neu-extruded overflow-hidden"
      style={{ borderRadius: "var(--radius-lg)", height: "500px" }}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBounds destinations={mappable} />

        {mappable.map((dest) => (
          <Marker
            key={dest.id}
            position={[dest.lat!, dest.lon!]}
            icon={createColoredIcon(dest.status)}
          >
            <Popup>
              <div style={{ fontFamily: "Manrope, sans-serif", minWidth: "180px" }}>
                {dest.imageUrl && (
                  <img
                    src={dest.imageUrl}
                    alt={dest.destination}
                    style={{
                      width: "100%",
                      height: "90px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  />
                )}
                <p style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>
                  {dest.goalTitle || dest.destination}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7b8d", margin: "0 0 6px" }}>
                  {dest.destination}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: statusMarkerColors[dest.status] + "20",
                    color: statusMarkerColors[dest.status],
                  }}
                >
                  {statusLabels[dest.status] ?? dest.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
