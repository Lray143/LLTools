import { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";

function LoginPage({ onLogin }) {
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [isLoading,    setIsLoading]    = useState(false);
  const [keepLogged,   setKeepLogged]   = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!username.trim()) { setError("Please enter your username."); return; }
    if (!password.trim()) { setError("Please enter your password.");  return; }

    setIsLoading(true);

    const result = await window.electronAPI.login({ username, password });

    setIsLoading(false);

    if (result.success) {
      onLogin(result.user, keepLogged);
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      className="login-wrapper flex h-screen"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        /* ── Pin all theme CSS variables so the active theme cannot bleed in ── */
        '--page-bg':        '#f9f9fb',
        '--page-bg-alt':    '#f0f0f2',
        '--surface':        '#ffffff',
        '--surface-hover':  '#f5f5f7',
        '--border':         '#e5e5e5',
        '--border-strong':  '#d1d1d6',
        '--text-primary':   '#1a1a1a',
        '--text-secondary': '#6b7280',
        '--accent-bg':      '#f97316',
        '--accent-text':    '#ffffff',
        '--accent-hover':   '#ea580c',
        '--sidebar-bg':     '#242426',
        '--sidebar-active': '#f97316',
        background:         '#f9f9fb',
        color:              '#1a1a1a',
        colorScheme:        'light',
        overflow:           'hidden',
      }}
    >
      {/* ── LEFT PANEL — brand strip ─────────────────────────────── */}
      <div
        className="hidden md:flex flex-col items-center justify-center"
        style={{
          width: "42%",
          background: "linear-gradient(160deg, #242426 0%, #1c1c1e 60%, #141416 100%)",
          borderRight: "1px solid rgba(249,115,22,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow orb */}
        <div style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Bottom gradient accent */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "200px",
          background: "linear-gradient(to top, rgba(249,115,22,0.04), transparent)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <img
          src="./Logo.png"
          alt="Double L Beauty Products"
          style={{
            width: "160px",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 24px rgba(249,115,22,0.28)) brightness(1.05)",
            marginBottom: "32px",
            position: "relative",
            zIndex: 1,
          }}
        />

        {/* Brand text */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <p style={{
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "rgba(249,115,22,0.6)",
            fontWeight: 600,
            marginBottom: "10px",
          }}>
            Internal Portal
          </p>
          <p style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#f0f0f0",
            lineHeight: 1.3,
            maxWidth: "220px",
            margin: "0 auto",
          }}>
            Double L Beauty Products
          </p>
        </div>

        {/* Decorative rule */}
        <div style={{
          width: "40px",
          height: "2px",
          background: "linear-gradient(90deg, transparent, #f97316, transparent)",
          borderRadius: "2px",
          margin: "24px auto 0",
          position: "relative",
          zIndex: 1,
        }} />

        {/* Footer */}
        <p style={{
          position: "absolute",
          bottom: "24px",
          fontSize: "10px",
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.5px",
        }}>
          LLTools v1.0 · © 2026
        </p>
      </div>

      {/* ── RIGHT PANEL — login form ──────────────────────────────── */}
      <div
        className="flex flex-col items-center justify-center flex-1"
        style={{
          background: "#f9f9fb",
          position: "relative",
        }}
      >
        {/* Subtle top-right brand accent */}
        <div style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Mobile-only logo */}
        <img
          src="./Logo.png"
          alt="Double L Beauty Products"
          className="md:hidden mb-8"
          style={{ width: "120px", objectFit: "contain" }}
        />

        {/* Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            padding: "40px 36px",
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e5e5e5",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Card header */}
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1a1a1a",
              margin: 0,
              marginBottom: "6px",
              letterSpacing: "-0.3px",
            }}>
              Welcome back
            </h1>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Username field */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="input-username"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
                letterSpacing: "0.1px",
              }}
            >
              Username
            </label>
            <input
              id="input-username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e5e5e5",
                background: "#f9f9fb",
                color: "#1a1a1a",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 150ms, box-shadow 150ms",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#f97316";
                e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                e.target.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e5e5";
                e.target.style.boxShadow = "none";
                e.target.style.background = "#f9f9fb";
              }}
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="input-password"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
                letterSpacing: "0.1px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="input-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 40px 10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e5e5e5",
                  background: "#f9f9fb",
                  color: "#1a1a1a",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 150ms, box-shadow 150ms",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#f97316";
                  e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                  e.target.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e5e5";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "#f9f9fb";
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "6px",
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f97316" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Keep me logged in */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              id="checkbox-keep-logged"
              type="checkbox"
              checked={keepLogged}
              onChange={(e) => setKeepLogged(e.target.checked)}
              style={{
                width: "14px",
                height: "14px",
                cursor: "pointer",
                accentColor: "#f97316"
              }}
            />
            <label
              htmlFor="checkbox-keep-logged"
              style={{
                fontSize: "12px",
                color: "#4b5563",
                cursor: "pointer",
                userSelect: "none"
              }}
            >
              Keep me logged in
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              marginBottom: "16px",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#fff5f5",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ color: "#dc2626", fontSize: "14px", lineHeight: 1 }}>⚠</span>
              <p style={{ fontSize: "12.5px", color: "#b91c1c", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: "10px",
              border: "none",
              background: isLoading
                ? "rgba(249,115,22,0.5)"
                : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.2px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.8 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontFamily: "inherit",
              transition: "opacity 150ms, transform 100ms, box-shadow 150ms",
              boxShadow: isLoading ? "none" : "0 2px 12px rgba(249,115,22,0.35)",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.opacity = "0.93";
                e.currentTarget.style.boxShadow = "0 4px 18px rgba(249,115,22,0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(249,115,22,0.35)";
            }}
            onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = "scale(0.985)" }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
          >
            <LogIn size={15} strokeWidth={2} />
            {isLoading ? "Signing in…" : "Sign In"}
          </button>

          {/* Footer note */}
          <p style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "11px",
            color: "#d1d5db",
            letterSpacing: "0.2px",
          }}>
            Double L Beauty Products · Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;