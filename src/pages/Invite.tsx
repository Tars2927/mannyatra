import { useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import InviteComments from "@/components/InviteComments";

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const { isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true });

  const { data, isLoading, error, refetch } = trpc.invite.getByCode.useQuery(
    { code: code ?? "" },
    { enabled: !!code && !authLoading }
  );

  const voteMutation = trpc.invite.vote.useMutation({
    onSuccess: () => refetch(),
  });

  const commentMutation = trpc.invite.comment.useMutation({
    onSuccess: () => refetch(),
  });

  const [imgErr, setImgErr] = useState(false);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="neu-card p-8 text-center">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px", color: "var(--primary)", display: "block", marginBottom: "12px" }}
          >
            hourglass_top
          </span>
          <p style={{ color: "var(--on-surface-variant)", fontFamily: "Manrope, sans-serif" }}>
            Loading invite...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="neu-card p-8 text-center" style={{ maxWidth: "400px" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "48px", color: "var(--error)", display: "block", marginBottom: "16px" }}
          >
            error_outline
          </span>
          <h2
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--on-surface)",
              marginBottom: "8px",
            }}
          >
            Invite Not Found
          </h2>
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "14px",
              color: "var(--on-surface-variant)",
              marginBottom: "24px",
            }}
          >
            This invite link may be invalid or expired.
          </p>
          <a
            href="/"
            className="neu-button-filled inline-flex items-center gap-2 px-6 py-3"
            style={{
              textDecoration: "none",
              fontSize: "14px",
              borderRadius: "var(--radius-full)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>home</span>
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const { destination: dest, invite, myVote, agreeCount, disagreeCount, isOwner, comments } = data;

  const handleVote = (vote: "agree" | "disagree") => {
    voteMutation.mutate({ inviteId: invite.id, vote });
  };

  const handleComment = (message: string) => {
    commentMutation.mutate({ inviteId: invite.id, message });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-6 sm:px-4 sm:py-8"
      style={{
        backgroundColor: "var(--surface)",
        fontFamily: "Manrope, sans-serif",
      }}
    >
      {/* Brand */}
      <div className="text-center mb-8">
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--on-surface)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          BucketList
        </h1>
        <p style={{ fontSize: "13px", color: "var(--on-surface-variant)", marginTop: "4px" }}>
          You've been invited!
        </p>
      </div>

      {/* Main invite card */}
      <div
        className="neu-extruded w-full"
        style={{
          maxWidth: "480px",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          animation: "modalSlideUp 0.4s ease-out",
        }}
      >
        {/* Destination Image */}
        {dest.imageUrl && !imgErr ? (
          <div className="h-40 sm:h-[200px]" style={{ overflow: "hidden", position: "relative" }}>
            <img
              src={dest.imageUrl}
              alt={dest.destination}
              className="w-full h-full object-cover"
              onError={() => setImgErr(true)}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "80px",
                background: "linear-gradient(transparent, rgba(247,249,252,0.9))",
              }}
            />
          </div>
        ) : (
          <div
            className="neu-inset flex items-center justify-center"
            style={{ height: "160px", margin: "20px 20px 0" , borderRadius: "var(--radius)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "48px", color: "var(--outline-variant)" }}
            >
              travel_explore
            </span>
          </div>
        )}

        {/* Content */}
        <div className="px-4 pb-4 sm:px-7 sm:pb-7" style={{ paddingTop: "20px" }}>
          {/* Status + Category badges */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <span
              className="neu-chip flex items-center gap-1"
              style={{ padding: "4px 12px", fontSize: "11px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                {dest.status === "Planning" ? "flight_takeoff" :
                 dest.status === "Booked" ? "bookmark_added" :
                 dest.status === "InProgress" ? "cached" : "verified"}
              </span>
              {dest.status === "InProgress" ? "In Progress" : dest.status}
            </span>
            {dest.category && (
              <span
                className="neu-chip flex items-center gap-1"
                style={{ padding: "4px 12px", fontSize: "11px" }}
              >
                {dest.category}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--on-surface)",
              lineHeight: 1.3,
              marginBottom: "6px",
            }}
          >
            {dest.goalTitle || dest.destination}
          </h2>

          {/* Location */}
          <p
            className="flex items-center gap-1 mb-1"
            style={{ fontSize: "14px", color: "var(--on-surface-variant)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>location_on</span>
            {dest.destination}
          </p>

          {/* Dates */}
          {dest.startDate && (
            <p
              className="flex items-center gap-1 mb-4"
              style={{ fontSize: "13px", color: "var(--outline)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_month</span>
              {dest.startDate}{dest.endDate ? ` – ${dest.endDate}` : ""}
            </p>
          )}

          {/* Owner notice */}
          {isOwner && (
            <div
              className="neu-inset flex items-center gap-2 p-3 mb-4"
              style={{ borderRadius: "var(--radius)", fontSize: "12px", color: "var(--primary)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>info</span>
              This is your own destination. Share the link to get votes!
            </div>
          )}

          {/* ── Voting Section ──────────────────────────────── */}
          <div className="mb-6">
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {isOwner ? "Vote Results" : "What do you think?"}
            </p>

            <div className="flex gap-4">
              {/* Agree */}
              <button
                onClick={() => handleVote("agree")}
                disabled={voteMutation.isPending}
                className={`flex-1 flex flex-col items-center py-5 transition-all duration-200 ${
                  myVote === "agree" ? "neu-inset" : "neu-extruded hover:scale-[1.03]"
                }`}
                style={{
                  borderRadius: "var(--radius)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "var(--surface)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "36px",
                    color: myVote === "agree" ? "#3d8c5c" : "var(--on-surface-variant)",
                    marginBottom: "8px",
                    transition: "color 0.2s",
                  }}
                >
                  thumb_up
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: myVote === "agree" ? "#3d8c5c" : "var(--on-surface)",
                  }}
                >
                  {agreeCount}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: myVote === "agree" ? "#3d8c5c" : "var(--on-surface-variant)",
                    marginTop: "4px",
                  }}
                >
                  {myVote === "agree" ? "You agreed!" : "Agree"}
                </span>
                {/* Voter avatars */}
                {data.votes.filter((v) => v.vote === "agree").length > 0 && (
                  <div className="flex -space-x-2 mt-3">
                    {data.votes
                      .filter((v) => v.vote === "agree")
                      .slice(0, 6)
                      .map((v) => (
                        <MiniAvatar key={v.id} name={v.userName} avatar={v.userAvatar} />
                      ))}
                  </div>
                )}
              </button>

              {/* Disagree */}
              <button
                onClick={() => handleVote("disagree")}
                disabled={voteMutation.isPending}
                className={`flex-1 flex flex-col items-center py-5 transition-all duration-200 ${
                  myVote === "disagree" ? "neu-inset" : "neu-extruded hover:scale-[1.03]"
                }`}
                style={{
                  borderRadius: "var(--radius)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "var(--surface)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "36px",
                    color: myVote === "disagree" ? "var(--error)" : "var(--on-surface-variant)",
                    marginBottom: "8px",
                    transition: "color 0.2s",
                  }}
                >
                  thumb_down
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: myVote === "disagree" ? "var(--error)" : "var(--on-surface)",
                  }}
                >
                  {disagreeCount}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: myVote === "disagree" ? "var(--error)" : "var(--on-surface-variant)",
                    marginTop: "4px",
                  }}
                >
                  {myVote === "disagree" ? "You disagreed" : "Disagree"}
                </span>
                {data.votes.filter((v) => v.vote === "disagree").length > 0 && (
                  <div className="flex -space-x-2 mt-3">
                    {data.votes
                      .filter((v) => v.vote === "disagree")
                      .slice(0, 6)
                      .map((v) => (
                        <MiniAvatar key={v.id} name={v.userName} avatar={v.userAvatar} />
                      ))}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* ── Comments ────────────────────────────────────── */}
          <InviteComments
            comments={comments}
            onSubmit={handleComment}
            isPending={commentMutation.isPending}
          />
        </div>
      </div>

      {/* Back link */}
      <a
        href="/"
        className="flex items-center gap-2 mt-8"
        style={{
          fontFamily: "Manrope, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--primary)",
          textDecoration: "none",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
        Go to my BucketList
      </a>
    </div>
  );
}

/* ── Mini avatar for voter list ──────────────────────────────────────────── */
function MiniAvatar({ name, avatar }: { name: string | null; avatar: string | null }) {
  const initial = (name ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        border: "2px solid var(--surface)",
        background: "var(--surface-container-high)",
        flexShrink: 0,
      }}
      title={name ?? "Anonymous"}
    >
      {avatar ? (
        <img src={avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <span
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "9px",
            fontWeight: 700,
            color: "var(--primary)",
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
