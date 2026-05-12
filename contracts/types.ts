/** Shared preview data shape used by both backend and frontend. */
export interface PreviewData {
  source: "wikipedia" | "fallback";
  name: string;
  subtitle: string;
  summary: string;
  image: string;
  lat: number | null;
  lon: number | null;
  url: string;
}

/** The fallback preview returned when no data is found. */
export const FALLBACK_PREVIEW: PreviewData = {
  source: "fallback",
  name: "",
  subtitle: "",
  summary: "",
  image: "",
  lat: null,
  lon: null,
  url: "",
};
