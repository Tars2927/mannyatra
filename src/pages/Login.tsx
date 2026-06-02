function getOAuthUrl() {
  return "/api/auth/google";
}

export default function Login() {
  const handleContinue = () => {
    window.location.href = getOAuthUrl();
  };

  return (
    <div className="login-scene">
      {/* ── Animated gradient background ──────────────────────────── */}
      <div className="login-bg" />

      {/* ── Floating travel elements ─────────────────────────────── */}
      <div className="login-elements">
        {/* Floating clouds */}
        <svg className="cloud cloud-1" viewBox="0 0 200 80" fill="rgba(255,255,255,0.15)">
          <ellipse cx="60" cy="50" rx="60" ry="30"/>
          <ellipse cx="100" cy="35" rx="50" ry="28"/>
          <ellipse cx="140" cy="50" rx="55" ry="25"/>
        </svg>
        <svg className="cloud cloud-2" viewBox="0 0 200 80" fill="rgba(255,255,255,0.1)">
          <ellipse cx="60" cy="50" rx="55" ry="25"/>
          <ellipse cx="110" cy="38" rx="45" ry="24"/>
          <ellipse cx="150" cy="50" rx="50" ry="22"/>
        </svg>
        <svg className="cloud cloud-3" viewBox="0 0 200 80" fill="rgba(255,255,255,0.08)">
          <ellipse cx="50" cy="50" rx="50" ry="22"/>
          <ellipse cx="95" cy="40" rx="42" ry="20"/>
          <ellipse cx="135" cy="50" rx="48" ry="20"/>
        </svg>

        {/* Animated plane */}
        <div className="plane-wrapper">
          <svg className="plane-icon" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)" width="48" height="48">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
          {/* Contrail / trail */}
          <div className="plane-trail" />
        </div>

        {/* Floating map pins */}
        <div className="map-pin pin-1">
          <span className="material-symbols-outlined">location_on</span>
        </div>
        <div className="map-pin pin-2">
          <span className="material-symbols-outlined">location_on</span>
        </div>
        <div className="map-pin pin-3">
          <span className="material-symbols-outlined">explore</span>
        </div>

        {/* Globe wireframe rings */}
        <div className="globe-ring ring-1" />
        <div className="globe-ring ring-2" />
      </div>

      {/* ── Login card (glassmorphic) ────────────────────────────── */}
      <div className="login-content">
        <div className="login-card">
          {/* Brand */}
          <div className="login-brand">
            <div className="brand-icon-ring">
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#fff" }}>
                flight_takeoff
              </span>
            </div>
            <h1 className="brand-title">Mannyatra</h1>
            <p className="brand-tagline">Dream. Plan. Do.</p>
          </div>

          {/* Divider */}
          <div className="login-divider" />

          {/* Card body */}
          <h2 className="login-heading">Welcome aboard</h2>
          <p className="login-subtitle">
            Sign in with Google to track your travel goals, invite friends, and check off adventures.
          </p>

          {/* Google button */}
          <button type="button" onClick={handleContinue} className="google-btn">
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.54l7.97-5.95z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.95C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          {/* Stats teaser */}
          <div className="login-stats">
            <div className="stat-chip">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>public</span>
              195+ countries
            </div>
            <div className="stat-chip">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>group</span>
              Invite friends
            </div>
            <div className="stat-chip">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>verified</span>
              Free forever
            </div>
          </div>

          {/* Footer */}
          <p className="login-footer">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* ── Inline styles (scoped to login) ──────────────────────── */}
      <style>{`
        .login-scene {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          font-family: 'Manrope', sans-serif;
        }

        /* ── Animated gradient background ────────────────────────── */
        .login-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            #0f172a 0%,
            #1e3a5f 20%,
            #2d6a9f 40%,
            #4a90bf 55%,
            #f09433 75%,
            #e6683c 85%,
            #dc2743 100%
          );
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ── Floating elements container ─────────────────────────── */
        .login-elements {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        /* ── Clouds ──────────────────────────────────────────────── */
        .cloud {
          position: absolute;
          width: 220px;
          height: 80px;
        }
        .cloud-1 {
          top: 10%;
          left: -220px;
          animation: floatCloud 25s linear infinite;
        }
        .cloud-2 {
          top: 30%;
          left: -220px;
          animation: floatCloud 35s linear infinite 8s;
          width: 180px;
        }
        .cloud-3 {
          top: 55%;
          left: -220px;
          animation: floatCloud 30s linear infinite 15s;
          width: 160px;
        }
        @keyframes floatCloud {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(100vw + 440px)); }
        }

        /* ── Plane ───────────────────────────────────────────────── */
        .plane-wrapper {
          position: absolute;
          top: 18%;
          left: -80px;
          animation: flyPlane 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }
        .plane-icon {
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
          transform: rotate(-15deg);
        }
        .plane-trail {
          position: absolute;
          top: 50%;
          right: 42px;
          width: 120px;
          height: 2px;
          background: linear-gradient(to left, rgba(255,255,255,0.4), transparent);
          transform: translateY(-50%);
          border-radius: 1px;
        }
        @keyframes flyPlane {
          0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
          5%   { opacity: 1; }
          50%  { transform: translate(calc(50vw + 40px), -60px) scale(1); opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translate(calc(100vw + 160px), -120px) scale(0.7); opacity: 0; }
        }

        /* ── Map pins ────────────────────────────────────────────── */
        .map-pin {
          position: absolute;
          color: rgba(255, 255, 255, 0.25);
          animation: floatPin 6s ease-in-out infinite;
        }
        .map-pin .material-symbols-outlined {
          font-size: 28px;
        }
        .pin-1 { top: 65%; left: 8%; animation-delay: 0s; }
        .pin-2 { top: 20%; right: 12%; animation-delay: 2s; color: rgba(255,255,255,0.18); }
        .pin-3 { bottom: 15%; right: 20%; animation-delay: 4s; color: rgba(255,255,255,0.15); }
        .pin-3 .material-symbols-outlined { font-size: 36px; }
        @keyframes floatPin {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-15px) rotate(5deg); }
        }

        /* ── Globe rings ─────────────────────────────────────────── */
        .globe-ring {
          position: absolute;
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 50%;
        }
        .ring-1 {
          width: 300px; height: 300px;
          bottom: -100px; right: -80px;
          animation: spinRing 40s linear infinite;
        }
        .ring-2 {
          width: 220px; height: 220px;
          bottom: -60px; right: -30px;
          animation: spinRing 30s linear infinite reverse;
          border-style: dashed;
        }
        @keyframes spinRing {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ── Login card ──────────────────────────────────────────── */
        .login-content {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(24px) saturate(1.6);
          -webkit-backdrop-filter: blur(24px) saturate(1.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 28px;
          padding: 36px 28px;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          animation: cardFloat 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(40px) scale(0.95);
        }

        @keyframes cardFloat {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── Brand area ──────────────────────────────────────────── */
        .login-brand {
          text-align: center;
          margin-bottom: 20px;
        }
        .brand-icon-ring {
          width: 56px;
          height: 56px;
          margin: 0 auto 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulseRing 3s ease-in-out infinite;
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.2); }
          50%      { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
        }
        .brand-title {
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.1;
          text-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }
        .brand-tagline {
          font-size: 14px;
          font-weight: 400;
          color: rgba(255,255,255,0.7);
          margin: 6px 0 0;
        }

        /* ── Divider ─────────────────────────────────────────────── */
        .login-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
          margin: 20px 0;
        }

        .login-heading {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          margin: 0 0 8px;
        }
        .login-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          text-align: center;
          line-height: 1.6;
          margin: 0 0 24px;
        }

        /* ── Google button ───────────────────────────────────────── */
        .google-btn {
          width: 100%;
          height: 52px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255, 255, 255, 0.95);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-family: 'Manrope', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #1a1a2e;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transition: all 0.25s ease;
        }
        .google-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          background: #fff;
        }
        .google-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        /* ── Stat chips ──────────────────────────────────────────── */
        .login-stats {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .stat-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 5px 12px;
        }

        .login-footer {
          text-align: center;
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          margin-top: 20px;
          line-height: 1.6;
        }

        /* ── Mobile tweaks ───────────────────────────────────────── */
        @media (max-width: 480px) {
          .login-card {
            padding: 28px 20px;
            border-radius: 24px;
          }
          .brand-title { font-size: 28px; }
          .plane-wrapper { display: none; }
          .globe-ring { display: none; }
        }
      `}</style>
    </div>
  );
}
