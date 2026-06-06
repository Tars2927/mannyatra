import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useTheme } from "@/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function Settings() {
  const { user, isLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { data: stats } = trpc.destination.stats.useQuery();
  const { theme, toggleTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
        <div className="neu-card p-8"><p style={{ color: "var(--on-surface-variant)" }}>Loading...</p></div>
      </div>
    );
  }

  const statItems = [
    { icon: "flag", label: "Total Goals", value: stats?.total ?? 0 },
    { icon: "verified", label: "Accomplished", value: stats?.done ?? 0 },
    { icon: "cached", label: "In Progress", value: (stats?.total ?? 0) - (stats?.done ?? 0) },
  ];

  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
        {/* Header */}
        <div className="mb-8">
          <h2 style={{ fontFamily: "Manrope, sans-serif", fontSize: "32px", fontWeight: 700, color: "var(--on-surface)", margin: 0 }}>Settings</h2>
          <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "16px", color: "var(--on-surface-variant)", marginTop: "6px" }}>Manage your profile and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="neu-extruded flex flex-col items-center gap-5" style={{ borderRadius: "var(--radius-lg)", padding: "40px 32px" }}>
            <div className="neu-inset flex items-center justify-center" style={{ width: "88px", height: "88px", borderRadius: "50%" }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name ?? "User"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "var(--outline-variant)" }}>account_circle</span>
              )}
            </div>
            <div className="text-center">
              <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--on-surface)", margin: 0 }}>{user?.name ?? "Traveler"}</h3>
              <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "14px", color: "var(--on-surface-variant)", marginTop: "4px" }}>{user?.email ?? "—"}</p>
            </div>
            <button onClick={logout} className="neu-button flex items-center gap-2 px-8 py-3" style={{ color: "var(--error)", fontSize: "14px", fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
              Log Out
            </button>
          </div>

          {/* Stats Section */}
          <div className="flex flex-col gap-6">
            <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--on-surface)" }}>
              <span className="material-symbols-outlined mr-2" style={{ fontSize: "22px", color: "var(--primary)", verticalAlign: "middle" }}>bar_chart</span>
              Your Stats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {statItems.map((s) => (
                <div key={s.label} className="neu-extruded flex flex-col items-center gap-2 p-6" style={{ borderRadius: "var(--radius)" }}>
                  <div className="neu-inset flex items-center justify-center" style={{ width: "48px", height: "48px", borderRadius: "50%" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--primary)" }}>{s.icon}</span>
                  </div>
                  <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "28px", fontWeight: 800, color: "var(--on-surface)" }}>{s.value}</span>
                  <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--on-surface-variant)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* ── Dark Mode Toggle ────────────────────────────── */}
            <div className="neu-extruded flex items-center justify-between" style={{ borderRadius: "var(--radius)", padding: "20px 24px" }}>
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "22px",
                    color: isDark ? "var(--primary)" : "var(--on-surface-variant)",
                    fontVariationSettings: isDark ? "'FILL' 1" : "'FILL' 0",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDark ? "dark_mode" : "light_mode"}
                </span>
                <div>
                  <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", fontWeight: 600, color: "var(--on-surface)", margin: 0 }}>
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </p>
                  <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "12px", color: "var(--on-surface-variant)", margin: 0, marginTop: "2px" }}>
                    {isDark ? "Easier on the eyes at night" : "Bright and clean appearance"}
                  </p>
                </div>
              </div>

              {/* Neumorphic Toggle Switch */}
              <button
                id="theme-toggle"
                onClick={toggleTheme}
                className={isDark ? "neu-inset" : "neu-inset"}
                aria-label="Toggle dark mode"
                style={{
                  position: "relative",
                  width: "56px",
                  height: "30px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  background: isDark
                    ? "linear-gradient(135deg, var(--primary-container), var(--primary))"
                    : "var(--surface)",
                  transition: "all 0.35s ease",
                }}
              >
                {/* Knob */}
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: isDark ? "29px" : "3px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: isDark ? "var(--surface)" : "var(--outline-variant)",
                    boxShadow: isDark
                      ? "2px 2px 6px rgba(0,0,0,0.4), -1px -1px 4px rgba(60,63,72,0.3)"
                      : "-2px -2px 6px var(--shadow-light), 2px 2px 6px var(--shadow-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "14px",
                      color: isDark ? "var(--primary)" : "var(--on-surface-variant)",
                      fontVariationSettings: "'FILL' 1",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isDark ? "dark_mode" : "light_mode"}
                  </span>
                </div>
              </button>
            </div>

            {/* App info */}
            <div className="neu-extruded" style={{ borderRadius: "var(--radius)", padding: "20px 24px" }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--on-surface-variant)" }}>info</span>
                <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", fontWeight: 600, color: "var(--on-surface)", margin: 0 }}>App Info</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>Version</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--on-surface)" }}>1.1.0-beta</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>Built with</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--on-surface)" }}>React + Hono + tRPC</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>Theme</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--primary)" }}>
                    {isDark ? "🌙 Dark" : "☀️ Light"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
