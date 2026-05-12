import { cn } from "@/lib/utils";

const filters = [
  { id: "All",          icon: "apps",             label: "All" },
  { id: "Planning",     icon: "flight_takeoff",    label: "Planning" },
  { id: "Booked",       icon: "bookmark_added",    label: "Booked" },
  { id: "InProgress",   icon: "cached",            label: "In Progress" },
  { id: "Accomplished", icon: "verified",          label: "Accomplished" },
] as const;

export type StatusFilter = (typeof filters)[number]["id"];

interface StatusFiltersProps {
  active: StatusFilter;
  onChange: (status: StatusFilter) => void;
}

export default function StatusFilters({ active, onChange }: StatusFiltersProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: "none" }}>
      {filters.map((f) => {
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full whitespace-nowrap transition-all duration-200",
              isActive ? "neu-inset" : "neu-extruded hover:scale-[1.02]"
            )}
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
              {f.icon}
            </span>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
