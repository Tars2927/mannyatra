import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { usePreview } from "@/hooks/usePreview";
import DestinationPreview from "@/components/DestinationPreview";
import BucketDropAnimation from "@/components/BucketDropAnimation";
import type { StatusFilter } from "./StatusFilters";

type FormStatus = "Planning" | "Booked" | "InProgress" | "Accomplished";

interface AddDestinationFormProps {
  onSuccess: () => void;
  activeFilter: StatusFilter;
}

/** Non-blocking inline toast banner */
function ToastBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
      style={{
        background: "var(--error-container)",
        color: "var(--on-error-container)",
        borderRadius: "var(--radius)",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "16px", flexShrink: 0 }}>error</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} style={{ color: "var(--on-error-container)", background: "none", border: "none", cursor: "pointer" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
      </button>
    </div>
  );
}

export default function AddDestinationForm({ onSuccess, activeFilter }: AddDestinationFormProps) {
  const [destination, setDestination] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [category, setCategory] = useState("Travel");
  const [status, setStatus] = useState<FormStatus>(
    activeFilter === "All" ? "Planning" : (activeFilter as FormStatus)
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showBucketAnim, setShowBucketAnim] = useState(false);
  const [animItemName, setAnimItemName] = useState("");
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Live preview via the usePreview hook
  const { state: previewState, preview } = usePreview(destination);

  // Show error toast when preview fetch fails (non-blocking) — must be in an effect
  const prevStatusRef = useRef(previewState.status);
  useEffect(() => {
    if (previewState.status !== prevStatusRef.current) {
      prevStatusRef.current = previewState.status;
      if (previewState.status === "error") {
        setToastMsg((previewState as { status: "error"; message: string }).message);
      }
    }
  }, [previewState.status]);

  const handleAnimComplete = useCallback(() => {
    setShowBucketAnim(false);
  }, []);

  const utils = trpc.useUtils();
  const createMutation = trpc.destination.create.useMutation({
    onSuccess: () => {
      utils.destination.list.invalidate();
      utils.destination.stats.invalidate();
      // Trigger bucket animation
      setAnimItemName(destination.trim() || goalTitle.trim() || "New Destination");
      setShowBucketAnim(true);
      setDestination("");
      setGoalTitle("");
      setStartDate("");
      setEndDate("");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    createMutation.mutate({
      destination: destination.trim(),
      goalTitle: goalTitle.trim() || undefined,
      category,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      // Pass current preview to backend so it doesn't re-fetch
      preview: preview ?? undefined,
    });
  };

  // Determine if preview has content worth showing on mobile
  const hasPreviewContent = previewState.status === "loading" || previewState.status === "success" || (previewState.status === "error" && preview);

  return (
    <>
    {showBucketAnim && (
      <BucketDropAnimation itemName={animItemName} onComplete={handleAnimComplete} />
    )}
    <div className="flex flex-col lg:flex-row gap-6 flex-1">
      {/* ── Form card ─────────────────────────────────────────── */}
      <div
        className="neu-extruded flex-1"
        style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-inner)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-h2" style={{ fontSize: "20px" }}>
            Add destination
          </h3>
          <span
            className="neu-chip flex items-center gap-1"
            style={{ padding: "6px 14px", fontSize: "11px" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>auto_awesome</span>
            New
          </span>
        </div>
        <p className="text-body-md mb-5" style={{ fontSize: "13px", color: "var(--on-surface-variant)" }}>
          Shape the next place on your list.
        </p>

        {/* Error toast */}
        {toastMsg && (
          <ToastBanner message={toastMsg} onClose={() => setToastMsg(null)} />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destination */}
          <div>
            <label className="text-label-sm block mb-2" style={{ fontSize: "11px" }}>
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Kyoto, Japan"
              className="neu-input w-full"
              autoComplete="off"
            />
          </div>

          {/* Goal Title */}
          <div>
            <label className="text-label-sm block mb-2" style={{ fontSize: "11px" }}>
              Goal Title
            </label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Temple walks in Kyoto"
              className="neu-input w-full"
            />
          </div>

          {/* Category + Status */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-label-sm block mb-2" style={{ fontSize: "11px" }}>
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                >expand_more</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-label-sm block mb-2" style={{ fontSize: "11px" }}>
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FormStatus)}
                  className="neu-input w-full appearance-none cursor-pointer pr-10"
                >
                  <option value="Planning">Planning</option>
                  <option value="Booked">Booked</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Accomplished">Accomplished</option>
                </select>
                <span
                  className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--on-surface-variant)", fontSize: "16px" }}
                >expand_more</span>
              </div>
            </div>
          </div>

          {/* Start / End */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-label-sm block mb-2" style={{ fontSize: "11px" }}>
                Start
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="neu-input w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-label-sm block mb-2" style={{ fontSize: "11px" }}>
                End
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="neu-input w-full"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createMutation.isPending || !destination.trim()}
            className="neu-button-filled w-full h-14 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Adding..." : "Add to List"}
          </button>
        </form>

        {/* ── Mobile preview toggle (visible only on < lg screens) ── */}
        <div className="lg:hidden mt-4">
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="neu-subtle w-full flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
            style={{
              borderRadius: "var(--radius)",
              padding: "12px 16px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "var(--surface)",
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: hasPreviewContent ? "var(--primary)" : "var(--on-surface-variant)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                fontVariationSettings: showMobilePreview ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {previewState.status === "loading" ? "hourglass_top" : "preview"}
            </span>
            {showMobilePreview ? "Hide Preview" : "Show Destination Preview"}
            {previewState.status === "loading" && (
              <span
                className="inline-block"
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid var(--outline-variant)",
                  borderTopColor: "var(--primary)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            )}
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "16px",
                transition: "transform 0.3s",
                transform: showMobilePreview ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              expand_more
            </span>
          </button>

          {/* Mobile preview card */}
          {showMobilePreview && (
            <div className="mt-4 mobile-preview-enter">
              <DestinationPreview
                state={previewState}
                preview={preview}
                destination={destination}
                goalTitle={goalTitle}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop live preview card (side-by-side, lg+ only) ── */}
      <div className="hidden lg:block flex-1">
        <DestinationPreview
          state={previewState}
          preview={preview}
          destination={destination}
          goalTitle={goalTitle}
        />
      </div>
    </div>
    </>
  );
}

