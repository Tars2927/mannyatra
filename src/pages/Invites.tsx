import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function Invites() {
  const { isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: invites, isLoading: loadingInvites } = trpc.invite.listMine.useQuery();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
        <div className="neu-card p-8">
          <p style={{ color: "var(--on-surface-variant)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const copyLink = (id: number, code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--surface)" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto pb-24 md:pb-0" style={{ padding: "var(--space-container)" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
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
              My Invites
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
              Track votes and comments from friends.
            </p>
          </div>

          {/* Stat pill */}
          <div
            className="neu-extruded flex items-center gap-3"
            style={{ borderRadius: "var(--radius-full)", padding: "10px 20px", flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "20px" }}>
              mail
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
                Active Invites
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
                {invites?.length ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loadingInvites && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="neu-inset animate-pulse" style={{ height: "280px", borderRadius: "var(--radius)" }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingInvites && (!invites || invites.length === 0) && (
          <div
            className="neu-extruded flex flex-col items-center justify-center py-16"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <div
              className="neu-inset flex items-center justify-center mb-6"
              style={{ width: "80px", height: "80px", borderRadius: "50%" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--outline-variant)" }}>
                share
              </span>
            </div>
            <h3
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--on-surface)",
                marginBottom: "8px",
              }}
            >
              No invites yet
            </h3>
            <p
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "14px",
                color: "var(--on-surface-variant)",
                textAlign: "center",
                maxWidth: "300px",
              }}
            >
              Create invites from your destination cards on the dashboard. Friends can vote and leave comments!
            </p>
          </div>
        )}

        {/* Invite cards grid */}
        {invites && invites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {invites.map((inv) => (
              <InviteCard
                key={inv.id}
                invite={inv}
                isExpanded={expandedId === inv.id}
                isCopied={copiedId === inv.id}
                onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                onCopy={() => copyLink(inv.id, inv.code)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/* ── Invite Card ─────────────────────────────────────────────────────────── */
type InviteItem = NonNullable<ReturnType<typeof trpc.invite.listMine.useQuery>["data"]>[number];

function InviteCard({
  invite,
  isExpanded,
  isCopied,
  onToggle,
  onCopy,
}: {
  invite: InviteItem;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const dest = invite.destination!;

  const statusColors: Record<string, string> = {
    Planning: "#6b7b8d",
    Booked: "#5a7fb5",
    InProgress: "#c0792a",
    Accomplished: "#3d8c5c",
  };

  const statusLabels: Record<string, string> = {
    Planning: "Planning",
    Booked: "Booked",
    InProgress: "In Progress",
    Accomplished: "Accomplished",
  };

  return (
    <div
      className="neu-extruded flex flex-col transition-all duration-300 hover:scale-[1.01]"
      style={{ borderRadius: "var(--radius)", overflow: "hidden" }}
    >
      {/* Image header */}
      <div
        className="neu-inset overflow-hidden relative"
        style={{ height: "140px" }}
      >
        {dest.image && !imgErr ? (
          <img
            src={dest.image}
            alt={dest.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d1d9e6 0%, #e8edf3 100%)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "var(--outline-variant)" }}>
              flight_takeoff
            </span>
          </div>
        )}

        {/* Status badge overlay */}
        <div
          className="absolute top-3 right-3 neu-subtle flex items-center gap-1"
          style={{
            borderRadius: "var(--radius-full)",
            padding: "4px 10px",
            backgroundColor: "rgba(240, 244, 248, 0.9)",
            backdropFilter: "blur(8px)",
            fontSize: "10px",
            fontWeight: 600,
            fontFamily: "Manrope, sans-serif",
            color: statusColors[dest.status] ?? "var(--on-surface-variant)",
          }}
        >
          {statusLabels[dest.status] ?? dest.status}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "var(--space-inner)" }}>
        {/* Title */}
        <h4
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--on-surface)",
            marginBottom: "2px",
            lineHeight: 1.3,
          }}
        >
          {dest.name}
        </h4>
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "12px",
            color: "var(--on-surface-variant)",
            marginBottom: "12px",
          }}
        >
          {dest.place}
        </p>

        {/* Vote summary row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#3d8c5c" }}>
              thumb_up
            </span>
            <span
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "#3d8c5c",
              }}
            >
              {invite.agreeCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--error)" }}>
              thumb_down
            </span>
            <span
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--error)",
              }}
            >
              {invite.disagreeCount}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--on-surface-variant)" }}>
              chat_bubble
            </span>
            <span
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
              }}
            >
              {invite.commentCount}
            </span>
          </div>
        </div>

        {/* Voter avatars */}
        {invite.votes.length > 0 && (
          <div className="flex -space-x-2 mb-3">
            {invite.votes.map((v) => (
              <div
                key={v.id}
                className="neu-subtle flex items-center justify-center overflow-hidden"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border: "2px solid var(--surface)",
                }}
                title={`${v.userName} — ${v.vote}`}
              >
                {v.userAvatar ? (
                  <img src={v.userAvatar} alt={v.userName ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <span
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    {(v.userName ?? "?")[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="neu-subtle flex-1 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            style={{
              borderRadius: "var(--radius-full)",
              padding: "8px 14px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "var(--surface)",
              fontFamily: "Manrope, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--primary)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
              {isCopied ? "check" : "content_copy"}
            </span>
            {isCopied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={onToggle}
            className="neu-subtle flex items-center justify-center transition-all hover:scale-110"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              backgroundColor: "var(--surface)",
              color: "var(--on-surface-variant)",
            }}
            title="View details"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                transition: "transform 0.3s",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              expand_more
            </span>
          </button>
        </div>

        {/* Expanded comments */}
        {isExpanded && invite.recentComments.length > 0 && (
          <div
            className="mt-4 pt-4 flex flex-col gap-3"
            style={{
              borderTop: "1px solid var(--outline-variant)",
              animation: "modalSlideUp 0.25s ease-out",
            }}
          >
            <p
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Recent Comments
            </p>
            {invite.recentComments.map((c) => (
              <div
                key={c.id}
                className="neu-inset"
                style={{ borderRadius: "var(--radius-sm)", padding: "10px 12px" }}
              >
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--primary)",
                    marginBottom: "4px",
                  }}
                >
                  {c.userName}
                </p>
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "13px",
                    color: "var(--on-surface)",
                    lineHeight: 1.5,
                  }}
                >
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Expanded empty comments */}
        {isExpanded && invite.recentComments.length === 0 && (
          <div
            className="mt-4 pt-4"
            style={{ borderTop: "1px solid var(--outline-variant)" }}
          >
            <p
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "13px",
                color: "var(--on-surface-variant)",
                textAlign: "center",
                padding: "8px 0",
              }}
            >
              No comments yet — share the invite link!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
