import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: "format_list_bulleted", label: "My List", path: "/", fillOnActive: true },
  { icon: "mail",                 label: "Invites",      path: "/invites",      fillOnActive: true },
  { icon: "explore",              label: "Explore",      path: "/explore",      fillOnActive: true },
  { icon: "verified",             label: "Accomplished", path: "/accomplished", fillOnActive: true },
  { icon: "settings",             label: "Settings",     path: "/settings",     fillOnActive: false },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside
      className="hidden md:flex flex-col h-screen w-72 shrink-0 sticky top-0 z-20 neu-sidenav"
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderRadius: "0 40px 40px 0",
        padding: "32px 0",
      }}
    >
      {/* ── Brand ──────────────────────────────────────────── */}
      <div style={{ padding: "0 32px", marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "20px",
            fontWeight: 900,
            color: "var(--sidebar-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Mannyatra
        </h1>
        <p style={{ fontSize: "12px", color: "var(--sidebar-text-dim)", marginTop: "4px", fontWeight: 500 }}>
          Dream. Plan. Do.
        </p>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-4 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-full mx-0 text-sm font-semibold transition-transform duration-200 hover:scale-[1.02]",
                isActive ? "neu-sidenav-active" : "neu-sidenav-inactive"
              )}
              style={{
                backgroundColor: "var(--sidebar-bg)",
                color: isActive ? "var(--sidebar-text)" : "var(--sidebar-text-dim)",
                fontWeight: isActive ? 700 : 500,
                border: "none",
                cursor: "pointer",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "22px",
                  fontVariationSettings: item.fillOnActive && isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── User Profile ───────────────────────────────────── */}
      <div
        style={{ padding: "0 32px", marginTop: "auto", display: "flex", alignItems: "center", gap: "14px" }}
      >
        {/* Avatar */}
        <div
          className="neu-sidenav-inactive"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "var(--sidebar-bg)",
          }}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name ?? "User"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--sidebar-text-dim)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                account_circle
              </span>
            </div>
          )}
        </div>

        {/* Info + Logout */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--sidebar-text)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.name ?? "Traveler"}
          </p>
          <p style={{ fontSize: "11px", color: "var(--sidebar-text-dim)", margin: 0 }}>Explorer</p>
        </div>

        {/* Logout icon button */}
        <button
          onClick={logout}
          title="Logout"
          className="neu-sidenav-inactive"
          style={{
            backgroundColor: "var(--sidebar-bg)",
            border: "none",
            cursor: "pointer",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--error)",
            flexShrink: 0,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.1)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
        </button>
      </div>
    </aside>
  );
}
