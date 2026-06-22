import { useState, useEffect } from "react";
import { Download, CheckCircle, RefreshCw, ChevronRight } from "lucide-react";

function UpdaterSplash({ onComplete }) {
  const [updateState, setUpdateState] = useState("checking");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!window.electronAPI?.updater) {
      // If running in an environment without the updater (e.g., browser), skip
      onComplete();
      return;
    }

    const { updater } = window.electronAPI;

    const unsubs = [
      updater.onChecking(() => setUpdateState("checking")),
      updater.onUpdateAvailable(() => setUpdateState("available")),
      updater.onUpdateNotAvailable(() => {
        setUpdateState("idle");
        // Proceed to app after a brief delay if no update is found
        setTimeout(() => onComplete(), 800);
      }),
      updater.onDownloadProgress((p) => {
        setUpdateState("downloading");
        setProgress(Math.round(p.percent));
      }),
      updater.onUpdateDownloaded(() => setUpdateState("downloaded")),
      updater.onError((err) => {
        setUpdateState("error");
        setErrorMsg(err);
      }),
    ];

    // Trigger the initial check
    updater.check();

    return () => unsubs.forEach((fn) => fn());
  }, [onComplete]);

  const handleUpdateNow = () => {
    if (!window.electronAPI?.updater) return;
    if (updateState === "available") {
      window.electronAPI.updater.download();
    } else if (updateState === "downloaded") {
      window.electronAPI.updater.install();
    } else if (updateState === "error") {
      window.electronAPI.updater.check(); // Retry
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div
      className="updater-wrapper flex h-screen"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        /* ── Pin all theme CSS variables so the active theme cannot bleed in ── */
        "--page-bg": "#f9f9fb",
        "--page-bg-alt": "#f0f0f2",
        "--surface": "#ffffff",
        "--surface-hover": "#f5f5f7",
        "--border": "#e5e5e5",
        "--border-strong": "#d1d1d6",
        "--text-primary": "#1a1a1a",
        "--text-secondary": "#6b7280",
        "--accent-bg": "#f97316",
        "--accent-text": "#ffffff",
        "--accent-hover": "#ea580c",
        background: "#f9f9fb",
        color: "#1a1a1a",
        colorScheme: "light",
        overflow: "hidden",
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
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Bottom gradient accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "200px",
            background: "linear-gradient(to top, rgba(249,115,22,0.04), transparent)",
            pointerEvents: "none",
          }}
        />

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
          <p
            style={{
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "rgba(249,115,22,0.6)",
              fontWeight: 600,
              marginBottom: "10px",
            }}
          >
            Internal Portal
          </p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#f0f0f0",
              lineHeight: 1.3,
              maxWidth: "220px",
              margin: "0 auto",
            }}
          >
            Double L Beauty Products
          </p>
        </div>

        {/* Decorative rule */}
        <div
          style={{
            width: "40px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #f97316, transparent)",
            borderRadius: "2px",
            margin: "24px auto 0",
            position: "relative",
            zIndex: 1,
          }}
        />

        {/* Footer */}
        <p
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "10px",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.5px",
          }}
        >
          LLTools v1.0 · © 2026
        </p>
      </div>

      {/* ── RIGHT PANEL — updater prompt ──────────────────────────────── */}
      <div
        className="flex flex-col items-center justify-center flex-1"
        style={{
          background: "#f9f9fb",
          position: "relative",
        }}
      >
        {/* Subtle top-right brand accent */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(249,115,22,0.1)",
              color: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            {updateState === "checking" && <RefreshCw size={24} className="animate-spin" />}
            {updateState === "available" && <Download size={24} />}
            {updateState === "downloading" && <Download size={24} className="animate-pulse" />}
            {updateState === "downloaded" && <CheckCircle size={24} />}
            {updateState === "error" && <RefreshCw size={24} />}
            {updateState === "idle" && <CheckCircle size={24} />}
          </div>

          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1a1a1a",
              margin: 0,
              marginBottom: "8px",
              letterSpacing: "-0.3px",
            }}
          >
            {updateState === "checking" && "Checking for Updates"}
            {updateState === "available" && "Update Available"}
            {updateState === "downloading" && "Downloading Update"}
            {updateState === "downloaded" && "Ready to Install"}
            {updateState === "error" && "Update Failed"}
            {updateState === "idle" && "Up to date"}
          </h1>

          <p style={{ fontSize: "13.5px", color: "#6b7280", margin: 0, marginBottom: "32px", lineHeight: 1.5 }}>
            {updateState === "checking" && "Please wait a moment while we check for the latest version..."}
            {updateState === "available" && "A new version of LLTools is available. Would you like to update now?"}
            {updateState === "downloading" && `Downloading the latest updates. Please wait... (${progress}%)`}
            {updateState === "downloaded" && "The update has been downloaded and is ready to install."}
            {updateState === "error" && (errorMsg || "An error occurred while checking for updates. You can skip and try again later.")}
            {updateState === "idle" && "You are running the latest version. Taking you to login..."}
          </p>

          {/* Progress Bar for Downloading State */}
          {updateState === "downloading" && (
            <div
              style={{
                width: "100%",
                height: "6px",
                background: "#f0f0f2",
                borderRadius: "3px",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #f97316 0%, #ea580c 100%)",
                  transition: "width 200ms ease-out",
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
            {(updateState === "available" || updateState === "downloaded" || updateState === "error") && (
              <button
                type="button"
                onClick={handleUpdateNow}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.2px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "inherit",
                  transition: "opacity 150ms, transform 100ms, box-shadow 150ms",
                  boxShadow: "0 2px 12px rgba(249,115,22,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.93";
                  e.currentTarget.style.boxShadow = "0 4px 18px rgba(249,115,22,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(249,115,22,0.35)";
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.985)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {updateState === "available" && "Update Now"}
                {updateState === "downloaded" && "Restart & Install"}
                {updateState === "error" && "Retry"}
              </button>
            )}

            {(updateState === "available" || updateState === "error") && (
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: "10px",
                  border: "1px solid #e5e5e5",
                  background: "transparent",
                  color: "#4b5563",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Skip for now <ChevronRight size={16} />
              </button>
            )}
            
            {/* If checking or downloading, we can optionally provide a skip button, but it's cleaner to wait for checking to finish.
                If downloading, it's already in progress. We'll only show skip during available/error. */}
            {updateState === "checking" && (
                <button
                type="button"
                onClick={handleSkip}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: "10px",
                  border: "1px solid transparent",
                  background: "transparent",
                  color: "#9ca3af",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                Skip check
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            position: "absolute",
            bottom: "24px",
            textAlign: "center",
            fontSize: "11px",
            color: "#d1d5db",
            letterSpacing: "0.2px",
          }}
        >
          Double L Beauty Products · Internal Use Only
        </p>
      </div>
    </div>
  );
}

export default UpdaterSplash;
