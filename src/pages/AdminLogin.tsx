import { useState } from "react";
import { useNavigate } from "react-router";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Invalid password");
        return;
      }
      navigate("/admin/email");
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <form
        onSubmit={handleLogin}
        className="neu-extruded flex flex-col gap-6 w-full max-w-sm"
        style={{ borderRadius: "var(--radius-lg)", padding: "40px 32px" }}
      >
        <div className="text-center">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "40px", color: "var(--primary)", marginBottom: "8px", display: "block" }}
          >
            admin_panel_settings
          </span>
          <h2
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--on-surface)",
              margin: "0 0 4px",
            }}
          >
            Admin Access
          </h2>
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              color: "var(--on-surface-variant)",
            }}
          >
            Email Campaign Dashboard
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="neu-input"
          autoFocus
          required
        />

        {error && (
          <p
            style={{
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              color: "var(--error)",
              textAlign: "center",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="neu-button-filled w-full h-12 flex items-center justify-center gap-2"
          style={{ fontSize: "14px" }}
        >
          {loading ? (
            <span
              className="inline-block"
              style={{
                width: "18px",
                height: "18px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                lock_open
              </span>
              Enter Dashboard
            </>
          )}
        </button>
      </form>
    </div>
  );
}
