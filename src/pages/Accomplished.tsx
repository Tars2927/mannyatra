import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import type { Destination } from "@db/schema";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function Accomplished() {
  const { isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();
  const { data: destinations, isLoading: listLoading, isError: listError } = trpc.destination.list.useQuery(undefined, { retry: false });
  const { data: stats } = trpc.destination.stats.useQuery(undefined, { retry: false });
  const accomplished = (destinations ?? []).filter((d) => d.status === "Accomplished");
  // Treat query errors (e.g. unauthenticated) as "done loading with no data"
  const showLoading = listLoading && !listError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
        <div className="neu-card p-8"><p style={{ color: "var(--on-surface-variant)" }}>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
        {/* Hero Banner */}
        <div className="neu-extruded mb-8 flex flex-col sm:flex-row items-center gap-6" style={{ borderRadius: "var(--radius-lg)", padding: "40px 32px", background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-container-low) 100%)" }}>
          <div className="neu-inset flex items-center justify-center flex-shrink-0" style={{ width: "100px", height: "100px", borderRadius: "50%" }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "40px", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>{stats?.done ?? 0}</span>
          </div>
          <div>
            <h2 style={{ fontFamily: "Manrope, sans-serif", fontSize: "28px", fontWeight: 700, color: "var(--on-surface)", margin: 0, lineHeight: 1.3 }}>Goals Accomplished 🎉</h2>
            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "16px", color: "var(--on-surface-variant)", marginTop: "8px" }}>
              {accomplished.length === 0 ? "Start checking off your travel list — every journey starts with a single step." : `You've crushed ${accomplished.length} goal${accomplished.length !== 1 ? "s" : ""}! Keep the momentum going.`}
            </p>
          </div>
        </div>

        {/* Content */}
        {showLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (<div key={i} className="neu-inset animate-pulse" style={{ height: "320px", borderRadius: "var(--radius)" }} />))}
          </div>
        ) : accomplished.length === 0 ? (
          <div className="neu-extruded p-12 text-center flex flex-col items-center gap-4" style={{ borderRadius: "var(--radius-lg)" }}>
            <div className="neu-inset flex items-center justify-center" style={{ width: "80px", height: "80px", borderRadius: "50%" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--outline-variant)" }}>emoji_events</span>
            </div>
            <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--on-surface)" }}>Nothing accomplished yet</h3>
            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", color: "var(--on-surface-variant)", maxWidth: "360px" }}>Head back to your list and update a destination to "Accomplished" — you'll see it here!</p>
            <button onClick={() => navigate("/")} className="neu-button-filled px-8 h-11 flex items-center gap-2" style={{ fontSize: "14px", marginTop: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>Go to My List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accomplished.map((dest) => (<AccomplishedCard key={dest.id} dest={dest} />))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function AccomplishedCard({ dest }: { dest: Destination }) {
  const [imgErr, setImgErr] = useState(false);
  const [retried, setRetried] = useState(false);

  const handleImgError = () => {
    if (!retried && dest.imageUrl) {
      setRetried(true);
      setTimeout(() => setImgErr(false), 800);
    }
    setImgErr(true);
  };

  return (
    <div className="neu-extruded flex flex-col group transition-transform hover:scale-[1.01] duration-200" style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}>
      <div className="neu-inset overflow-hidden mb-4 relative" style={{ height: "160px", borderRadius: "var(--radius-sm)" }}>
        {dest.imageUrl && !imgErr ? (
          <img
            src={retried ? `${dest.imageUrl}${dest.imageUrl.includes('?') ? '&' : '?'}retry=1` : dest.imageUrl}
            alt={dest.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleImgError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "36px", opacity: 0.4 }}>image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full" style={{ backgroundColor: "var(--sidebar-badge-bg)", backdropFilter: "blur(8px)", color: "#fff", fontSize: "11px", fontWeight: 600, fontFamily: "Manrope, sans-serif" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>verified</span>Done
        </div>
      </div>
      <h4 style={{ fontFamily: "Manrope, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--on-surface)", lineHeight: 1.3, marginBottom: "6px" }}>{dest.goalTitle || dest.destination}</h4>
      <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "14px", color: "var(--on-surface-variant)", lineHeight: 1.6 }}>
        {dest.destination}{dest.startDate ? ` · ${dest.startDate}${dest.endDate ? ` – ${dest.endDate}` : ""}` : ""}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="neu-inset flex-1" style={{ height: "10px", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
          <div className="h-full progress-bar-fill" style={{ width: "100%", borderRadius: "var(--radius-full)", background: "var(--primary)" }} />
        </div>
        <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "12px", fontWeight: 700, color: "var(--primary)" }}>100%</span>
      </div>
    </div>
  );
}
