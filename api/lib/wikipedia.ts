import type { PreviewData } from "../../contracts/types";

const WIKIPEDIA_TIMEOUT_MS = 5000;
const SUMMARY_MAX_CHARS = 300;

// Fallback image when no Wikipedia image is found
const FALLBACK_IMAGE = "";

// Wikipedia API base
const WIKI_API = "https://en.wikipedia.org/api/rest_v1";
const WIKI_SEARCH = "https://en.wikipedia.org/w/api.php";

/** Fetches with a timeout using AbortController. */
async function fetchWithTimeout(url: string, ms = WIKIPEDIA_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    return res;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

/** Step 1: Search Wikipedia to find the best-matching page title. */
async function searchTitle(destination: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: destination,
    srlimit: "1",
    format: "json",
    origin: "*",
  });

  const res = await fetchWithTimeout(`${WIKI_SEARCH}?${params}`);
  if (!res.ok) return null;

  const data = await res.json() as {
    query?: { search?: Array<{ title: string }> };
  };
  return data?.query?.search?.[0]?.title ?? null;
}

/** Step 2: Fetch the summary for a known page title. */
async function fetchSummary(title: string): Promise<PreviewData | null> {
  const encoded = encodeURIComponent(title);
  const res = await fetchWithTimeout(`${WIKI_API}/page/summary/${encoded}`);
  if (!res.ok) return null;

  const d = await res.json() as {
    type?: string;
    title?: string;
    description?: string;
    extract?: string;
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
    coordinates?: { lat?: number; lon?: number };
    content_urls?: { desktop?: { page?: string } };
  };

  // Reject disambiguation pages — not useful as destination previews
  if (d.type === "disambiguation") return null;

  const image =
    sanitizeUrl(d.originalimage?.source) ||
    sanitizeUrl(d.thumbnail?.source) ||
    FALLBACK_IMAGE;

  const lat = typeof d.coordinates?.lat === "number" ? d.coordinates.lat : null;
  const lon = typeof d.coordinates?.lon === "number" ? d.coordinates.lon : null;

  return {
    source: "wikipedia",
    name: sanitizeStr(d.title ?? "", 120),
    subtitle: sanitizeStr(d.description ?? "", 160),
    summary: sanitizeStr(d.extract ?? "", SUMMARY_MAX_CHARS),
    image,
    lat,
    lon,
    url: sanitizeUrl(d.content_urls?.desktop?.page) ?? "",
  };
}

/** Trim and cap a string; return empty string for falsy values. */
function sanitizeStr(s: string, maxLen: number): string {
  if (!s) return "";
  const trimmed = s.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen - 1) + "…" : trimmed;
}

/** Return URL only if it starts with https:// or http:// (prevents injection). */
function sanitizeUrl(url?: string): string {
  if (!url) return "";
  const u = url.trim();
  return u.startsWith("https://") || u.startsWith("http://") ? u : "";
}

/**
 * Main export: look up a destination via Wikipedia.
 * Returns a PreviewData object; falls back gracefully on any error.
 */
export async function fetchDestinationPreview(destination: string): Promise<PreviewData> {
  const fallback: PreviewData = {
    source: "fallback",
    name: destination,
    subtitle: "",
    summary: "",
    image: FALLBACK_IMAGE,
    lat: null,
    lon: null,
    url: "",
  };

  if (!destination.trim()) return { ...fallback, name: "" };

  try {
    const title = await searchTitle(destination);
    if (!title) return fallback;

    const preview = await fetchSummary(title);
    if (!preview) return fallback;

    // Ensure the name reflects the searched destination if Wikipedia returned something generic
    return { ...preview, name: preview.name || destination };
  } catch {
    return fallback;
  }
}
