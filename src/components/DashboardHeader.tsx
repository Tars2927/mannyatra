import { trpc } from "@/providers/trpc";

export default function DashboardHeader() {
  const { data: stats } = trpc.destination.stats.useQuery();

  return (
    <div
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
    >
      {/* Title area */}
      <div>
        <h2
          style={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: 700,
            color: "var(--on-surface)",
            margin: 0,
            lineHeight: 1.3,
          }}
          className="text-2xl sm:text-3xl"
        >
          My Dashboard
        </h2>
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: 400,
            color: "var(--on-surface-variant)",
            marginTop: "6px",
          }}
          className="text-sm sm:text-base"
        >
          Track your adventures and goals.
        </p>
      </div>

      {/* Quick stat pill */}
      <div
        className="neu-extruded flex items-center gap-3"
        style={{ borderRadius: "var(--radius-full)", padding: "10px 20px", flexShrink: 0 }}
      >
        <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "20px" }}>
          flag
        </span>
        <div>
          <span
            style={{
              display: "block",
              fontFamily: "Manrope, sans-serif",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--on-surface)",
              textTransform: "uppercase",
            }}
          >
            Total Goals
          </span>
          <span
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--primary)",
              lineHeight: 1,
            }}
          >
            {stats?.total ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
