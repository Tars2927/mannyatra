import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatusFilters, { type StatusFilter } from "@/components/StatusFilters";
import AddDestinationForm from "@/components/AddDestinationForm";
import DestinationList from "@/components/DestinationList";
import TravelStats from "@/components/TravelStats";
import BottomNav from "@/components/BottomNav";

// Lazy load the map so Leaflet doesn't bloat initial bundle
const TravelMap = lazy(() => import("@/components/TravelMap"));

export default function Home() {
  const { isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [showMap, setShowMap] = useState(false);
  const { data: destinations } = trpc.destination.list.useQuery();

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

      <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
        <DashboardHeader />
        <StatusFilters active={activeFilter} onChange={setActiveFilter} />

        {/* ── Add Destination Section ──────────────────────── */}
        {activeFilter === "All" && (
          <section className="mb-10">
            <div className="section-label">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_circle</span>
              New Destination
            </div>
            <AddDestinationForm
              activeFilter={activeFilter}
              onSuccess={() => {}}
            />
          </section>
        )}

        {/* ── Travel Stats Section ─────────────────────────── */}
        {activeFilter === "All" && (
          <section className="mb-10">
            <div className="section-label">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>analytics</span>
              Your Stats
            </div>
            <TravelStats />
          </section>
        )}

        {/* ── Travel Map Section ───────────────────────────── */}
        <section className="mb-10">
          <div className="section-label">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>map</span>
            Travel Map
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="neu-subtle flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            style={{
              borderRadius: "var(--radius-full)",
              padding: "10px 20px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "var(--surface)",
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: showMap ? "var(--primary)" : "var(--on-surface-variant)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                fontVariationSettings: showMap ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              map
            </span>
            {showMap ? "Hide Map" : "Show Travel Map"}
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "16px",
                transition: "transform 0.3s",
                transform: showMap ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              expand_more
            </span>
          </button>

          {showMap && destinations && (
            <div
              className="mt-4"
              style={{ animation: "modalSlideUp 0.3s ease-out" }}
            >
              <Suspense
                fallback={
                  <div
                    className="neu-inset animate-pulse"
                    style={{ height: "500px", borderRadius: "var(--radius-lg)" }}
                  />
                }
              >
                <TravelMap destinations={destinations} />
              </Suspense>
            </div>
          )}
        </section>

        {/* ── Destinations List Section ────────────────────── */}
        <section>
          <div className="section-label">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>format_list_bulleted</span>
            Your Destinations
          </div>
          <DestinationList filter={activeFilter} />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
