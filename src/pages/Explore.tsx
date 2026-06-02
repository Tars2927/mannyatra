import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import BucketDropAnimation from "@/components/BucketDropAnimation";

/* ── Static inspiration seed data ──────────────────────────────────────────── */
const INSPIRATIONS = [
  { name: "Visit the Maldives",            category: "Travel",    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop", description: "Crystal-clear waters and overwater villas in paradise." },
  { name: "Hot Air Balloon in Cappadocia",  category: "Travel",    image: "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&h=400&fit=crop", description: "Float above fairy chimneys at sunrise in Turkey." },
  { name: "See the Northern Lights",        category: "Travel",    image: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=600&h=400&fit=crop", description: "Witness the aurora borealis dancing across Arctic skies." },
  { name: "Hike Patagonia",                 category: "Adventure", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop", description: "Trek through glaciers and mountains at the end of the world." },
  { name: "Learn to Surf",                  category: "Adventure", image: "https://images.unsplash.com/photo-1502680390548-bdbac40a5e46?w=600&h=400&fit=crop", description: "Catch your first wave on a sun-drenched beach." },
  { name: "30-Day Yoga Challenge",          category: "Wellness",  image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop", description: "Transform mind and body with a month of daily practice." },
  { name: "Master Wood-Fired Pizza",        category: "Food",      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop", description: "Craft authentic Neapolitan pizza from scratch." },
  { name: "Learn Guitar",                   category: "Skills",    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop", description: "Strum your first chords and play your favorite songs." },
  { name: "Scuba Diving Certification",     category: "Adventure", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop", description: "Explore vibrant coral reefs and marine life underwater." },
  { name: "Visit Kyoto",                    category: "Travel",    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop", description: "Wander through ancient temples and bamboo forests." },
  { name: "Run a Marathon",                 category: "Wellness",  image: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=600&h=400&fit=crop", description: "Cross that 42.2 km finish line and achieve greatness." },
  { name: "Learn a New Language",           category: "Skills",    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop", description: "Open doors to new cultures and connections." },
] as const;

const CATEGORIES = ["All", "Travel", "Wellness", "Skills", "Food", "Adventure"] as const;

const categoryIcons: Record<string, string> = {
  All: "apps",
  Travel: "flight",
  Wellness: "self_improvement",
  Skills: "school",
  Food: "restaurant",
  Adventure: "hiking",
};

/* ── Types for global search results (Photon API) ────────────────────────── */
interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lon, lat]
  properties: {
    osm_id: number;
    name?: string;
    country?: string;
    state?: string;
    city?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}


/* ── Build a 3×2 grid of tiles for a nicer preview ──────────────────────── */
function getTileGrid(lat: number, lon: number, zoom = 12): string[] {
  const n = Math.pow(2, zoom);
  const cx = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const cy = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  const tiles: string[] = [];
  for (let dy = -1; dy <= 0; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push(`https://tile.openstreetmap.org/${zoom}/${cx + dx}/${cy + dy}.png`);
    }
  }
  return tiles;
}

export default function Explore() {
  const { isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");

  // Global search state
  const [globalResults, setGlobalResults] = useState<PhotonFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Bucket drop animation
  const [bucketItem, setBucketItem] = useState<string | null>(null);

  // Determine if we're in global search mode (user typed 2+ chars)
  const isGlobalMode = search.trim().length >= 2;

  // Fast global search via Photon (Komoot) — OSM-backed, no rate-limit issues
  const doGlobalSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setGlobalResults([]);
      setHasSearched(false);
      return;
    }

    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=12&lang=en`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Search failed");
      const data: PhotonResponse = await res.json();
      setGlobalResults(data.features);
      setHasSearched(true);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Global search error:", err);
      setGlobalResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Trigger debounced search when search changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim().length < 2) {
      setGlobalResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true); // show spinner immediately
    debounceRef.current = setTimeout(() => doGlobalSearch(search), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, doGlobalSearch]);

  // Local inspiration filter
  const filtered = useMemo(() => {
    let items = [...INSPIRATIONS];
    if (activeCat !== "All") items = items.filter((i) => i.category === activeCat);
    if (search.trim() && !isGlobalMode) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCat, search, isGlobalMode]);

  const handleAdd = (itemName: string, category: string) => {
    setBucketItem(itemName);
    // Navigate after animation completes (handled in onComplete)
    setTimeout(() => {
      const params = new URLSearchParams({ destination: itemName, category });
      navigate(`/?${params.toString()}`);
    }, 2900);
  };

  const handleAddInspiration = (item: (typeof INSPIRATIONS)[number]) => {
    handleAdd(item.name, item.category);
  };

  const handleAddPlace = (feature: PhotonFeature) => {
    const name = feature.properties.name || "Unknown Place";
    handleAdd(name, "Travel");
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="neu-card p-8">
          <p style={{ color: "var(--on-surface-variant)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
      <Sidebar />

      {/* Bucket drop animation overlay */}
      {bucketItem && (
        <BucketDropAnimation
          itemName={bucketItem}
          onComplete={() => setBucketItem(null)}
        />
      )}

      <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
        {/* ── Header ───────────────────────────────────────── */}
        <div className="mb-8">
          <h2
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "32px",
              fontWeight: 700,
              color: "var(--on-surface)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Explore Ideas
          </h2>
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              color: "var(--on-surface-variant)",
              marginTop: "6px",
            }}
          >
            Search any place worldwide or browse curated travel ideas.
          </p>
        </div>

        {/* ── Global Search bar ──────────────────────────────── */}
        <div className="relative mb-6" style={{ maxWidth: "600px" }}>
          <span
            className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: "var(--outline)", fontSize: "20px" }}
          >
            travel_explore
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any place in the world… e.g. Paris, Tokyo, Bali"
            className="neu-input w-full"
            style={{ paddingLeft: "44px", paddingRight: "44px" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--outline)",
                padding: "2px",
                display: "flex",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
            </button>
          )}
          {/* Search mode indicator */}
          {isGlobalMode && (
            <div
              className="flex items-center gap-2 mt-2"
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--primary)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>public</span>
              Searching worldwide
              {isSearching && (
                <span
                  className="inline-block"
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid var(--outline-variant)",
                    borderTopColor: "var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Show global results OR local inspirations ────── */}
        {isGlobalMode ? (
          /* ── Global Search Results ─────────────────────────── */
          <div>
            {isSearching && globalResults.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="neu-inset animate-pulse"
                    style={{ height: "280px", borderRadius: "var(--radius)" }}
                  />
                ))}
              </div>
            )}

            {hasSearched && !isSearching && globalResults.length === 0 && (
              <div
                className="neu-extruded p-10 text-center"
                style={{ borderRadius: "var(--radius)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "40px",
                    color: "var(--outline-variant)",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  search_off
                </span>
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "15px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  No places found for "{search}". Try a different search!
                </p>
              </div>
            )}

            {globalResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {globalResults.map((feature, idx) => (
                  <PlaceCard
                    key={`${feature.properties.osm_id}-${idx}`}
                    feature={feature}
                    onAdd={() => handleAddPlace(feature)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Local Inspirations ────────────────────────────── */
          <>
            {/* Category filter pills */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: "none" }}>
              {CATEGORIES.map((cat) => {
                const isActive = activeCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                      isActive ? "neu-inset" : "neu-extruded hover:scale-[1.02]"
                    }`}
                    style={{
                      backgroundColor: "var(--surface)",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {categoryIcons[cat]}
                    </span>
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Bento Grid */}
            {filtered.length === 0 ? (
              <div
                className="neu-extruded p-10 text-center"
                style={{ borderRadius: "var(--radius)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "40px",
                    color: "var(--outline-variant)",
                    display: "block",
                    marginBottom: "12px",
                  }}
                >
                  search_off
                </span>
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "15px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  No ideas match your search. Try a different keyword!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((item) => (
                  <InspirationCard key={item.name} item={item} onAdd={() => handleAddInspiration(item)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/* ── Global Place Card with OSM tile map preview ──────────────────────────── */
function PlaceCard({
  feature,
  onAdd,
}: {
  feature: PhotonFeature;
  onAdd: () => void;
}) {
  const { properties, geometry } = feature;
  const name = properties.name || "Unknown Place";
  const [lon, lat] = geometry.coordinates;

  // Build location string
  const locationParts = [properties.city, properties.state, properties.country].filter(Boolean);
  const location = locationParts.join(", ");

  // Map key to icon
  const placeIcon = (() => {
    const key = properties.osm_key ?? "";
    switch (key) {
      case "boundary": return "border_all";
      case "place": return "location_city";
      case "tourism": return "tour";
      case "natural": return "landscape";
      case "amenity": return "place";
      case "waterway": return "water";
      case "highway": return "route";
      case "building": return "apartment";
      case "leisure": return "park";
      default: return "pin_drop";
    }
  })();

  const typeLabel = (properties.osm_value ?? properties.type ?? "place").replace(/_/g, " ");

  // Get tile grid for the map preview
  const tiles = getTileGrid(lat, lon, 11);

  return (
    <div
      className="neu-extruded flex flex-col group cursor-default transition-transform hover:scale-[1.01] duration-200"
      style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}
    >
      {/* Map Preview — 3×2 tile grid */}
      <div
        className="neu-inset overflow-hidden mb-4"
        style={{
          height: "140px",
          borderRadius: "var(--radius-sm)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            width: "100%",
            height: "100%",
          }}
        >
          {tiles.map((tileUrl, i) => (
            <img
              key={i}
              src={tileUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
          ))}
        </div>
        {/* Pin marker overlay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -100%)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px", color: "var(--error)" }}
          >
            location_on
          </span>
        </div>
        {/* Subtle gradient overlay for readability */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.15))",
            borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
          }}
        />
      </div>

      {/* Type badge */}
      <span
        className="neu-chip mb-3 self-start flex items-center gap-1"
        style={{ padding: "4px 12px", fontSize: "11px" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
          {placeIcon}
        </span>
        {typeLabel}
      </span>

      {/* Title */}
      <h4
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "17px",
          fontWeight: 700,
          color: "var(--on-surface)",
          lineHeight: 1.3,
          marginBottom: "4px",
        }}
      >
        {name}
      </h4>

      {/* Location */}
      {location && (
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "13px",
            color: "var(--on-surface-variant)",
            lineHeight: 1.5,
            marginBottom: "auto",
            paddingBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px", opacity: 0.6 }}>
            location_on
          </span>
          {location}
        </p>
      )}

      {/* Coordinates badge */}
      <div
        className="flex items-center gap-2 mb-4"
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "10px",
          fontWeight: 500,
          color: "var(--outline)",
          letterSpacing: "0.04em",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>my_location</span>
        {lat.toFixed(4)}°, {lon.toFixed(4)}°
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="neu-button-filled w-full h-11 flex items-center justify-center gap-2 text-sm"
        style={{ fontSize: "13px" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
        Add to My List
      </button>
    </div>
  );
}

/* ── Inspiration Card ──────────────────────────────────────────────────────── */
function InspirationCard({
  item,
  onAdd,
}: {
  item: (typeof INSPIRATIONS)[number];
  onAdd: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className="neu-extruded flex flex-col group cursor-default transition-transform hover:scale-[1.01] duration-200"
      style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}
    >
      {/* Image */}
      <div
        className="neu-inset overflow-hidden mb-4"
        style={{ height: "160px", borderRadius: "var(--radius-sm)" }}
      >
        {!imgErr ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "36px", opacity: 0.4 }}>
              image
            </span>
          </div>
        )}
      </div>

      {/* Category badge */}
      <span
        className="neu-chip mb-3 self-start flex items-center gap-1"
        style={{ padding: "4px 12px", fontSize: "11px" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
          {categoryIcons[item.category] ?? "label"}
        </span>
        {item.category}
      </span>

      {/* Title */}
      <h4
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "17px",
          fontWeight: 700,
          color: "var(--on-surface)",
          lineHeight: 1.3,
          marginBottom: "6px",
        }}
      >
        {item.name}
      </h4>

      {/* Description */}
      <p
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "13px",
          color: "var(--on-surface-variant)",
          lineHeight: 1.6,
          marginBottom: "auto",
          paddingBottom: "16px",
        }}
      >
        {item.description}
      </p>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="neu-button-filled w-full h-11 flex items-center justify-center gap-2 text-sm"
        style={{ fontSize: "13px" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
        Add to My List
      </button>
    </div>
  );
}
