import { Link } from "react-router";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="neu-card w-full max-w-sm text-center" style={{ borderRadius: "var(--radius-xl)", padding: "40px" }}>
        <div className="w-16 h-16 rounded-full neu-inset flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)" }}>explore</span>
        </div>

        <h1 className="text-display mb-2">404</h1>
        <p className="text-body-md mb-8" style={{ color: "var(--on-surface-variant)" }}>
          This destination doesn't exist yet.
        </p>

        <Link to="/">
          <button className="neu-button-filled w-full h-14 text-sm font-semibold">
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
