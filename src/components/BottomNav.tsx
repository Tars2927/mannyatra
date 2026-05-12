import { useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: "format_list_bulleted", label: "My List",       path: "/",              fillOnActive: true },
  { icon: "explore",              label: "Explore",       path: "/explore",       fillOnActive: true },
  { icon: "verified",             label: "Accomplished",  path: "/accomplished",  fillOnActive: true },
  { icon: "settings",             label: "Settings",      path: "/settings",      fillOnActive: false },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex items-center justify-around"
      style={{
        backgroundColor: "#A3B1C6",
        borderRadius: "30px 30px 0 0",
        padding: "12px 8px 20px",
        boxShadow: "0 -6px 20px #8b97a9, 0 -2px 10px #bbcbdf",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all duration-200",
              isActive ? "neu-sidenav-active" : "neu-sidenav-inactive"
            )}
            style={{
              backgroundColor: "#A3B1C6",
              border: "none",
              cursor: "pointer",
              minWidth: "64px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "22px",
                color: isActive ? "#1a2332" : "#546579",
                fontVariationSettings: item.fillOnActive && isActive ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {item.icon}
            </span>
            <span
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "10px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#1a2332" : "#546579",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
