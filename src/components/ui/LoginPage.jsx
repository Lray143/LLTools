// src/components/LoginPage.jsx
//
// ════════════════════════════════════════════════════════════════
// DOUBLE L BEAUTY PRODUCTS — HR PORTAL LOGIN PAGE
// ════════════════════════════════════════════════════════════════
//
// This component is the entry point for the HR Portal desktop app.
// It renders a full-screen login card with two modes:
//   • HR / Admin  → shows Employee ID + Password fields + Sign In button
//   • Staff       → collapses fields entirely, shows only an "Enter as Staff" button
//
// ── DEPENDENCIES ──────────────────────────────────────────────
// React       → useState for all form and UI state
// lucide-react → SVG icon set (no shadcn needed; icons used directly in <button>)
// Tailwind v3 → utility classes for layout, spacing, transitions
// ──────────────────────────────────────────────────────────────

import { useState } from "react";

// lucide-react icons — tree-shakeable SVG components.
// Swap any icon by replacing the import name with another from https://lucide.dev/icons/
import {
  LogIn,              // inside the HR "Sign in" button
  UserRound,          // Staff role card icon
  BriefcaseBusiness,  // HR / Admin role card icon
  ArrowRight,         // Staff entry button icon
  Eye,                // show-password toggle
  EyeOff,             // hide-password toggle
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONFIG
//
// Add / remove roles here without touching any JSX below.
// Each entry controls:
//   id         → stored in selectedRole state; included in the auth payload
//   label      → primary text on the role card button
//   sublabel   → smaller descriptor line on the role card
//   Icon       → lucide-react component rendered inside the card
//   showFields → true  = show Employee ID + Password inputs + Sign In button
//               false = collapse all inputs; only the Staff entry button appears
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: "hr",
    label: "HR / Admin",
    sublabel: "Full access",
    Icon: BriefcaseBusiness,
    showFields: true,   // HR must supply credentials before entering
  },
  {
    id: "staff",
    label: "Staff",
    sublabel: "Limited access",
    Icon: UserRound,
    showFields: false,  // Staff skips credentials; goes straight to the dashboard
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage
//
// Props:
//   onLogin(payload) — called when the user successfully authenticates.
//                      payload = { role, employeeId, password }
//                      Wire up in App.jsx to handle routing / state changes.
//
// Navigation wiring (TODO — pick one when you're ready):
//   React Router v6 → const navigate = useNavigate();
//                      inside handleHRSubmit: navigate("/dashboard");
//                      inside handleStaffEntry: navigate("/staff-dashboard");
//   Electron IPC    → window.electron.ipcRenderer.send("login", payload);
//   Parent state    → if (onLogin) onLogin(payload);  ← current placeholder
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {

  // ── FORM STATE ──────────────────────────────────────────────────────────────
  const [selectedRole,  setSelectedRole]  = useState("hr");   // "hr" | "staff"
  const [employeeId,    setEmployeeId]    = useState("");      // Employee ID or email string
  const [password,      setPassword]      = useState("");      // Raw password — hash before sending to API
  const [showPassword,  setShowPassword]  = useState(false);   // Toggles input type text ↔ password

  // ── UI STATE ────────────────────────────────────────────────────────────────
  const [error,     setError]     = useState("");    // Inline validation / server error message
  const [isLoading, setIsLoading] = useState(false); // True while awaiting the auth API response

  // Derived from selectedRole — drives the conditional rendering of credential fields.
  // When showFields is false the input block collapses via max-height transition.
  const activeRole    = ROLES.find((r) => r.id === selectedRole);
  const fieldsVisible = activeRole?.showFields ?? true;

  // ─────────────────────────────────────────────────────────────────────────────
  // handleHRSubmit
  //
  // Fires when the HR "Sign in to Portal" button is clicked.
  // 1. Runs basic client-side validation (swap for zod/yup when ready).
  // 2. Builds the auth payload.
  // 3. Calls onLogin(payload) — replace with a real fetch() call to your API.
  //
  // TODO (real auth):
  //   const res  = await fetch("/api/login", { method: "POST", body: JSON.stringify(payload) });
  //   const data = await res.json();
  //   if (!res.ok) { setError(data.message); return; }
  //   navigate("/dashboard");   ← or onLogin(payload) to let App.jsx handle routing
  // ─────────────────────────────────────────────────────────────────────────────
  const handleHRSubmit = async () => {
    setError(""); // clear any previous error before re-validating

    if (!employeeId.trim()) {
      setError("Please enter your Employee ID or Email.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    // ── AUTH PAYLOAD ─────────────────────────────────────────────────────────
    // This is the object POSTed to the backend / Supabase auth endpoint.
    // Hash the password server-side; never store or log plaintext passwords.
    const payload = {
      role: selectedRole, // "hr"
      employeeId,
      password,
    };

    // Simulated API delay — DELETE this block once the real fetch() is wired
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsLoading(false);

    // ── NAVIGATION (TODO) ────────────────────────────────────────────────────
    // Replace with: navigate("/dashboard")  or  ipcRenderer.send("login", payload)
    if (onLogin) onLogin(payload);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // handleStaffEntry
  //
  // Fires when the Staff "Enter as Staff" button is clicked.
  // No credentials needed — staff goes straight to a read-only dashboard view.
  //
  // TODO (navigation):
  //   React Router v6 → navigate("/staff-dashboard")
  //   Electron IPC    → window.electron.ipcRenderer.send("staff-entry")
  //   Parent state    → onLogin({ role: "staff" })  ← current placeholder
  // ─────────────────────────────────────────────────────────────────────────────
  const handleStaffEntry = () => {
    if (onLogin) onLogin({ role: "staff" });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (

    // ── FULL-SCREEN BACKGROUND WRAPPER ──────────────────────────────────────
    // Fills the entire Electron window (h-screen).
    // Radial gradient creates the warm amber / dark-brown atmosphere that
    // matches the Double L brand palette.
    // Update the three color stops here if the brand palette ever changes.
    <div
      className="flex h-screen items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 40% 30%, #4a2c0a 0%, #1c0e02 55%, #0d0700 100%)",
      }}
    >

      {/* ── LOGIN CARD ────────────────────────────────────────────────────────
          Frosted-glass card centred over the gradient background.
          • backdrop-filter blur → depth illusion over the gradient BG
          • amber border stroke  → luxury brand reinforcement
          • maxWidth 400px       → comfortable single-column form width
          • rounded-3xl          → soft modern corners
          ────────────────────────────────────────────────────────────────────── */}
      <div
        className="w-full rounded-3xl px-8 py-10 flex flex-col items-center"
        style={{
          maxWidth: "400px",
          background: "rgba(28, 14, 2, 0.82)",
          border: "1px solid rgba(200, 120, 30, 0.30)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",  // Safari support
          boxShadow:
            "0 16px 70px rgba(0,0,0,0.60), 0 0 0 1px rgba(200,120,30,0.06) inset",
        }}
      >

        {/* ── LOGO + BRAND SECTION ──────────────────────────────────────────
            Loads Logo.png from the /public folder (Vite serves it at root /).
            • If the logo file is renamed, update src="/" below.
            • Adjust width (88px) if the logo has too much / too little whitespace.
            • The brand-name text beneath can be removed if the logo already
              contains the full wordmark.
            ────────────────────────────────────────────────────────────────── */}
        <div className="text-center mb-6">

          {/* Company logo — /public/Logo.png referenced via Vite's root-relative path */}
          <img
            src="/Logo.png"
            alt="Double L Beauty Products logo"
            className="mx-auto mb-2"
            style={{
              width: "150px",        // visual weight anchor; tweak as needed
              height: "auto",       // preserve aspect ratio — never squish the logo
              objectFit: "contain",
              filter: "drop-shadow(0 2px 12px rgba(200, 130, 40, 0.35))", // warm glow lift
            }}
          />
        </div>

        {/* ── WELCOME COPY ──────────────────────────────────────────────────
            Static heading and subtitle — edit the strings here only.
            ────────────────────────────────────────────────────────────────── */}
        <div className="text-center mb-6">
          <h1 className="font-medium mb-1" style={{ fontSize: "22px", color: "#f0e0c0" }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(200,170,120,0.6)" }}>
            Choose your role to continue
          </p>
        </div>

        {/* ── ROLE SELECTOR CARDS ───────────────────────────────────────────
            Maps the ROLES array into clickable toggle cards.
            Selecting a card:
              1. Updates selectedRole state → applies active styling
              2. Clears any existing validation error
              3. Drives the fieldsVisible derived value → shows/collapses inputs

            Plain <button> elements — no external component library needed.
            All styling is inline or Tailwind utilities.
            ────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 w-full mb-5">
          {ROLES.map((role) => {
            const isActive = selectedRole === role.id;
            const RoleIcon = role.Icon; // lucide component reference

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRole(role.id);
                  setError(""); // wipe validation errors when the user switches roles
                }}
                className="flex flex-col items-center py-4 px-3 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  // Active: warm amber tint + prominent border
                  // Inactive: nearly invisible surface — blend into the card BG
                  background: isActive
                    ? "rgba(180, 90, 10, 0.38)"
                    : "rgba(255, 255, 255, 0.04)",
                  border: isActive
                    ? "1.5px solid rgba(200, 120, 30, 0.65)"
                    : "1.5px solid rgba(255, 255, 255, 0.09)",
                  outline: "none", // remove default browser focus outline; add custom if needed
                }}
              >
                {/* lucide icon — 1.6px stroke for an elegant, light feel */}
                <RoleIcon
                  size={22}
                  strokeWidth={1.6}
                  style={{
                    marginBottom: "6px",
                    color: isActive ? "#f0d090" : "rgba(180,170,220,0.7)",
                  }}
                />

                {/* Role label */}
                <span
                  className="font-medium"
                  style={{ fontSize: "13px", color: isActive ? "#f0d090" : "#c0b8e0" }}
                >
                  {role.label}
                </span>

                {/* Access level sub-label */}
                <span
                  style={{
                    fontSize: "10px",
                    color: isActive ? "rgba(200,160,80,0.6)" : "rgba(160,150,200,0.45)",
                    marginTop: "2px",
                  }}
                >
                  {role.sublabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── COLLAPSIBLE CREDENTIAL FIELDS BLOCK ──────────────────────────
            Visible only when fieldsVisible === true (HR role selected).
            Uses max-height + opacity CSS transition for a smooth collapse
            animation instead of an abrupt conditional unmount.
            pointerEvents: none prevents keyboard tab-focus on hidden inputs.

            When Staff is selected:
              maxHeight → "0px"  : collapses the block height smoothly
              opacity   → 0      : fades out the content
              pointerEvents → none : inputs are invisible AND unfocusable
            ────────────────────────────────────────────────────────────────── */}
        <div
          className="w-full overflow-hidden transition-all duration-300"
          style={{
            maxHeight:     fieldsVisible ? "280px" : "0px",   // raise if more fields are added
            opacity:       fieldsVisible ? 1 : 0,
            pointerEvents: fieldsVisible ? "auto" : "none",
          }}
        >

          {/* ── EMPLOYEE ID / EMAIL INPUT ──────────────────────────────────
              Controlled by employeeId state.
              TODO: rename state → email if the system moves to email-only auth.
              TODO: add onKeyDown → submit on Enter key for faster UX.
              ────────────────────────────────────────────────────────────── */}
          <div className="w-full mb-4">
            <label
              htmlFor="input-employee-id"
              className="block mb-1.5"
              style={{ fontSize: "12px", color: "rgba(200,160,90,0.7)" }}
            >
              Employee ID / Email
            </label>
            <input
              id="input-employee-id"
              type="text"
              placeholder="hr@doublel.com"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)} // keeps employeeId state in sync
              className="w-full rounded-xl px-4 py-3 outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(200,130,40,0.25)",
                color: "#f0e0c0",
                fontSize: "14px",
              }}
              // Amber glow on focus — inline style needed because Tailwind can't
              // dynamically override an inline border-color set at render time
              onFocus={(e) => (e.target.style.borderColor = "rgba(200,130,40,0.7)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(200,130,40,0.25)")}
            />
          </div>

          {/* ── PASSWORD INPUT ────────────────────────────────────────────
              Controlled by password state.
              showPassword toggles type between "password" and "text".
              The Eye/EyeOff icon is absolutely positioned inside the input wrapper.
              TODO: add a password-strength meter for a change-password screen.
              TODO: add a "Forgot password?" link once the reset flow exists.
              ────────────────────────────────────────────────────────────── */}
          <div className="w-full mb-5">
            <label
              htmlFor="input-password"
              className="block mb-1.5"
              style={{ fontSize: "12px", color: "rgba(200,160,90,0.7)" }}
            >
              Password
            </label>

            {/* position:relative wrapper so the toggle button can sit flush-right
                inside the input boundary without affecting input width */}
            <div className="relative w-full">
              <input
                id="input-password"
                type={showPassword ? "text" : "password"} // controlled by showPassword state
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // keeps password state in sync
                className="w-full rounded-xl px-4 py-3 pr-11 outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(200,130,40,0.25)",
                  color: "#f0e0c0",
                  fontSize: "14px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(200,130,40,0.7)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(200,130,40,0.25)")}
              />

              {/* Show / hide password toggle button — plain <button>, no library.
                  Absolutely positioned inside the input container (right edge).
                  tabIndex={-1} keeps it out of the normal tab order; the input
                  itself is still reachable. */}
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-150"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(200,150,70,0.55)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {/* Swap icon based on current showPassword state */}
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* ── VALIDATION / SERVER ERROR ────────────────────────────────
              Mounts only when the error state is non-empty.
              Call setError("message") anywhere in this file to surface feedback.
              Auto-cleared when the user switches role cards.
              ────────────────────────────────────────────────────────────── */}
          {error && (
            <p
              className="w-full text-center mb-3"
              style={{ fontSize: "12px", color: "#f0a070" }}
            >
              {error}
            </p>
          )}

          {/* ── HR SIGN-IN BUTTON ─────────────────────────────────────────
              Plain <button> styled with the brand amber gradient.
              disabled while isLoading to prevent double-submits.
              active:scale-95 gives tactile press feedback.

              onClick → handleHRSubmit → validates → calls onLogin(payload)

              TODO (navigation — pick one):
                React Router  : navigate("/dashboard")  inside handleHRSubmit
                Electron IPC  : window.electron.ipcRenderer.send("login", payload)
                Parent state  : onLogin(payload) already wired — update App.jsx
              ────────────────────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleHRSubmit}
            disabled={isLoading}
            className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            style={{
              // Brand gold gradient — update colors here if palette changes
              background: isLoading
                ? "rgba(160,90,10,0.5)"   // dimmed while API call is in-flight
                : "linear-gradient(90deg, #c86810 0%, #f0a020 50%, #c86810 100%)",
              color: "#fff",
              fontSize: "14px",
              border: "none",
              letterSpacing: "0.4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <LogIn size={15} strokeWidth={2} />
            {isLoading ? "Signing in…" : "Sign in to Portal"}
          </button>

        </div>
        {/* END collapsible credential block */}

        {/* ── STAFF ENTRY BUTTON ────────────────────────────────────────────
            Appears only when Staff is the selected role (fieldsVisible === false).
            Staff skips credential entry — this button routes directly to
            the limited-access / read-only staff dashboard.

            Plain <button> with an amber outline style — visually softer than
            the solid HR sign-in button to reflect the lower permission level.

            onClick → handleStaffEntry → calls onLogin({ role: "staff" })

            TODO (navigation — pick one):
              React Router  : navigate("/staff-dashboard") inside handleStaffEntry
              Electron IPC  : window.electron.ipcRenderer.send("staff-entry")
              Parent state  : onLogin({ role: "staff" }) already wired
            ────────────────────────────────────────────────────────────────── */}
        {!fieldsVisible && (
          <button
            type="button"
            onClick={handleStaffEntry}
            className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2 mt-1 transition-all duration-200 active:scale-95"
            style={{
              background: "rgba(200, 130, 40, 0.08)",
              border: "1.5px solid rgba(200, 130, 40, 0.45)",
              color: "#f0d090",
              fontSize: "14px",
              cursor: "pointer",
              letterSpacing: "0.4px",
            }}
          >
            <ArrowRight size={15} strokeWidth={2} />
            Enter as Staff
          </button>
        )}

        {/* ── FOOTER ────────────────────────────────────────────────────────
            Static copyright + version string.
            Bump the version number here with each production release.
            ────────────────────────────────────────────────────────────────── */}
        <p
          className="mt-6 text-center"
          style={{ fontSize: "10px", color: "rgba(180,130,60,0.3)", letterSpacing: "0.3px" }}
        >
          Double L Beauty Products © 2026 · HR System v1.0
        </p>

      </div>
      {/* END login card */}

    </div>
    // END full-screen wrapper
  );
}

export default LoginPage;