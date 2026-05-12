import { useEffect, useRef, useState } from "react";
import type { PreviewData } from "@contracts/types";

export type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: PreviewData }
  | { status: "error"; message: string };

const DEBOUNCE_MS = 300;

/**
 * Fetches a live destination preview from /api/preview.
 * - Debounced by 300 ms.
 * - Aborts previous in-flight request when destination changes.
 * - Clears to idle when input is shorter than 2 chars.
 */
export function usePreview(destination: string): {
  state: PreviewState;
  preview: PreviewData | null;
} {
  const [state, setState] = useState<PreviewState>({ status: "idle" });
  // Keep a ref to the active AbortController so we can cancel it
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any pending request immediately when destination changes
    abortRef.current?.abort();

    if (destination.trim().length < 2) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const tid = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/preview?destination=${encodeURIComponent(destination.trim())}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(`Preview fetch failed: ${res.status}`);
        const data = (await res.json()) as PreviewData;
        setState({ status: "success", data });
      } catch (err: any) {
        // Ignore abort errors — they happen on every keystroke
        if (err.name === "AbortError") return;
        setState({
          status: "error",
          message: err?.message ?? "Could not load preview",
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(tid);
      ctrl.abort();
    };
  }, [destination]);

  const preview =
    state.status === "success" ? state.data : null;

  return { state, preview };
}
