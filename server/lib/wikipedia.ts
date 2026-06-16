import type { PreviewData } from "../../contracts/types";

const WIKIPEDIA_TIMEOUT_MS = 5000;
const SUMMARY_MAX_CHARS = 300;

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

/**
 * Fallback image lookup via Wikipedia's pageimages API.
 * Catches cases where the summary API has no image but the article does.
 */
async function fetchPageImage(title: string): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "pageimages",
    pithumbsize: "800",
    format: "json",
    origin: "*",
  });

  try {
    const res = await fetchWithTimeout(`${WIKI_SEARCH}?${params}`, 3000);
    if (!res.ok) return "";

    const data = await res.json() as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
    };

    const pages = data?.query?.pages;
    if (!pages) return "";
    const page = Object.values(pages)[0];
    return sanitizeUrl(page?.thumbnail?.source) || "";
  } catch {
    return "";
  }
}

/**
 * Fallback: search Wikimedia Commons for a relevant image.
 * Uses the search API to find photos related to the destination name.
 */
async function fetchCommonsImage(destination: string): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${destination} landscape OR city OR landmark`,
    gsrnamespace: "6", // File namespace
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "800",
    format: "json",
    origin: "*",
  });

  try {
    const res = await fetchWithTimeout(`https://commons.wikimedia.org/w/api.php?${params}`, 4000);
    if (!res.ok) return "";

    const data = await res.json() as {
      query?: {
        pages?: Record<string, {
          imageinfo?: Array<{ thumburl?: string; url?: string; mime?: string }>;
        }>;
      };
    };

    const pages = data?.query?.pages;
    if (!pages) return "";

    // Find the first result that's actually a photo (JPEG/PNG, not SVG/PDF)
    for (const page of Object.values(pages)) {
      const info = page?.imageinfo?.[0];
      if (!info) continue;
      const mime = info.mime ?? "";
      if (mime.startsWith("image/jpeg") || mime.startsWith("image/png") || mime.startsWith("image/webp")) {
        const url = sanitizeUrl(info.thumburl) || sanitizeUrl(info.url);
        if (url) return url;
      }
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Generate a deterministic placeholder image URL via DiceBear.
 * Creates a unique, colorful abstract pattern based on the destination name.
 * Always returns a valid, loadable image.
 */
function getPlaceholderImage(destination: string): string {
  const seed = encodeURIComponent(destination.trim().toLowerCase());
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&size=800&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
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

  // Try summary API images — prefer thumbnail (pre-sized by Wikipedia, loads fast)
  // Don't use originalimage — it can be 3000-4000px wide and multi-MB
  let image = sanitizeUrl(d.thumbnail?.source);

  // If no thumbnail, try originalimage but DON'T rewrite the URL
  // (Wikimedia only allows specific predefined thumbnail sizes)
  if (!image) {
    image = sanitizeUrl(d.originalimage?.source);
  }

  // Fallback 1: try Wikipedia's pageimages API
  if (!image) {
    image = await fetchPageImage(title);
  }

  // Fallback 2: try Wikimedia Commons search
  if (!image) {
    image = await fetchCommonsImage(d.title || title);
  }

  // Fallback 3: deterministic placeholder
  if (!image) {
    image = getPlaceholderImage(d.title || title);
  }

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
 *
 * Image fallback chain:
 * 1. Wikipedia summary API (originalimage / thumbnail)
 * 2. Wikipedia pageimages API
 * 3. Wikimedia Commons search
 * 4. DiceBear deterministic placeholder
 */
export async function fetchDestinationPreview(destination: string): Promise<PreviewData> {
  if (!destination.trim()) {
    return {
      source: "fallback",
      name: "",
      subtitle: "",
      summary: "",
      image: "",
      lat: null,
      lon: null,
      url: "",
    };
  }

  const fallbackImage = getPlaceholderImage(destination);
  const fallback: PreviewData = {
    source: "fallback",
    name: destination,
    subtitle: "",
    summary: "",
    image: fallbackImage,
    lat: null,
    lon: null,
    url: "",
  };

  try {
    const title = await searchTitle(destination);
    if (!title) {
      // No Wikipedia match — try Commons directly before falling back
      const commonsImage = await fetchCommonsImage(destination);
      return { ...fallback, image: commonsImage || fallbackImage };
    }

    const preview = await fetchSummary(title);
    if (!preview) return fallback;

    // Ensure the name reflects the searched destination if Wikipedia returned something generic
    return { ...preview, name: preview.name || destination };
  } catch {
    return fallback;
  }
}
