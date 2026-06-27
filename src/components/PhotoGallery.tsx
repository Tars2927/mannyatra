import { useState, useRef, useCallback } from "react";
import { trpc } from "@/providers/trpc";

interface PhotoGalleryProps {
  destinationId: number;
  photos: Array<{
    id: number;
    caption: string | null;
    mimeType: string;
    createdAt: Date;
  }>;
  readOnly?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTOS = 5;

export default function PhotoGallery({ destinationId, photos, readOnly = false }: PhotoGalleryProps) {
  const [lightboxId, setLightboxId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const uploadMutation = trpc.destination.uploadPhoto.useMutation({
    onSuccess: () => {
      utils.destination.getById.invalidate({ id: destinationId });
      utils.destination.listPhotos.invalidate({ destinationId });
      setIsUploading(false);
    },
    onError: (err: { message: string }) => {
      setError(err.message);
      setIsUploading(false);
      setTimeout(() => setError(null), 4000);
    },
  });

  const deleteMutation = trpc.destination.deletePhoto.useMutation({
    onSuccess: () => {
      utils.destination.getById.invalidate({ id: destinationId });
      utils.destination.listPhotos.invalidate({ destinationId });
      setLightboxId(null);
    },
  });

  // Load photo data for lightbox
  const { data: lightboxPhoto } = trpc.destination.getPhoto.useQuery(
    { id: lightboxId! },
    { enabled: lightboxId !== null }
  );

  // Load thumbnails for gallery
  const photoQueries = photos.map((p) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.destination.getPhoto.useQuery({ id: p.id }, { staleTime: 60_000 })
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only JPEG, PNG, and WebP images are allowed");
        setTimeout(() => setError(null), 4000);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Image exceeds 5MB size limit");
        setTimeout(() => setError(null), 4000);
        return;
      }
      if (photos.length >= MAX_PHOTOS) {
        setError(`Maximum of ${MAX_PHOTOS} photos per destination`);
        setTimeout(() => setError(null), 4000);
        return;
      }

      setIsUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Strip the data:type;base64, prefix for storage
        const base64 = dataUrl.split(",")[1];
        uploadMutation.mutate({
          destinationId,
          data: base64,
          mimeType: file.type,
        });
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    },
    [destinationId, photos.length, uploadMutation]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const currentLightboxIdx = lightboxId ? photos.findIndex((p) => p.id === lightboxId) : -1;

  const goNext = () => {
    if (currentLightboxIdx < photos.length - 1) {
      setLightboxId(photos[currentLightboxIdx + 1].id);
    }
  };
  const goPrev = () => {
    if (currentLightboxIdx > 0) {
      setLightboxId(photos[currentLightboxIdx - 1].id);
    }
  };

  return (
    <div className="photo-gallery">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", color: "var(--primary)" }}
          >
            photo_library
          </span>
          <span
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--on-surface)",
            }}
          >
            Photos
          </span>
          <span
            className="neu-chip"
            style={{ padding: "2px 8px", fontSize: "10px" }}
          >
            {photos.length}/{MAX_PHOTOS}
          </span>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div
          className="flex items-center gap-2 p-3 mb-4 text-sm"
          style={{
            background: "var(--error-container)",
            color: "var(--on-error-container)",
            borderRadius: "var(--radius)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            error
          </span>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ color: "var(--on-error-container)", background: "none", border: "none", cursor: "pointer" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
          </button>
        </div>
      )}

      {/* Photo grid */}
      <div className="photo-grid">
        {photos.map((photo, idx) => {
          const query = photoQueries[idx];
          const photoData = query?.data;
          return (
            <button
              key={photo.id}
              className="photo-grid-item neu-inset"
              onClick={() => setLightboxId(photo.id)}
              style={{
                border: "none",
                cursor: "pointer",
                padding: 0,
                position: "relative",
                overflow: "hidden",
                borderRadius: "var(--radius-sm)",
                aspectRatio: "1",
              }}
            >
              {photoData ? (
                <img
                  src={`data:${photoData.mimeType};base64,${photoData.data}`}
                  alt={photo.caption ?? "Photo"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                  className="photo-thumb"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center animate-pulse"
                  style={{ background: "var(--surface-container-high)" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "24px", color: "var(--outline-variant)" }}
                  >
                    image
                  </span>
                </div>
              )}
              {/* Caption overlay */}
              {photo.caption && (
                <div
                  className="photo-caption-overlay"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "6px 8px",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "10px",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  {photo.caption}
                </div>
              )}
            </button>
          );
        })}

        {/* Upload area */}
        {!readOnly && photos.length < MAX_PHOTOS && (
          <button
            className={`photo-upload-zone ${dragActive ? "photo-upload-zone-active" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: "none",
              cursor: "pointer",
              aspectRatio: "1",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "16px",
              transition: "all 0.2s ease",
            }}
          >
            {isUploading ? (
              <>
                <span
                  className="inline-block"
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "2px solid var(--outline-variant)",
                    borderTopColor: "var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--primary)",
                  }}
                >
                  Uploading…
                </span>
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "28px",
                    color: dragActive ? "var(--primary)" : "var(--outline-variant)",
                    transition: "color 0.2s",
                  }}
                >
                  add_photo_alternate
                </span>
                <span
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    textAlign: "center",
                  }}
                >
                  {dragActive ? "Drop here" : "Add photo"}
                </span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </div>

      {/* Empty state */}
      {photos.length === 0 && readOnly && (
        <div
          className="neu-inset p-8 text-center"
          style={{ borderRadius: "var(--radius)" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px", color: "var(--outline-variant)", display: "block", marginBottom: "8px" }}
          >
            photo_camera
          </span>
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              color: "var(--on-surface-variant)",
            }}
          >
            No photos uploaded yet.
          </p>
        </div>
      )}

      {/* Lightbox modal */}
      {lightboxId !== null && lightboxPhoto && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxId(null)}
        >
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxId(null)}
              className="lightbox-close"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                cursor: "pointer",
                color: "#fff",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>close</span>
            </button>

            {/* Image */}
            <img
              src={`data:${lightboxPhoto.mimeType};base64,${lightboxPhoto.data}`}
              alt={lightboxPhoto.caption ?? "Photo"}
              className="lightbox-image"
            />

            {/* Bottom bar */}
            <div className="lightbox-bar">
              {/* Nav arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentLightboxIdx <= 0}
                  className="lightbox-nav"
                  style={{ opacity: currentLightboxIdx <= 0 ? 0.3 : 1 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    chevron_left
                  </span>
                </button>
                <span
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {currentLightboxIdx + 1} / {photos.length}
                </span>
                <button
                  onClick={goNext}
                  disabled={currentLightboxIdx >= photos.length - 1}
                  className="lightbox-nav"
                  style={{ opacity: currentLightboxIdx >= photos.length - 1 ? 0.3 : 1 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    chevron_right
                  </span>
                </button>
              </div>

              {/* Caption */}
              {lightboxPhoto.caption && (
                <span
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.85)",
                    flex: 1,
                    textAlign: "center",
                    padding: "0 16px",
                  }}
                >
                  {lightboxPhoto.caption}
                </span>
              )}

              {/* Delete */}
              {!readOnly && (
                <button
                  onClick={() => {
                    if (confirm("Delete this photo?")) {
                      deleteMutation.mutate({ id: lightboxId });
                    }
                  }}
                  className="lightbox-nav"
                  style={{ color: "#ff6b6b" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    delete
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
