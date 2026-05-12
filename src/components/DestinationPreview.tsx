import { useState } from "react";
import type { PreviewState } from "@/hooks/usePreview";
import type { PreviewData } from "@contracts/types";

interface DestinationPreviewProps {
  state: PreviewState;
  preview: PreviewData | null;
  /** Typed destination text — used as heading fallback */
  destination: string;
  goalTitle?: string;
}

/** Skeleton shimmer block for loading state */
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className ?? ""}`}
      style={{ background: "var(--surface-container-high)", ...style }}
    />
  );
}

/** Rendered when we have real preview data */
function PreviewFilled({ preview, destination, goalTitle }: {
  preview: PreviewData;
  destination: string;
  goalTitle?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const displayName = preview.name || destination;
  const displaySub = preview.subtitle || goalTitle || "";
  const hasSummary = preview.summary.length > 0;
  const hasImage = preview.image && !imgError;
  const hasCoords = preview.lat !== null && preview.lon !== null;

  return (
    <>
      {/* Label */}
      <p
        className="text-label-sm mb-1"
        style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}
      >
        Your next journey
      </p>

      {/* Name */}
      <h3 className="text-h2 mb-1">{displayName}</h3>

      {/* Subtitle */}
      {displaySub && (
        <p
          className="text-sm font-medium mb-2"
          style={{ color: "var(--primary)", fontSize: "13px" }}
        >
          {displaySub}
        </p>
      )}

      {/* Summary */}
      {hasSummary && (
        <p
          className="text-body-md mb-4"
          style={{ fontSize: "13px", color: "var(--on-surface-variant)", lineHeight: 1.55 }}
        >
          {preview.summary}
        </p>
      )}

      {/* Image Area */}
      <div
        className="relative overflow-hidden neu-inset flex items-center justify-center"
        style={{ borderRadius: "var(--radius-md)", minHeight: "180px", flex: 1 }}
      >
        {hasImage ? (
          <img
            src={preview.image}
            alt={displayName}
            className="w-full h-full object-cover"
            style={{ borderRadius: "var(--radius-md)" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full neu-extruded flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: "26px", color: "var(--primary)" }}>location_on</span>
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>
              No image available
            </span>
          </div>
        )}
      </div>

      {/* Footer: coords + link */}
      {(hasCoords || preview.url) && (
        <div className="flex items-center justify-between mt-3">
          {hasCoords ? (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>navigation</span>
              {preview.lat!.toFixed(4)}, {preview.lon!.toFixed(4)}
            </span>
          ) : <span />}
          {preview.url && (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Wikipedia <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>open_in_new</span>
            </a>
          )}
        </div>
      )}
    </>
  );
}

/** Rendered while fetching */
function PreviewLoading() {
  return (
    <>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-5" />
      <div
        className="neu-inset flex-1 min-h-[180px]"
        style={{ borderRadius: "var(--radius-md)" }}
      >
        <Skeleton className="w-full h-full" style={{ borderRadius: "var(--radius-md)", minHeight: "180px" }} />
      </div>
    </>
  );
}

/** Rendered when no destination typed yet */
function PreviewPlaceholder() {
  return (
    <>
      <p
        className="text-label-sm mb-1"
        style={{ fontSize: "11px", color: "var(--on-surface-variant)" }}
      >
        Type a place to begin
      </p>
      <h3 className="text-h2 mb-2">Destination preview</h3>
      <p className="text-body-md mb-5" style={{ fontSize: "14px", color: "var(--on-surface-variant)" }}>
        A place, a reason, a first spark. Your next destination will settle here.
      </p>
      <div
        className="flex-1 relative min-h-[180px] overflow-hidden neu-inset"
        style={{ borderRadius: "var(--radius-md)" }}
      >
        {/* Inspirational hero image */}
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop&q=80"
          alt="Explore the world"
          className="w-full h-full object-cover"
          style={{ borderRadius: "var(--radius-md)", opacity: 0.85 }}
        />
        {/* Overlay gradient + text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end"
          style={{
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(0deg, rgba(25,28,30,0.7) 0%, rgba(25,28,30,0.15) 50%, transparent 100%)",
            padding: "24px 20px",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#fff", fontVariationSettings: "'FILL' 1" }}>explore</span>
            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Where to next?
            </span>
          </div>
          <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.75)", textAlign: "center", maxWidth: "220px" }}>
            Type a destination above and watch it come to life
          </p>
        </div>
      </div>
    </>
  );
}

export default function DestinationPreview({
  state,
  preview,
  destination,
  goalTitle,
}: DestinationPreviewProps) {
  return (
    <div
      className="neu-extruded flex-1 flex flex-col"
      style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-inner)" }}
    >
      {state.status === "idle" && <PreviewPlaceholder />}
      {state.status === "loading" && <PreviewLoading />}
      {(state.status === "success" || state.status === "error") && preview && (
        <PreviewFilled preview={preview} destination={destination} goalTitle={goalTitle} />
      )}
      {state.status === "error" && !preview && <PreviewPlaceholder />}
    </div>
  );
}
