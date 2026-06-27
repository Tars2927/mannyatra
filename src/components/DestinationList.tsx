import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import type { Destination } from "@db/schema";
import type { StatusFilter } from "./StatusFilters";
import InviteModal from "./InviteModal";

interface DestinationListProps {
  filter: StatusFilter;
}

/** Maps status → pseudo-progress percentage */
const statusProgress: Record<string, number> = {
  Planning: 20,
  Booked: 50,
  InProgress: 75,
  Accomplished: 100,
};

const statusLabels: Record<string, string> = {
  Planning: "Planning",
  Booked: "Booked",
  InProgress: "In Progress",
  Accomplished: "Accomplished",
};

const statusIcons: Record<string, string> = {
  Planning: "flight_takeoff",
  Booked: "bookmark_added",
  InProgress: "cached",
  Accomplished: "verified",
};

const STATUS_CYCLE: Record<string, string> = {
  Planning: "Booked",
  Booked: "InProgress",
  InProgress: "Accomplished",
  Accomplished: "Planning",
};

const statusColors: Record<string, string> = {
  Planning: "#6b7b8d",
  Booked: "#5a7fb5",
  InProgress: "#c0792a",
  Accomplished: "#3d8c5c",
};

/** Large bento card for "In Progress" style display */
function LargeCard({ dest, onDelete, onStatusChange, onInvite }: { dest: Destination; onDelete: () => void; onStatusChange: (id: number, status: string) => void; onInvite: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const [retried, setRetried] = useState(false);
  const navigate = useNavigate();
  const progress = statusProgress[dest.status] ?? 30;

  const handleImgError = () => {
    if (!retried && dest.imageUrl) {
      // Retry once with cache-bust after a short delay
      setRetried(true);
      setTimeout(() => setImgErr(false), 800);
    }
    setImgErr(true);
  };

  return (
    <div
      className="neu-extruded flex flex-col h-full group cursor-pointer transition-transform hover:scale-[1.01] duration-200"
      style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}
      onClick={() => navigate(`/destination/${dest.id}`)}
    >
      {/* Image */}
      <div
        className="neu-inset overflow-hidden mb-4"
        style={{ height: "160px", borderRadius: "var(--radius-sm)" }}
      >
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

      {/* Title row */}
      <div className="flex justify-between items-start mb-2">
        <h4
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--on-surface)",
            lineHeight: 1.3,
            flex: 1,
            marginRight: "8px",
          }}
        >
          {dest.goalTitle || dest.destination}
        </h4>
        <div
          className="neu-extruded flex items-center justify-center flex-shrink-0"
          style={{ width: "36px", height: "36px", borderRadius: "50%" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>
            {statusIcons[dest.status] ?? "place"}
          </span>
        </div>
      </div>

      {/* Status cycle pill */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(dest.id, STATUS_CYCLE[dest.status] ?? "Planning");
        }}
        className="neu-subtle flex items-center gap-1 self-start mb-2 transition-all hover:scale-[1.03] active:scale-95"
        style={{
          borderRadius: "var(--radius-full)",
          padding: "5px 12px",
          border: "none",
          cursor: "pointer",
          backgroundColor: "var(--surface)",
          fontFamily: "Manrope, sans-serif",
          fontSize: "11px",
          fontWeight: 600,
          color: statusColors[dest.status] ?? "var(--on-surface-variant)",
        }}
        title={`Click to change to ${statusLabels[STATUS_CYCLE[dest.status] ?? "Planning"]}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
          {statusIcons[dest.status] ?? "place"}
        </span>
        {statusLabels[dest.status] ?? dest.status}
        <span className="material-symbols-outlined" style={{ fontSize: "12px", opacity: 0.5 }}>chevron_right</span>
      </button>

      {/* Description */}
      <p
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "14px",
          color: "var(--on-surface-variant)",
          marginBottom: "auto",
          paddingBottom: "16px",
          lineHeight: 1.6,
        }}
      >
        {dest.destination}
        {dest.startDate ? ` · ${dest.startDate}${dest.endDate ? ` – ${dest.endDate}` : ""}` : ""}
      </p>

      {/* Progress bar + actions */}
      <div className="flex justify-between items-center mt-4 gap-3">
        <div
          className="neu-inset flex-1"
          style={{ height: "10px", borderRadius: "var(--radius-full)", overflow: "hidden" }}
        >
          <div
            className="h-full progress-bar-fill"
            style={{
              width: `${progress}%`,
              borderRadius: "var(--radius-full)",
              background: "var(--primary)",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--primary)",
            minWidth: "32px",
            textAlign: "right",
          }}
        >
          {progress}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInvite();
          }}
          className="neu-subtle flex items-center justify-center transition-all hover:scale-110"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            backgroundColor: "var(--surface)",
            color: "var(--primary)",
          }}
          title="Invite friends"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>group_add</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this destination?")) onDelete();
          }}
          className="neu-subtle flex items-center justify-center transition-all hover:scale-110"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            backgroundColor: "var(--surface)",
            color: "var(--error)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>delete</span>
        </button>
      </div>
    </div>
  );
}

/** Compact row for "Upcoming" panel */
function CompactRow({ dest, onDelete, onStatusChange, onInvite }: { dest: Destination; onDelete: () => void; onStatusChange: (id: number, status: string) => void; onInvite: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const [retried, setRetried] = useState(false);
  const navigate = useNavigate();

  const handleImgError = () => {
    if (!retried && dest.imageUrl) {
      setRetried(true);
      setTimeout(() => setImgErr(false), 800);
    }
    setImgErr(true);
  };

  return (
    <div
      className="neu-inset flex gap-4 items-center cursor-pointer hover:opacity-90 transition-opacity"
      style={{ borderRadius: "var(--radius-sm)", padding: "14px" }}
      onClick={() => navigate(`/destination/${dest.id}`)}
    >
      {/* Thumbnail */}
      <div
        className="neu-extruded overflow-hidden flex-shrink-0"
        style={{ width: "56px", height: "56px", borderRadius: "8px" }}
      >
        {dest.imageUrl && !imgErr ? (
          <img
            src={retried ? `${dest.imageUrl}${dest.imageUrl.includes('?') ? '&' : '?'}retry=1` : dest.imageUrl}
            alt={dest.destination}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleImgError}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px", opacity: 0.5 }}>
              place
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--on-surface)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {dest.goalTitle || dest.destination}
        </p>
        <p style={{ fontSize: "11px", color: "var(--on-surface-variant)", marginTop: "2px" }}>
          {dest.destination}
          {dest.startDate ? ` · ${dest.startDate}` : ""}
        </p>
        {/* Inline status pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(dest.id, STATUS_CYCLE[dest.status] ?? "Planning");
          }}
          className="neu-subtle flex items-center gap-1 mt-1 transition-all hover:scale-[1.05] active:scale-95"
          style={{
            borderRadius: "var(--radius-full)",
            padding: "2px 8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "var(--surface)",
            fontFamily: "Manrope, sans-serif",
            fontSize: "10px",
            fontWeight: 600,
            color: statusColors[dest.status] ?? "var(--on-surface-variant)",
          }}
          title={`Click to change to ${statusLabels[STATUS_CYCLE[dest.status] ?? "Planning"]}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>{statusIcons[dest.status] ?? "place"}</span>
          {statusLabels[dest.status] ?? dest.status}
          <span className="material-symbols-outlined" style={{ fontSize: "10px", opacity: 0.5 }}>chevron_right</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onInvite()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--primary)",
            padding: "4px",
          }}
          title="Invite friends"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>group_add</span>
        </button>
        <button
          onClick={() => { if (confirm("Delete?")) onDelete(); }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--error)",
            padding: "4px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
        </button>
      </div>
    </div>
  );
}

/** Loading skeleton */
function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="neu-inset animate-pulse" style={{ height: "320px", borderRadius: "var(--radius)" }} />
        ))}
      </div>
      <div className="md:col-span-4">
        <div className="neu-inset animate-pulse" style={{ height: "320px", borderRadius: "var(--radius)" }} />
      </div>
    </div>
  );
}

export default function DestinationList({ filter }: DestinationListProps) {
  const { data: destinations, isLoading } = trpc.destination.list.useQuery();
  const utils = trpc.useUtils();
  const [inviteDest, setInviteDest] = useState<Destination | null>(null);

  const deleteMutation = trpc.destination.delete.useMutation({
    onSuccess: () => {
      utils.destination.list.invalidate();
      utils.destination.stats.invalidate();
    },
  });

  const updateMutation = trpc.destination.update.useMutation({
    onSuccess: () => {
      utils.destination.list.invalidate();
      utils.destination.stats.invalidate();
    },
  });

  const deleteItem = (id: number) => deleteMutation.mutate({ id });
  const changeStatus = (id: number, status: string) =>
    updateMutation.mutate({ id, status: status as "Planning" | "Booked" | "InProgress" | "Accomplished" });

  if (isLoading) return <Skeleton />;

  // Apply filter
  const filtered =
    filter === "All" ? destinations ?? [] : (destinations ?? []).filter((d) => d.status === filter);

  if (filtered.length === 0) {
    return (
      <div
        className="neu-extruded p-10 text-center"
        style={{ borderRadius: "var(--radius)" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "var(--outline-variant)", display: "block", marginBottom: "12px" }}>
          explore
        </span>
        <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", color: "var(--on-surface-variant)" }}>
          {filter === "All"
            ? "Your travel list is empty. Add your first destination above!"
            : `No destinations in "${statusLabels[filter] ?? filter}" yet.`}
        </p>
      </div>
    );
  }

  // When showing "All", split into sections
  if (filter === "All") {
    const inProgress = filtered.filter((d) => d.status === "InProgress");
    const upcoming   = filtered.filter((d) => d.status === "Planning" || d.status === "Booked");
    const accomplished = filtered.filter((d) => d.status === "Accomplished");
    const others     = filtered.filter(
      (d) => !["InProgress", "Planning", "Booked", "Accomplished"].includes(d.status)
    );

    return (
      <div className="space-y-8">
        {/* InviteModal */}
        {inviteDest && (
          <InviteModal destination={inviteDest} onClose={() => setInviteDest(null)} />
        )}

        {/* ── Bento grid: In Progress + Upcoming ────────────── */}
        {(inProgress.length > 0 || upcoming.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* In Progress — 8 cols */}
            {inProgress.length > 0 && (
              <section className="md:col-span-8 flex flex-col gap-4">
                <h3
                  className="flex items-center gap-2"
                  style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--on-surface)" }}
                >
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>cached</span>
                  In Progress
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {inProgress.map((dest: Destination) => (
                    <LargeCard key={dest.id} dest={dest} onDelete={() => deleteItem(dest.id)} onStatusChange={changeStatus} onInvite={() => setInviteDest(dest)} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming — 4 cols */}
            {upcoming.length > 0 && (
              <section className={`flex flex-col gap-4 ${inProgress.length > 0 ? "md:col-span-4" : "md:col-span-12"}`}>
                <h3
                  className="flex items-center gap-2"
                  style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--on-surface)" }}
                >
                  <span className="material-symbols-outlined" style={{ color: "var(--tertiary)" }}>calendar_month</span>
                  Upcoming
                </h3>
                <div
                  className="neu-extruded flex flex-col gap-4 h-full"
                  style={{ borderRadius: "var(--radius)", padding: "var(--space-inner)" }}
                >
                  {upcoming.map((dest: Destination) => (
                    <CompactRow key={dest.id} dest={dest} onDelete={() => deleteItem(dest.id)} onStatusChange={changeStatus} onInvite={() => setInviteDest(dest)} />
                  ))}
                  {upcoming.length === 0 && (
                    <p style={{ fontSize: "13px", color: "var(--on-surface-variant)", textAlign: "center", padding: "16px 0" }}>
                      No upcoming trips yet.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Accomplished ─────────────────────────────────── */}
        {accomplished.length > 0 && (
          <section className="flex flex-col gap-4">
            <h3
              className="flex items-center gap-2"
              style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "var(--on-surface)" }}
            >
              <span className="material-symbols-outlined" style={{ color: "var(--secondary)" }}>verified</span>
              Accomplished
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accomplished.map((dest: Destination) => (
                <LargeCard key={dest.id} dest={dest} onDelete={() => deleteItem(dest.id)} onStatusChange={changeStatus} onInvite={() => setInviteDest(dest)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Others ───────────────────────────────────────── */}
        {others.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {others.map((dest: Destination) => (
              <LargeCard key={dest.id} dest={dest} onDelete={() => deleteItem(dest.id)} onStatusChange={changeStatus} onInvite={() => setInviteDest(dest)} />
            ))}
          </section>
        )}
      </div>
    );
  }

  // Filtered view — uniform large cards
  return (
    <>
      {inviteDest && (
        <InviteModal destination={inviteDest} onClose={() => setInviteDest(null)} />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dest: Destination) => (
          <LargeCard key={dest.id} dest={dest} onDelete={() => deleteItem(dest.id)} onStatusChange={changeStatus} onInvite={() => setInviteDest(dest)} />
        ))}
      </div>
    </>
  );
}
