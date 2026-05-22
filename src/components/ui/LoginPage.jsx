import { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";

function LoginPage({ onLogin }) {
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [isLoading,    setIsLoading]    = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!username.trim()) { setError("Please enter your username."); return; }
    if (!password.trim()) { setError("Please enter your password.");  return; }

    setIsLoading(true);

    const result = await window.electronAPI.login({ username, password });

    setIsLoading(false);

    if (result.success) {
      onLogin(result.user);   // { id, username, role } → goes to App.jsx
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 40% 30%, #4a2c0a 0%, #1c0e02 55%, #0d0700 100%)",
      }}
    >
      <div
        className="w-full rounded-3xl px-8 py-10 flex flex-col items-center"
        style={{
          maxWidth: "400px",
          background: "rgba(28, 14, 2, 0.82)",
          border: "1px solid rgba(200, 120, 30, 0.30)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 16px 70px rgba(0,0,0,0.60), 0 0 0 1px rgba(200,120,30,0.06) inset",
        }}
      >

        {/* Logo */}
        <img
          src="/Logo.png"
          alt="Double L Beauty Products"
          className="mx-auto mb-6"
          style={{
            width: "150px",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 2px 12px rgba(200, 130, 40, 0.35))",
          }}
        />

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="font-medium mb-1" style={{ fontSize: "22px", color: "#f0e0c0" }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(200,170,120,0.6)" }}>
            Sign in to continue
          </p>
        </div>

        {/* Username */}
        <div className="w-full mb-4">
          <label
            htmlFor="input-username"
            className="block mb-1.5"
            style={{ fontSize: "12px", color: "rgba(200,160,90,0.7)" }}
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
            className="w-full rounded-xl px-4 py-3 outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(200,130,40,0.25)",
              color: "#f0e0c0",
              fontSize: "14px",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(200,130,40,0.7)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(200,130,40,0.25)")}
          />
        </div>

        {/* Password */}
        <div className="w-full mb-5">
          <label
            htmlFor="input-password"
            className="block mb-1.5"
            style={{ fontSize: "12px", color: "rgba(200,160,90,0.7)" }}
          >
            Password
          </label>
          <div className="relative w-full">
            <input
              id="input-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md"
              style={{ background: "transparent", border: "none", color: "rgba(200,150,70,0.55)", cursor: "pointer" }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="w-full text-center mb-4" style={{ fontSize: "12px", color: "#f0a070" }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          style={{
            background: isLoading
              ? "rgba(160,90,10,0.5)"
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

        {/* Footer */}
        <p
          className="mt-8 text-center"
          style={{ fontSize: "10px", color: "rgba(180,130,60,0.3)", letterSpacing: "0.3px" }}
        >
          Double L Beauty Products © 2026 · LLTools v1.0
        </p>

      </div>
    </div>
  );
}

export default LoginPage;