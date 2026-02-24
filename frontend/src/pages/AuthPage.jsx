import { useState } from "react";
import { Zap, Shield, Loader2, User, AtSign, KeyRound } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { apiJson, setToken } from "../api/client";

export const AuthPage = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await apiJson("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, full_name: fullName }),
        });
      }
      const data = await apiJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);
      const me = await apiJson("/auth/me");
      onAuth(me);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px 11px 42px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#334155",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    background: "#fafbfc",
    transition: "border-color 0.15s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={20} color="#fff" fill="#fff" />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 22,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          ShortlistAI
        </span>
      </div>

      <Card style={{ width: "100%", maxWidth: 420, padding: 36 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 6,
            letterSpacing: "-0.4px",
          }}
        >
          {mode === "login" ? "Sign in to ShortlistAI" : "Create your account"}
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>
          {mode === "login"
            ? "Enter your credentials to access your workspace."
            : "Set up your account to begin screening candidates with AI."}
        </p>

        <ErrorBanner message={error} onClose={() => setError("")} />

        <form onSubmit={submit}>
          {mode === "register" && (
            <div style={{ marginBottom: 16, position: "relative" }}>
              <User
                size={15}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: 16, position: "relative" }}>
            <AtSign
              size={15}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="email"
              placeholder="Work email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              required
            />
          </div>

          <div style={{ marginBottom: 24, position: "relative" }}>
            <KeyRound
              size={15}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="password"
              placeholder={
                mode === "register"
                  ? "Choose a password (min. 8 characters)"
                  : "Password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "13px 20px",
              fontSize: 15,
            }}
            icon={
              loading ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              ) : null
            }
          >
            {loading
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 14,
            color: "#64748b",
          }}
        >
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#4f46e5",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#4f46e5",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Sign in instead
              </button>
            </>
          )}
        </div>
      </Card>

      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Shield size={12} /> SOC 2 Type II Certified · GDPR Compliant
      </p>
    </div>
  );
};
