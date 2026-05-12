import { useState, useRef, useEffect } from "react";
import type { InviteComment } from "@db/schema";

interface InviteCommentsProps {
  comments: InviteComment[];
  onSubmit: (message: string) => void;
  isPending?: boolean;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function InviteComments({ comments, onSubmit, isPending }: InviteCommentsProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const words = wordCount(message);
  const isOverLimit = words > 50;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSubmit = () => {
    if (!message.trim() || isOverLimit || isPending) return;
    onSubmit(message.trim());
    setMessage("");
  };

  return (
    <div
      className="neu-extruded flex flex-col"
      style={{
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        height: "100%",
        maxHeight: "420px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "18px", color: "var(--primary)" }}
        >
          chat_bubble
        </span>
        <h4
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--on-surface)",
            margin: 0,
          }}
        >
          Comments
        </h4>
        <span
          className="neu-chip"
          style={{
            padding: "2px 8px",
            fontSize: "10px",
            fontWeight: 700,
            marginLeft: "auto",
          }}
        >
          {comments.length}
        </span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 mb-4"
        style={{
          scrollbarWidth: "thin",
          minHeight: "120px",
        }}
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6" style={{ opacity: 0.5 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "32px", color: "var(--outline-variant)", marginBottom: "8px" }}
            >
              forum
            </span>
            <p
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "12px",
                color: "var(--on-surface-variant)",
                textAlign: "center",
              }}
            >
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment, idx) => (
            <div
              key={comment.id}
              className="comment-bubble-enter"
              style={{
                animationDelay: `${idx * 60}ms`,
              }}
            >
              <CommentBubble comment={comment} />
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div>
        {/* Word counter */}
        <div
          className="flex items-center justify-between mb-2"
          style={{ padding: "0 4px" }}
        >
          <span
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              color: isOverLimit ? "var(--error)" : "var(--outline)",
            }}
          >
            {words}/50 words
          </span>
          {isOverLimit && (
            <span
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--error)",
              }}
            >
              Too long!
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="neu-inset flex-1" style={{ borderRadius: "var(--radius)", padding: "2px" }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Leave a message..."
              rows={2}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "Manrope, sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                color: "var(--on-surface)",
                resize: "none",
                padding: "10px 14px",
                lineHeight: 1.5,
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isOverLimit || isPending}
            className="neu-button-filled flex items-center justify-center flex-shrink-0"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              alignSelf: "flex-end",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              {isPending ? "hourglass_top" : "send"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Single comment bubble ───────────────────────────────────────────────── */
function CommentBubble({ comment }: { comment: InviteComment }) {
  const initials = (comment.userName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = getTimeAgo(comment.createdAt);

  return (
    <div className="flex gap-3 items-start">
      {/* Avatar */}
      <div
        className="neu-subtle flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
        }}
      >
        {comment.userAvatar ? (
          <img
            src={comment.userAvatar}
            alt={comment.userName ?? "User"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <span
          className={comment.userAvatar ? "hidden" : ""}
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--primary)",
          }}
        >
          {initials}
        </span>
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--on-surface)",
            }}
          >
            {comment.userName ?? "Anonymous"}
          </span>
          <span
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "10px",
              fontWeight: 400,
              color: "var(--outline)",
            }}
          >
            {timeAgo}
          </span>
        </div>
        <div
          className="neu-inset"
          style={{
            borderRadius: "0 var(--radius-sm) var(--radius-sm) var(--radius-sm)",
            padding: "10px 14px",
          }}
        >
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              fontWeight: 400,
              color: "var(--on-surface)",
              lineHeight: 1.6,
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {comment.message}
          </p>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
