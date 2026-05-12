import { useState, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import InviteComments from "./InviteComments";
import type { Destination } from "@db/schema";

interface InviteModalProps {
  destination: Destination;
  onClose: () => void;
}

export default function InviteModal({ destination, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  // Create or retrieve the invite
  const createMutation = trpc.invite.create.useMutation();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Fetch existing invite data for this destination
  const { data, refetch } = trpc.invite.listForDestination.useQuery(
    { destinationId: destination.id },
    { enabled: true }
  );

  const commentMutation = trpc.invite.comment.useMutation({
    onSuccess: () => refetch(),
  });

  // Generate or get invite link
  const handleGenerateLink = useCallback(async () => {
    try {
      const result = await createMutation.mutateAsync({ destinationId: destination.id });
      setInviteCode(result.code);
      refetch();
    } catch (err) {
      console.error("Failed to create invite:", err);
    }
  }, [createMutation, destination.id, refetch]);

  const code = inviteCode ?? data?.invite?.code;
  const inviteLink = code ? `${window.location.origin}/invite/${code}` : null;

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComment = (message: string) => {
    if (!data?.invite) return;
    commentMutation.mutate({ inviteId: data.invite.id, message });
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(247, 249, 252, 0.8)",
        backdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      {/* Modal body */}
      <div
        className="neu-extruded w-full max-w-lg mx-2 sm:mx-4 overflow-hidden"
        style={{
          animation: "modalSlideUp 0.35s ease-out",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 sm:px-7 sm:pt-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div
                className="neu-subtle flex items-center justify-center"
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px", color: "var(--primary)" }}
                >
                  group_add
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--on-surface)",
                    margin: 0,
                  }}
                >
                  Invite Friends
                </h3>
                <p
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "var(--on-surface-variant)",
                    margin: 0,
                  }}
                >
                  {destination.goalTitle || destination.destination}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
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
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
            </button>
          </div>
        </div>

        {/* Content — scrollable */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-4 sm:px-7 sm:pb-7"
          style={{
            paddingTop: "16px",
            scrollbarWidth: "thin",
          }}
        >
          {/* ── Invite Link Section ───────────────────────────── */}
          <div className="mb-6">
            <p
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Share Link
            </p>

            {inviteLink ? (
              <div className="flex gap-2">
                <div
                  className="neu-inset flex-1 flex items-center"
                  style={{
                    borderRadius: "var(--radius)",
                    padding: "10px 14px",
                    overflow: "hidden",
                  }}
                >
                  <span
                    className="material-symbols-outlined flex-shrink-0"
                    style={{ fontSize: "16px", color: "var(--primary)", marginRight: "8px" }}
                  >
                    link
                  </span>
                  <span
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--on-surface)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {inviteLink}
                  </span>
                </div>
                <button
                  onClick={copyLink}
                  className="neu-button-filled flex items-center justify-center flex-shrink-0"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    {copied ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                disabled={createMutation.isPending}
                className="neu-button-filled w-full h-12 flex items-center justify-center gap-2"
                style={{ borderRadius: "var(--radius)", fontSize: "14px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {createMutation.isPending ? "hourglass_top" : "add_link"}
                </span>
                {createMutation.isPending ? "Generating..." : "Generate Invite Link"}
              </button>
            )}
          </div>

          {/* ── Votes Summary ─────────────────────────────────── */}
          {data && (data.agreeCount > 0 || data.disagreeCount > 0) && (
            <div className="mb-6">
              <p
                style={{
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--on-surface-variant)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Votes
              </p>

              <div className="flex gap-4">
                {/* Agree */}
                <div
                  className="neu-inset flex-1 flex flex-col items-center py-4"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "28px", color: "#3d8c5c", marginBottom: "6px" }}
                  >
                    thumb_up
                  </span>
                  <span
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#3d8c5c",
                    }}
                  >
                    {data.agreeCount}
                  </span>
                  <span
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "var(--on-surface-variant)",
                      marginTop: "2px",
                    }}
                  >
                    Agree
                  </span>
                  {/* Voter avatars */}
                  {data.votes.filter((v) => v.vote === "agree").length > 0 && (
                    <div className="flex -space-x-2 mt-3">
                      {data.votes
                        .filter((v) => v.vote === "agree")
                        .slice(0, 5)
                        .map((v) => (
                          <VoterAvatar key={v.id} name={v.userName} avatar={v.userAvatar} />
                        ))}
                    </div>
                  )}
                </div>

                {/* Disagree */}
                <div
                  className="neu-inset flex-1 flex flex-col items-center py-4"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "28px", color: "var(--error)", marginBottom: "6px" }}
                  >
                    thumb_down
                  </span>
                  <span
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "var(--error)",
                    }}
                  >
                    {data.disagreeCount}
                  </span>
                  <span
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "var(--on-surface-variant)",
                      marginTop: "2px",
                    }}
                  >
                    Disagree
                  </span>
                  {data.votes.filter((v) => v.vote === "disagree").length > 0 && (
                    <div className="flex -space-x-2 mt-3">
                      {data.votes
                        .filter((v) => v.vote === "disagree")
                        .slice(0, 5)
                        .map((v) => (
                          <VoterAvatar key={v.id} name={v.userName} avatar={v.userAvatar} />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Comments Section ──────────────────────────────── */}
          {data?.invite && (
            <InviteComments
              comments={data.comments}
              onSubmit={handleComment}
              isPending={commentMutation.isPending}
            />
          )}

          {/* Empty state when no invite yet */}
          {!data?.invite && !inviteLink && (
            <div
              className="neu-inset flex flex-col items-center justify-center py-8"
              style={{ borderRadius: "var(--radius)", marginTop: "8px" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "36px", color: "var(--outline-variant)", marginBottom: "10px" }}
              >
                share
              </span>
              <p
                style={{
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "13px",
                  color: "var(--on-surface-variant)",
                  textAlign: "center",
                  maxWidth: "200px",
                }}
              >
                Generate a link to invite friends. They can vote and leave comments!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small voter avatar ──────────────────────────────────────────────────── */
function VoterAvatar({ name, avatar }: { name: string | null; avatar: string | null }) {
  const initials = (name ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div
      className="neu-subtle flex items-center justify-center overflow-hidden"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        border: "2px solid var(--surface)",
      }}
      title={name ?? "Anonymous"}
    >
      {avatar ? (
        <img src={avatar} alt={name ?? ""} className="w-full h-full object-cover" />
      ) : (
        <span
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--primary)",
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
