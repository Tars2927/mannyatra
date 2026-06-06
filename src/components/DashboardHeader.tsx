import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useTheme } from "@/hooks/useTheme";

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { data: stats } = trpc.destination.stats.useQuery();
  const { data: invites } = trpc.invite.listMine.useQuery();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

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

      {/* Stat pills + Theme toggle */}
      <div className="flex items-center gap-3">
        {/* Theme toggle — compact icon button */}
        <button
          id="header-theme-toggle"
          onClick={toggleTheme}
          className="neu-extruded flex items-center justify-center transition-all hover:scale-[1.06] active:scale-95"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            backgroundColor: "var(--surface)",
            flexShrink: 0,
          }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "20px",
              color: isDark ? "#f5c842" : "var(--on-surface-variant)",
              fontVariationSettings: "'FILL' 1",
              transition: "color 0.3s ease, transform 0.3s ease",
              transform: isDark ? "rotate(-20deg)" : "rotate(0deg)",
            }}
          >
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Invites pill — clickable */}
        <button
          onClick={() => navigate("/invites")}
          className="neu-extruded flex items-center gap-3 transition-all hover:scale-[1.03] active:scale-95"
          style={{
            borderRadius: "var(--radius-full)",
            padding: "10px 20px",
            flexShrink: 0,
            border: "none",
            cursor: "pointer",
            backgroundColor: "var(--surface)",
            fontFamily: "Manrope, sans-serif",
          }}
          title="View all invites"
        >
          <span className="material-symbols-outlined" style={{ color: "var(--tertiary)", fontSize: "20px" }}>
            mail
          </span>
          <div>
            <span
              style={{
                display: "block",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--on-surface)",
                textTransform: "uppercase",
                textAlign: "left",
              }}
            >
              Invites
            </span>
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--tertiary)",
                lineHeight: 1,
              }}
            >
              {invites?.length ?? 0}
            </span>
          </div>
        </button>

        {/* Total Goals pill */}
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
    </div>
  );
}
