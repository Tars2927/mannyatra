import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/providers/trpc";

interface NotesEditorProps {
  destinationId: number;
  initialNotes: string;
  readOnly?: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const MAX_NOTES_LENGTH = 1000;

export default function NotesEditor({ destinationId, initialNotes, readOnly = false }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track whether the user is actively editing to prevent server-refetch overwrites
  const isDirtyRef = useRef(false);
  // Track the last value we sent to the server so we know when it's safe to sync
  const lastSavedRef = useRef(initialNotes ?? "");

  const updateMutation = trpc.destination.update.useMutation({
    onSuccess: () => {
      setSaveStatus("saved");
      // Mark clean — the server now has our latest value
      isDirtyRef.current = false;
      lastSavedRef.current = notes;
      // Reset to idle after 2s
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
  });

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [notes, autoResize]);

  // Only sync from server when user is NOT actively editing.
  // This prevents the race condition where a refetch overwrites in-progress typing.
  useEffect(() => {
    if (!isDirtyRef.current) {
      setNotes(initialNotes ?? "");
      lastSavedRef.current = initialNotes ?? "";
    }
  }, [initialNotes]);

  const handleChange = (value: string) => {
    // Enforce character limit
    if (value.length > MAX_NOTES_LENGTH) {
      value = value.slice(0, MAX_NOTES_LENGTH);
    }
    setNotes(value);
    isDirtyRef.current = true;
    if (readOnly) return;

    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateMutation.mutate({ id: destinationId, notes: value });
    }, 1200);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const statusConfig: Record<SaveStatus, { icon: string; text: string; color: string }> = {
    idle: { icon: "edit_note", text: "", color: "var(--on-surface-variant)" },
    saving: { icon: "sync", text: "Saving…", color: "var(--primary)" },
    saved: { icon: "check_circle", text: "Saved", color: "var(--primary)" },
    error: { icon: "error", text: "Save failed", color: "var(--error)" },
  };

  const status = statusConfig[saveStatus];
  const isNearLimit = notes.length > MAX_NOTES_LENGTH * 0.9;

  return (
    <div className="notes-editor">
      {/* Header */}
      <div className="flex items-center justify-between mb-3" style={{ flexWrap: "wrap", gap: "8px" }}>
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", color: "var(--primary)" }}
          >
            edit_note
          </span>
          <span
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--on-surface)",
            }}
          >
            {readOnly ? "Notes" : "Personal Notes"}
          </span>
        </div>

        {/* Save status indicator */}
        {!readOnly && saveStatus !== "idle" && (
          <div
            className="flex items-center gap-1"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              color: status.color,
              animation: saveStatus === "saving" ? "pulse 1.5s infinite" : undefined,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "14px",
                animation: saveStatus === "saving" ? "spin 1s linear infinite" : undefined,
              }}
            >
              {status.icon}
            </span>
            {status.text}
          </div>
        )}
      </div>

      {/* Textarea */}
      <div className="neu-inset" style={{ borderRadius: "var(--radius)", padding: "4px" }}>
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          readOnly={readOnly}
          maxLength={MAX_NOTES_LENGTH}
          placeholder={
            readOnly
              ? "No notes yet."
              : "Write your thoughts, packing lists, tips…"
          }
          className="notes-textarea"
          style={{
            width: "100%",
            minHeight: "100px",
            resize: "none",
            overflow: "hidden",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "Manrope, sans-serif",
            fontSize: "14px",
            lineHeight: 1.7,
            color: "var(--on-surface)",
            padding: "12px 16px",
            cursor: readOnly ? "default" : "text",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Character count */}
      {!readOnly && (
        <div
          className="flex justify-end mt-2"
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "10px",
            fontWeight: 500,
            color: isNearLimit ? "var(--error)" : "var(--outline)",
          }}
        >
          {notes.length.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()}
        </div>
      )}
    </div>
  );
}
