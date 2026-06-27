import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import NotesEditor from "@/components/NotesEditor";
import PhotoGallery from "@/components/PhotoGallery";

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
const statusColors: Record<string, string> = {
  Planning: "#6b7b8d",
  Booked: "#5a7fb5",
  InProgress: "#c0792a",
  Accomplished: "#3d8c5c",
};
const statusProgress: Record<string, number> = {
  Planning: 20,
  Booked: 50,
  InProgress: 75,
  Accomplished: 100,
};
const STATUS_ORDER = ["Planning", "Booked", "InProgress", "Accomplished"] as const;

const categoryIcons: Record<string, string> = {
  Travel: "flight",
  Adventure: "hiking",
  Relaxation: "spa",
  Culture: "museum",
  Food: "restaurant",
  Wellness: "self_improvement",
  Skills: "school",
};

export default function DestinationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const destId = parseInt(id ?? "0", 10);

  const { data: dest, isLoading, isError } = trpc.destination.getById.useQuery(
    { id: destId },
    { enabled: destId > 0, retry: false }
  );

  const utils = trpc.useUtils();
  const updateMutation = trpc.destination.update.useMutation({
    onSuccess: () => {
      utils.destination.getById.invalidate({ id: destId });
      utils.destination.list.invalidate();
      utils.destination.stats.invalidate();
    },
  });
  const deleteMutation = trpc.destination.delete.useMutation({
    onSuccess: () => {
      navigate("/");
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [imgErr, setImgErr] = useState(false);

  const startEditing = () => {
    if (!dest) return;
    setEditGoalTitle(dest.goalTitle ?? "");
    setEditCategory(dest.category ?? "Travel");
    setEditStartDate(dest.startDate ?? "");
    setEditEndDate(dest.endDate ?? "");
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (!dest) return;
    updateMutation.mutate({
      id: dest.id,
      goalTitle: editGoalTitle || undefined,
      category: editCategory || undefined,
      startDate: editStartDate || undefined,
      endDate: editEndDate || undefined,
    });
    setIsEditing(false);
  };

  const cycleStatus = () => {
    if (!dest) return;
    const idx = STATUS_ORDER.indexOf(dest.status as typeof STATUS_ORDER[number]);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    updateMutation.mutate({ id: dest.id, status: next });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
        <Sidebar />
        <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
          {/* Skeleton hero */}
          <div
            className="neu-inset animate-pulse mb-8"
            style={{ height: "320px", borderRadius: "var(--radius-lg)" }}
          />
          {/* Skeleton content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="neu-inset animate-pulse" style={{ height: "200px", borderRadius: "var(--radius)" }} />
              <div className="neu-inset animate-pulse" style={{ height: "160px", borderRadius: "var(--radius)" }} />
            </div>
            <div className="neu-inset animate-pulse" style={{ height: "300px", borderRadius: "var(--radius)" }} />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (isError || !dest) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
        <Sidebar />
        <main className="flex-1 overflow-auto pb-24 md:pb-0 flex items-center justify-center">
          <div
            className="neu-extruded p-12 text-center flex flex-col items-center gap-4"
            style={{ borderRadius: "var(--radius-lg)", maxWidth: "400px" }}
          >
            <div
              className="neu-inset flex items-center justify-center"
              style={{ width: "80px", height: "80px", borderRadius: "50%" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--error)" }}>
                explore_off
              </span>
            </div>
            <h3
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--on-surface)",
              }}
            >
              Destination not found
            </h3>
            <p
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "14px",
                color: "var(--on-surface-variant)",
              }}
            >
              This destination doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => navigate("/")}
              className="neu-button-filled px-8 h-11 flex items-center gap-2"
              style={{ fontSize: "14px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
              Back to My List
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const progress = statusProgress[dest.status] ?? 30;
  const displayName = dest.goalTitle || dest.destination;
  const catIcon = categoryIcons[dest.category ?? "Travel"] ?? "label";

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
        {/* ── Back nav ──────────────────────────────────────── */}
        <button
          onClick={() => navigate("/")}
          className="neu-subtle flex items-center gap-2 mb-6 transition-all hover:scale-[1.02] active:scale-95"
          style={{
            borderRadius: "var(--radius-full)",
            padding: "8px 16px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "var(--surface)",
            fontFamily: "Manrope, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--on-surface-variant)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to list
        </button>

        {/* ── Hero Section ─────────────────────────────────── */}
        <div
          className="detail-hero neu-extruded relative overflow-hidden mb-8"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          {/* Hero image */}
          <div className="detail-hero-img-wrap" style={{ position: "relative", height: "280px", overflow: "hidden" }}>
            {dest.imageUrl && !imgErr ? (
              <img
                src={dest.imageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgErr(true)}
                style={{ filter: "brightness(0.75)" }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--surface-container-low) 0%, var(--surface-container-high) 100%)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "64px", color: "var(--outline-variant)", opacity: 0.5 }}
                >
                  landscape
                </span>
              </div>
            )}

            {/* Gradient overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(0deg, rgba(25,28,30,0.85) 0%, rgba(25,28,30,0.3) 40%, transparent 100%)",
              }}
            />

            {/* Hero content */}
            <div
              className="detail-hero-overlay-content"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "32px",
              }}
            >
              {/* Category + Status badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                  className="flex items-center gap-1 px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#fff",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                    {catIcon}
                  </span>
                  {dest.category ?? "Travel"}
                </span>

                <button
                  onClick={cycleStatus}
                  className="flex items-center gap-1 px-3 py-1 rounded-full transition-all hover:scale-[1.05] active:scale-95"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#fff",
                    letterSpacing: "0.04em",
                  }}
                  title={`Click to change status`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                    {statusIcons[dest.status]}
                  </span>
                  {statusLabels[dest.status]}
                  <span className="material-symbols-outlined" style={{ fontSize: "10px", opacity: 0.6 }}>
                    chevron_right
                  </span>
                </button>
              </div>

              {/* Title */}
              <h1
                className="detail-hero-title"
                style={{
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "clamp(24px, 4vw, 36px)",
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  lineHeight: 1.2,
                  textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                {displayName}
              </h1>

              {/* Subtitle (destination if different from goalTitle) */}
              {dest.goalTitle && (
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    location_on
                  </span>
                  {dest.destination}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="detail-hero-progress-bar"
            style={{
              padding: "0 32px 20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <div
              className="neu-inset flex-1"
              style={{
                height: "10px",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
              }}
            >
              <div
                className="h-full progress-bar-fill"
                style={{
                  width: `${progress}%`,
                  borderRadius: "var(--radius-full)",
                  background: statusColors[dest.status] ?? "var(--primary)",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: statusColors[dest.status] ?? "var(--primary)",
                minWidth: "36px",
              }}
            >
              {progress}%
            </span>
          </div>
        </div>

        {/* ── Content Grid ─────────────────────────────────── */}
        <div className="detail-content-grid grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ animation: "modalSlideUp 0.3s ease-out" }}>
          {/* Left column: Info + Notes */}
          <div className="detail-col-left lg:col-span-2 space-y-8">
            {/* Quick info cards */}
            <div className="detail-info-grid grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Status */}
              <InfoCard
                icon={statusIcons[dest.status]}
                label="Status"
                value={statusLabels[dest.status]}
                color={statusColors[dest.status]}
              />
              {/* Category */}
              <InfoCard
                icon={catIcon}
                label="Category"
                value={dest.category ?? "Travel"}
                color="var(--primary)"
              />
              {/* Start Date */}
              <InfoCard
                icon="calendar_today"
                label="Start"
                value={dest.startDate ? formatDate(dest.startDate) : "Not set"}
                color="var(--tertiary)"
              />
              {/* End Date */}
              <InfoCard
                icon="event"
                label="End"
                value={dest.endDate ? formatDate(dest.endDate) : "Not set"}
                color="var(--secondary)"
              />
            </div>

            {/* Coordinates + Wikipedia link */}
            {(dest.lat != null || dest.lon != null) && (
              <div
                className="neu-extruded flex items-center justify-between flex-wrap gap-3"
                style={{
                  borderRadius: "var(--radius)",
                  padding: "16px 20px",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px", color: "var(--on-surface-variant)" }}
                  >
                    my_location
                  </span>
                  <span
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "13px",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    {dest.lat?.toFixed(4)}°, {dest.lon?.toFixed(4)}°
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps/@${dest.lat},${dest.lon},12z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  View on Google Maps
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    open_in_new
                  </span>
                </a>
              </div>
            )}

            {/* Notes */}
            <div
              className="neu-extruded"
              style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-inner)" }}
            >
              <NotesEditor
                destinationId={dest.id}
                initialNotes={dest.notes ?? ""}
              />
            </div>
          </div>

          {/* Right column: Photos + Actions */}
          <div className="detail-col-right space-y-8">
            {/* Photos */}
            <div
              className="neu-extruded"
              style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-inner)" }}
            >
              <PhotoGallery
                destinationId={dest.id}
                photos={dest.photos}
              />
            </div>

            {/* Edit / Actions */}
            <div
              className="neu-extruded"
              style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-inner)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px", color: "var(--primary)" }}
                >
                  tune
                </span>
                <span
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--on-surface)",
                  }}
                >
                  Actions
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label
                      className="text-label-sm block mb-2"
                      style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}
                    >
                      Goal Title
                    </label>
                    <input
                      type="text"
                      value={editGoalTitle}
                      onChange={(e) => setEditGoalTitle(e.target.value)}
                      className="neu-input w-full"
                    />
                  </div>
                  <div>
                    <label
                      className="text-label-sm block mb-2"
                      style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}
                    >
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="neu-input w-full appearance-none cursor-pointer pr-10"
                      >
                        <option>Travel</option>
                        <option>Adventure</option>
                        <option>Relaxation</option>
                        <option>Culture</option>
                        <option>Food</option>
                      </select>
                      <span
                        className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--on-surface-variant)", fontSize: "16px" }}
                      >
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label
                        className="text-label-sm block mb-2"
                        style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}
                      >
                        Start
                      </label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="neu-input w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        className="text-label-sm block mb-2"
                        style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}
                      >
                        End
                      </label>
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="neu-input w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveEdits}
                      className="neu-button-filled flex-1 h-11 flex items-center justify-center gap-2"
                      style={{ fontSize: "13px" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span>
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="neu-button flex-1 h-11 flex items-center justify-center gap-2"
                      style={{ fontSize: "13px" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startEditing}
                    className="neu-button w-full h-11 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    style={{ fontSize: "13px" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                    Edit Details
                  </button>
                  <button
                    onClick={cycleStatus}
                    className="neu-button w-full h-11 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    style={{
                      fontSize: "13px",
                      color: statusColors[dest.status],
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {statusIcons[dest.status]}
                    </span>
                    Change Status
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this destination?")) {
                        deleteMutation.mutate({ id: dest.id });
                      }
                    }}
                    className="neu-button w-full h-11 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    style={{ fontSize: "13px", color: "var(--error)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                    Delete Destination
                  </button>
                </div>
              )}
            </div>

            {/* Created date */}
            <div
              className="flex items-center gap-2 px-4"
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "11px",
                color: "var(--outline)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                schedule
              </span>
              Added {new Date(dest.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

/* ── Info Card sub-component ──────────────────────────────────────────────── */
function InfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="neu-extruded flex flex-col items-center gap-2 p-4"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div
        className="neu-inset flex items-center justify-center"
        style={{ width: "40px", height: "40px", borderRadius: "50%" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "18px", color: color ?? "var(--primary)" }}
        >
          {icon}
        </span>
      </div>
      <span
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--on-surface-variant)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--on-surface)",
          textAlign: "center",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Format date string nicely */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
