import { useEffect, useState } from "react";

interface BucketDropAnimationProps {
  /** The name of the place/item being added */
  itemName: string;
  /** Called when the animation finishes */
  onComplete: () => void;
}

/**
 * Full-screen overlay that plays a "dropping into bucket" animation
 * when a destination is added to the bucket list.
 *
 * Sequence:
 *  1. Card fades in at center, rises up
 *  2. Card shrinks + rotates and drops into the bucket
 *  3. Bucket wobbles + splash particles fly out
 *  4. Success checkmark appears
 *  5. Everything fades out
 */
export default function BucketDropAnimation({ itemName, onComplete }: BucketDropAnimationProps) {
  const [phase, setPhase] = useState<"enter" | "drop" | "splash" | "done">("enter");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Phase 1: Card appears (0ms)
    // Phase 2: Card drops into bucket (600ms)
    timers.push(setTimeout(() => setPhase("drop"), 600));
    // Phase 3: Splash effect (1200ms)
    timers.push(setTimeout(() => setPhase("splash"), 1200));
    // Phase 4: Done + fade out (2200ms)
    timers.push(setTimeout(() => setPhase("done"), 2400));
    // Complete (2800ms)
    timers.push(setTimeout(() => onComplete(), 2900));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "rgba(247, 249, 252, 0.85)",
        backdropFilter: "blur(8px)",
        opacity: phase === "done" ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: "none",
      }}
    >
      {/* ── Floating card ───────────────────────────────── */}
      <div
        style={{
          width: "200px",
          padding: "20px",
          borderRadius: "16px",
          background: "var(--surface)",
          boxShadow: "-6px -6px 14px var(--shadow-light), 6px 6px 14px var(--shadow-dark)",
          textAlign: "center",
          fontFamily: "Manrope, sans-serif",
          transition: "all 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
          transform:
            phase === "enter"
              ? "translateY(-40px) scale(1) rotate(0deg)"
              : phase === "drop"
              ? "translateY(120px) scale(0.5) rotate(-12deg)"
              : "translateY(120px) scale(0) rotate(-20deg)",
          opacity: phase === "enter" ? 1 : phase === "drop" ? 0.8 : 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "32px", color: "var(--primary)", display: "block", marginBottom: "8px" }}
        >
          pin_drop
        </span>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--on-surface)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {itemName}
        </p>
      </div>

      {/* ── Bucket ──────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          marginTop: phase === "enter" ? "60px" : "0px",
          transition: "margin-top 0.4s ease",
        }}
      >
        {/* Bucket body */}
        <div
          style={{
            width: "120px",
            height: "90px",
            borderRadius: "0 0 24px 24px",
            background: "linear-gradient(180deg, var(--primary-container) 0%, var(--primary) 100%)",
            boxShadow: "inset 0 -8px 16px rgba(0,0,0,0.1), -4px -4px 10px var(--shadow-light), 4px 4px 10px var(--shadow-dark)",
            position: "relative",
            overflow: "hidden",
            animation:
              phase === "splash" ? "bucketWobble 0.5s ease-in-out" : "none",
          }}
        >
          {/* Inner shadow for depth */}
          <div
            style={{
              position: "absolute",
              inset: "8px",
              borderRadius: "0 0 18px 18px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
            }}
          />
          {/* Water level effect */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: phase === "splash" || phase === "done" ? "50%" : "20%",
              background: "var(--sidebar-badge-bg)",
              borderRadius: "0 0 18px 18px",
              transition: "height 0.6s ease",
            }}
          />
        </div>

        {/* Bucket handle */}
        <div
          style={{
            position: "absolute",
            top: "-20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80px",
            height: "30px",
            border: "4px solid var(--primary)",
            borderBottom: "none",
            borderRadius: "40px 40px 0 0",
          }}
        />

        {/* ── Splash particles ─────────────────────────── */}
        {(phase === "splash" || phase === "done") && (
          <>
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * 360;
              const distance = 40 + Math.random() * 30;
              const size = 6 + Math.random() * 6;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "50%",
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    background: i % 2 === 0 ? "var(--primary)" : "var(--primary-container)",
                    transform: `translate(-50%, -50%) translate(${Math.cos((angle * Math.PI) / 180) * distance}px, ${Math.sin((angle * Math.PI) / 180) * distance - 20}px)`,
                    opacity: phase === "done" ? 0 : 1,
                    animation: "splashParticle 0.6s ease-out forwards",
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              );
            })}
          </>
        )}
      </div>

      {/* ── Success message ─────────────────────────────── */}
      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
          opacity: phase === "splash" || phase === "done" ? 1 : 0,
          transform: phase === "splash" || phase === "done" ? "translateY(0) scale(1)" : "translateY(10px) scale(0.8)",
          transition: "all 0.4s ease",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "-4px -4px 8px var(--shadow-light), 4px 4px 8px var(--shadow-dark)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--on-primary)" }}>
            check
          </span>
        </div>
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--on-surface)",
            margin: 0,
          }}
        >
          Added to My List!
        </p>
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "13px",
            color: "var(--on-surface-variant)",
            marginTop: "4px",
          }}
        >
          {itemName}
        </p>
      </div>
    </div>
  );
}
