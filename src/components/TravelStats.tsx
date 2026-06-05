import { trpc } from "@/providers/trpc";

const continentEmojis: Record<string, string> = {
  "Europe": "🇪🇺",
  "Asia": "🌏",
  "North America": "🌎",
  "South America": "🌎",
  "Africa": "🌍",
  "Oceania": "🏝️",
  "Antarctica": "🧊",
  "Other": "🌐",
};

export default function TravelStats() {
  const { data: stats, isLoading } = trpc.destination.stats.useQuery();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="neu-inset animate-pulse"
            style={{ height: "120px", borderRadius: "var(--radius)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Stats Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon="emoji_events"
          label="Travel Score"
          value={stats.travelScore}
          color="#c0792a"
          accent
        />
        <StatCard
          icon="flag"
          label="Total Goals"
          value={stats.total}
          color="var(--primary)"
        />
        <StatCard
          icon="verified"
          label="Accomplished"
          value={stats.done}
          color="#3d8c5c"
        />
        <StatCard
          icon="public"
          label="Continents"
          value={`${stats.continents}/7`}
          color="#5a7fb5"
        />
      </div>

      {/* ── Second Row: Progress + Status Breakdown ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Completion Ring */}
        <div
          className="neu-extruded flex items-center gap-6"
          style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}
        >
          <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="var(--outline-variant)"
                strokeWidth="3"
                opacity="0.3"
              />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="#3d8c5c"
                strokeWidth="3"
                strokeDasharray={`${stats.avg * 0.974} 100`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Manrope, sans-serif",
                fontSize: "18px",
                fontWeight: 800,
                color: "#3d8c5c",
              }}
            >
              {stats.avg}%
            </div>
          </div>
          <div>
            <p style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--on-surface)",
              marginBottom: "4px",
            }}>
              Completion Rate
            </p>
            <p style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "12px",
              color: "var(--on-surface-variant)",
              lineHeight: 1.5,
            }}>
              {stats.done} of {stats.total} goals accomplished.
              {stats.avg >= 75 ? " Amazing progress! 🔥" :
               stats.avg >= 50 ? " Keep going! 💪" :
               stats.avg >= 25 ? " Good start! 🌱" :
               " Every journey starts with a dream! ✨"}
            </p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div
          className="neu-extruded"
          style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}
        >
          <p style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--on-surface-variant)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "12px",
          }}>
            Status Breakdown
          </p>
          <div className="space-y-3">
            <StatusBar label="Planning" count={stats.planning} total={stats.total} color="#6b7b8d" />
            <StatusBar label="Booked" count={stats.booked} total={stats.total} color="#5a7fb5" />
            <StatusBar label="In Progress" count={stats.inProgress} total={stats.total} color="#c0792a" />
            <StatusBar label="Accomplished" count={stats.done} total={stats.total} color="#3d8c5c" />
          </div>
        </div>
      </div>

      {/* ── Continents Visited ────────────────────────────────── */}
      {stats.continentList.length > 0 && (
        <div
          className="neu-extruded"
          style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}
        >
          <p style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--on-surface-variant)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "12px",
          }}>
            Continents Reached
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.continentList.map((c) => (
              <span
                key={c}
                className="neu-subtle flex items-center gap-2"
                style={{
                  borderRadius: "var(--radius-full)",
                  padding: "6px 14px",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                }}
              >
                {continentEmojis[c] ?? "🌐"} {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({
  icon, label, value, color, accent,
}: {
  icon: string; label: string; value: string | number; color: string; accent?: boolean;
}) {
  return (
    <div
      className={`${accent ? "neu-extruded" : "neu-subtle"} flex flex-col items-center justify-center py-5`}
      style={{ borderRadius: "var(--radius)" }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "24px",
          color,
          marginBottom: "8px",
          fontVariationSettings: "'FILL' 1",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: accent ? "28px" : "24px",
          fontWeight: 800,
          color,
          lineHeight: 1,
          marginBottom: "4px",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--on-surface-variant)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Status Bar ───────────────────────────────────────────────────────────── */
function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <span
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--on-surface)",
          minWidth: "90px",
        }}
      >
        {label}
      </span>
      <div
        className="neu-inset flex-1"
        style={{ height: "8px", borderRadius: "var(--radius-full)", overflow: "hidden" }}
      >
        <div
          className="h-full progress-bar-fill"
          style={{
            width: `${pct}%`,
            borderRadius: "var(--radius-full)",
            background: color,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          color,
          minWidth: "28px",
          textAlign: "right",
        }}
      >
        {count}
      </span>
    </div>
  );
}
