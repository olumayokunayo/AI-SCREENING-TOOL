import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Plus,
  History,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Bell,
  Upload,
  FileText,
  Zap,
  BarChart3,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  X,
  Search,
  Users,
  TrendingUp,
  Briefcase,
  Star,
  ChevronRight,
  Shield,
  Mail,
  Loader2,
  Lock,
  AtSign,
  KeyRound,
} from "lucide-react";

// ─── API CONFIG ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000/api/v1";

// ─── API HELPERS ─────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("shortlist_token");
const setToken = (t) => localStorage.setItem("shortlist_token", t);
const clearToken = () => localStorage.removeItem("shortlist_token");

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res;
}

async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  return res.json();
}

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --indigo-50: #eef2ff; --indigo-100: #e0e7ff;
      --indigo-500: #6366f1; --indigo-600: #4f46e5; --indigo-700: #4338ca;
    }
    body { font-family: 'DM Sans', sans-serif; background: #f8fafc; color: #1e293b; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .fade-up { animation: fadeUp 0.35s ease forwards; }
    .fade-up-1 { animation-delay: 0.05s; opacity: 0; }
    .fade-up-2 { animation-delay: 0.1s; opacity: 0; }
    .fade-up-3 { animation-delay: 0.15s; opacity: 0; }
    .fade-up-4 { animation-delay: 0.2s; opacity: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }
    @keyframes progressAnim { 0%{width:0%} 30%{width:40%} 65%{width:70%} 85%{width:88%} 100%{width:95%} }
    .progress-bar { animation: progressAnim 25s ease forwards; }
    .drag-active { border-color: #4f46e5 !important; background: #eef2ff !important; }
  `}</style>
);

// ─── SHARED UI ───────────────────────────────────────────────────────────────
const Badge = ({ children, variant = "default" }) => {
  const v = {
    default: { bg: "#f1f5f9", color: "#475569" },
    success: { bg: "#d1fae5", color: "#065f46" },
    warning: { bg: "#fef3c7", color: "#92400e" },
    error: { bg: "#fee2e2", color: "#991b1b" },
    indigo: { bg: "#e0e7ff", color: "#3730a3" },
  }[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: v.bg,
        color: v.color,
      }}
    >
      {children}
    </span>
  );
};

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = "primary",
  onClick,
  disabled,
  style = {},
  icon,
  type = "button",
}) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    fontFamily: "'DM Sans',sans-serif",
    transition: "all 0.15s",
    opacity: disabled ? 0.6 : 1,
    ...style,
  };
  const variants = {
    primary: { background: "#4f46e5", color: "#fff" },
    secondary: {
      background: "#fff",
      color: "#334155",
      border: "1px solid #e2e8f0",
    },
    ghost: { background: "transparent", color: "#64748b" },
    danger: { background: "#fee2e2", color: "#991b1b" },
  };
  return (
    <button
      type={type}
      style={{ ...base, ...variants[variant] }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = "brightness(0.93)";
      }}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
    >
      {icon}
      {children}
    </button>
  );
};

const ErrorBanner = ({ message, onClose }) =>
  message ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: "#fee2e2",
        border: "1px solid #fecaca",
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 14,
        color: "#991b1b",
      }}
    >
      <AlertCircle size={16} color="#ef4444" />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <X size={14} color="#991b1b" />
        </button>
      )}
    </div>
  ) : null;

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────
const AuthPage = ({ onAuth }) => {
  const [mode, setMode] = useState("login"); // login | register
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
    fontFamily: "'DM Sans',sans-serif",
    outline: "none",
    background: "#fafbfc",
    transition: "border-color 0.15s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#eef2ff 0%,#f8fafc 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <GlobalStyles />
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
                  className="spin"
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
                  fontFamily: "'DM Sans',sans-serif",
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
                  fontFamily: "'DM Sans',sans-serif",
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

// ─── APP SHELL ───────────────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "new", label: "New Screening", icon: Plus },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ active, setPage, user, onLogout }) => (
  <div
    style={{
      width: 220,
      background: "#fff",
      borderRight: "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 10,
    }}
  >
    <div
      style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#0f172a",
            letterSpacing: "-0.3px",
          }}
        >
          ShortlistAI
        </span>
      </div>
    </div>
    <nav style={{ flex: 1, padding: "12px 12px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          padding: "8px 8px 12px",
        }}
      >
        Main Menu
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "9px 10px",
              borderRadius: 9,
              marginBottom: 2,
              border: "none",
              background: isActive ? "#eef2ff" : "transparent",
              color: isActive ? "#4f46e5" : "#64748b",
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              textAlign: "left",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>
    <div style={{ padding: 16, borderTop: "1px solid #f1f5f9" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px",
          borderRadius: 10,
          background: "#f8fafc",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#e0e7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={16} color="#4f46e5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.full_name || user?.email?.split("@")[0] || "User"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.email}
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 9,
          border: "none",
          background: "transparent",
          color: "#94a3b8",
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  </div>
);

const TopBar = ({ title, subtitle }) => (
  <div
    style={{
      height: 64,
      borderBottom: "1px solid #e2e8f0",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      position: "sticky",
      top: 0,
      zIndex: 5,
    }}
  >
    <div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
          {subtitle}
        </div>
      )}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          border: "1px solid #e2e8f0",
          background: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={16} color="#64748b" />
      </button>
    </div>
  </div>
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const DashboardView = ({ setPage, setSelectedScreeningId }) => {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson("/screenings?limit=10")
      .then((data) => setScreenings(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const thisMonth = screenings.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const topScore =
    screenings.length > 0
      ? Math.max(...screenings.map((s) => s.top_match_score || 0)).toFixed(1)
      : "—";
  const activeRoles = screenings.filter((s) => s.status === "complete").length;

  const viewScreening = (id) => {
    setSelectedScreeningId(id);
    setPage("results");
  };

  return (
    <div className="fade-up">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Screenings This Month",
            value: loading ? "…" : String(thisMonth),
            delta: "Completed in the current calendar month",
            icon: <BarChart3 size={18} color="#4f46e5" />,
            bg: "#eef2ff",
          },
          {
            label: "Highest Role Match Score",
            value: loading ? "…" : topScore === "0" ? "—" : `${topScore}%`,
            delta: "Best candidate match across all screenings",
            icon: <Star size={18} color="#f59e0b" fill="#f59e0b" />,
            bg: "#fef3c7",
          },
          {
            label: "Total Screenings Run",
            value: loading ? "…" : String(screenings.length),
            delta: "All time across your account",
            icon: <Briefcase size={18} color="#10b981" />,
            bg: "#d1fae5",
          },
        ].map((s) => (
          <Card key={s.label} style={{ padding: "22px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#0f172a",
                    letterSpacing: "-1px",
                  }}
                >
                  {s.value}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{s.delta}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Recent Screenings
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Select a row to view the full ranked shortlist
            </div>
          </div>
          <Button
            variant="secondary"
            style={{ fontSize: 13 }}
            icon={<Plus size={14} />}
            onClick={() => setPage("new")}
          >
            New Screening
          </Button>
        </div>

        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Loader2
              size={18}
              className="spin"
              style={{ animation: "spin 0.8s linear infinite" }}
            />{" "}
            Retrieving your screenings…
          </div>
        ) : error ? (
          <div style={{ padding: 32 }}>
            <ErrorBanner message={error} />
          </div>
        ) : screenings.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <BarChart3 size={24} color="#4f46e5" />
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 8,
              }}
            >
              No screenings yet
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
              Upload a job description and candidate CVs to run your first AI
              screening.
            </div>
            <Button onClick={() => setPage("new")} icon={<Plus size={15} />}>
              Start Your First Screening
            </Button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
                padding: "10px 24px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              {[
                "Role Title",
                "CVs Screened",
                "Top Match Score",
                "Date Run",
                "Status",
              ].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {screenings.map((row, i) => (
              <div
                key={row.id}
                onClick={() => viewScreening(row.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
                  padding: "14px 24px",
                  borderBottom:
                    i < screenings.length - 1 ? "1px solid #f8fafc" : "none",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fafbfc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}
                >
                  {row.role_title || "Untitled Role"}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Users size={13} color="#94a3b8" />
                  {row.candidate_count}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      (row.top_match_score || 0) >= 85
                        ? "#4f46e5"
                        : (row.top_match_score || 0) >= 70
                          ? "#f59e0b"
                          : "#94a3b8",
                  }}
                >
                  {row.top_match_score
                    ? `${row.top_match_score.toFixed(1)}%`
                    : "—"}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  {new Date(row.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div>
                  <Badge
                    variant={
                      row.status === "complete"
                        ? "success"
                        : row.status === "error"
                          ? "error"
                          : "indigo"
                    }
                  >
                    {row.status === "complete"
                      ? "Screening Complete"
                      : row.status === "error"
                        ? "Failed"
                        : "Processing"}
                  </Badge>
                </div>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
};

// ─── NEW SCREENING ────────────────────────────────────────────────────────────
const NewScreeningPage = ({ setPage, setSelectedScreeningId }) => {
  const [jd, setJd] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(pdf|docx?)$/i.test(f.name),
    );
    if (!dropped.length) {
      setError(
        "Unsupported file type. Please upload PDF, DOC, or DOCX files only.",
      );
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileInput = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    setError("");
  };

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const runScreening = async () => {
    if (!jd.trim()) {
      setError("Please paste a job description before running the screening.");
      return;
    }
    if (!files.length) {
      setError("Please upload at least one CV to screen against this role.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("job_description", jd);
      files.forEach((f) => formData.append("cvs", f));

      const res = await apiFetch("/screenings", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setSelectedScreeningId(data.id);
      setPage("results");
    } catch (err) {
      setError(
        err.message ||
          "The screening could not be completed. Please check your files and try again.",
      );
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div
        className="fade-up"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 420,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Loader2
            size={28}
            color="#4f46e5"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Screening in Progress
        </div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
          Analysing {files.length} candidate{files.length !== 1 ? "s" : ""} ·
          This takes 15–45 seconds
        </div>
        <div
          style={{
            width: 420,
            height: 6,
            background: "#e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            className="progress-bar"
            style={{
              height: "100%",
              background: "linear-gradient(90deg,#4f46e5,#6366f1)",
              borderRadius: 3,
            }}
          />
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
          Extracting CV text, calculating role match scores, and writing
          candidate summaries…
        </div>
      </div>
    );

  return (
    <div className="fade-up" style={{ maxWidth: 800 }}>
      <ErrorBanner message={error} onClose={() => setError("")} />

      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={16} color="#4f46e5" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Job Description
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Include the full role brief — responsibilities, required skills,
              and essential criteria — for the most accurate candidate matching.
            </div>
          </div>
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here. The more detail you include, the more accurately candidates will be scored and ranked against the role."
          style={{
            width: "100%",
            minHeight: 200,
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            color: "#334155",
            lineHeight: 1.65,
            fontFamily: "'DM Sans',sans-serif",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.15s",
            background: "#fafbfc",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
        >
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {jd.length} characters
          </span>
        </div>
      </Card>

      <Card style={{ padding: 28, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Upload size={16} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Upload Candidate CVs
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Accepted formats: PDF, DOC, DOCX. Maximum 50 CVs per screening, 10
              MB per file.
            </div>
          </div>
          {files.length > 0 && (
            <Badge variant="indigo" style={{ marginLeft: "auto" }}>
              {files.length} file{files.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={dragging ? "drag-active" : ""}
          style={{
            border: "2px dashed #e2e8f0",
            borderRadius: 12,
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "#eef2ff" : "#fafbfc",
            transition: "all 0.15s",
          }}
        >
          <Upload
            size={28}
            color={dragging ? "#4f46e5" : "#94a3b8"}
            style={{ margin: "0 auto 12px" }}
          />
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: dragging ? "#4f46e5" : "#475569",
              marginBottom: 6,
            }}
          >
            {dragging ? "Release to add files" : "Drag and drop CV files here"}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            or{" "}
            <span style={{ color: "#4f46e5", fontWeight: 600 }}>
              browse your computer
            </span>{" "}
            to select files
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </div>

        {files.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderRadius: 9,
                  border: "1px solid #f1f5f9",
                }}
              >
                <FileText size={14} color="#4f46e5" />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#334155",
                    fontWeight: 500,
                  }}
                >
                  {f.name}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => removeFile(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                  }}
                >
                  <X size={14} color="#94a3b8" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={runScreening}
          style={{ padding: "13px 32px", fontSize: 15 }}
          icon={<Zap size={16} />}
        >
          Analyse & Rank Candidates
        </Button>
      </div>
    </div>
  );
};

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────
const ResultsPage = ({ screeningId, setPage }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!screeningId) {
      setPage("dashboard");
      return;
    }
    apiJson(`/screenings/${screeningId}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [screeningId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiFetch(`/screenings/${screeningId}/export`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shortlist_${screeningId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("CSV export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          gap: 12,
          color: "#64748b",
          fontSize: 14,
        }}
      >
        <Loader2
          size={20}
          style={{ animation: "spin 0.8s linear infinite" }}
          color="#4f46e5"
        />{" "}
        Loading screening results…
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 32 }}>
        <ErrorBanner message={error} />
      </div>
    );
  if (!data) return null;

  const candidates = data.candidates || [];

  return (
    <div className="fade-up">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.5px",
              marginBottom: 8,
            }}
          >
            {data.role_title || "Screening Results"}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge>
              Screened{" "}
              {new Date(data.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Badge>
            <Badge variant={data.status === "complete" ? "success" : "indigo"}>
              {data.status === "complete" ? "Screening Complete" : "Processing"}
            </Badge>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={exporting}
          icon={
            exporting ? (
              <Loader2
                size={14}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            ) : (
              <Download size={14} />
            )
          }
        >
          {exporting ? "Preparing export…" : "Export Shortlist (CSV)"}
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "CVs Screened",
            value: `${data.candidate_count}`,
            sub: "Candidates assessed against this role",
            icon: <Users size={16} color="#4f46e5" />,
            bg: "#eef2ff",
          },
          {
            label: "Top Role Match Score",
            value: data.top_match_score
              ? `${data.top_match_score.toFixed(1)}%`
              : "—",
            sub: candidates[0]?.name || "Highest-ranked candidate",
            icon: <Star size={16} color="#f59e0b" fill="#f59e0b" />,
            bg: "#fef3c7",
          },
          {
            label: "Average Match Score",
            value: data.average_match_score
              ? `${data.average_match_score.toFixed(1)}%`
              : "—",
            sub: "Mean score across all screened candidates",
            icon: <TrendingUp size={16} color="#10b981" />,
            bg: "#d1fae5",
          },
        ].map((m) => (
          <Card key={m.label} style={{ padding: "18px 22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: m.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {m.icon}
              </div>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.8px",
                marginBottom: 4,
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{m.sub}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div
          style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Ranked Shortlist
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}{" "}
            ranked by role match score — select a row to read the AI-generated
            summary
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60px 1.5fr 120px 2fr 1.5fr 100px",
            padding: "10px 24px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          {[
            "Rank",
            "Candidate",
            "Match Score",
            "Strengths",
            "Gaps vs. Role",
            "",
          ].map((h) => (
            <div
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {candidates.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            No candidates were returned for this screening. Please check your
            uploaded files and try again.
          </div>
        ) : (
          candidates.map((c, i) => (
            <div key={c.id}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1.5fr 120px 2fr 1.5fr 100px",
                  padding: "16px 24px",
                  borderBottom: "1px solid #f8fafc",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fafbfc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        c.rank === 1
                          ? "#fef3c7"
                          : c.rank === 2
                            ? "#f1f5f9"
                            : "#f8fafc",
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        c.rank === 1
                          ? "#92400e"
                          : c.rank === 2
                            ? "#475569"
                            : "#94a3b8",
                    }}
                  >
                    #{c.rank}
                  </div>
                </div>

                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}
                  >
                    {c.name}
                  </div>
                  {c.file_name && (
                    <div
                      style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}
                    >
                      {c.file_name}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color:
                        c.match_score >= 80
                          ? "#4f46e5"
                          : c.match_score >= 60
                            ? "#f59e0b"
                            : "#64748b",
                    }}
                  >
                    {c.match_score.toFixed(1)}%
                  </div>
                  <div
                    style={{
                      width: 60,
                      height: 4,
                      background: "#f1f5f9",
                      borderRadius: 2,
                      marginTop: 5,
                    }}
                  >
                    <div
                      style={{
                        width: `${c.match_score}%`,
                        height: "100%",
                        borderRadius: 2,
                        background:
                          c.match_score >= 80
                            ? "#4f46e5"
                            : c.match_score >= 60
                              ? "#f59e0b"
                              : "#94a3b8",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(c.strengths || []).map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 11,
                        background: "#eef2ff",
                        color: "#3730a3",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontWeight: 500,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(c.gaps || []).map((g, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 11,
                        background: "#fff7ed",
                        color: "#9a3412",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontWeight: 500,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 7,
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    <Eye size={13} /> View Summary
                    <ChevronRight
                      size={12}
                      style={{
                        transform: expanded === i ? "rotate(90deg)" : "none",
                        transition: "transform 0.15s",
                      }}
                    />
                  </button>
                </div>
              </div>

              {expanded === i && (
                <div
                  style={{
                    padding: "0 24px 20px",
                    background: "#fafbfc",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: 10,
                      }}
                    >
                      AI Recruiter Summary — {c.name}
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        color: "#475569",
                        lineHeight: 1.75,
                        marginBottom: 0,
                      }}
                    >
                      {c.summary ||
                        "No summary was generated for this candidate."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
const HistoryPage = ({ setPage, setSelectedScreeningId }) => {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiJson("/screenings?limit=50")
      .then((data) => setScreenings(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = screenings.filter((s) =>
    (s.role_title || "Untitled Role")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const viewScreening = (id) => {
    setSelectedScreeningId(id);
    setPage("results");
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            placeholder="Search by role title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#334155",
              fontFamily: "'DM Sans',sans-serif",
              flex: 1,
              background: "transparent",
            }}
          />
        </div>
      </div>

      <Card>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            All Screening History
          </div>
          <Badge variant="indigo">
            {filtered.length} screening{filtered.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Loader2
              size={18}
              style={{ animation: "spin 0.8s linear infinite" }}
              color="#4f46e5"
            />{" "}
            Retrieving screening history…
          </div>
        ) : error ? (
          <div style={{ padding: 32 }}>
            <ErrorBanner message={error} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            {search
              ? `No screenings found matching "${search}"`
              : "No screening history found. Run your first screening to get started."}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
                padding: "10px 24px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              {[
                "Role Title",
                "Candidates",
                "Top Match %",
                "Date",
                "Status",
              ].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {filtered.map((row, i) => (
              <div
                key={row.id}
                onClick={() => viewScreening(row.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
                  padding: "14px 24px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #f8fafc" : "none",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fafbfc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}
                >
                  {row.role_title || "Untitled Role"}
                </div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  {row.candidate_count}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      (row.top_match_score || 0) >= 80
                        ? "#4f46e5"
                        : (row.top_match_score || 0) >= 60
                          ? "#f59e0b"
                          : "#94a3b8",
                  }}
                >
                  {row.top_match_score
                    ? `${row.top_match_score.toFixed(1)}%`
                    : "—"}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  {new Date(row.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div>
                  <Badge
                    variant={
                      row.status === "complete"
                        ? "success"
                        : row.status === "error"
                          ? "error"
                          : "indigo"
                    }
                  >
                    {row.status === "complete"
                      ? "Complete"
                      : row.status === "error"
                        ? "Failed"
                        : "Processing"}
                  </Badge>
                </div>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
};

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
const SettingsPage = ({ user }) => (
  <div className="fade-up" style={{ maxWidth: 640 }}>
    <Card style={{ padding: 28, marginBottom: 20 }}>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 20,
        }}
      >
        Account Details
      </div>
      {[
        { label: "Full Name", value: user?.full_name || "" },
        { label: "Email Address", value: user?.email || "" },
        { label: "Account ID", value: user?.id || "" },
      ].map((f) => (
        <div key={f.label} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 6,
            }}
          >
            {f.label}
          </div>
          <input
            readOnly
            defaultValue={f.value}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 9,
              border: "1px solid #e2e8f0",
              fontSize: 14,
              color: "#64748b",
              fontFamily: "'DM Sans',sans-serif",
              outline: "none",
              background: "#f8fafc",
            }}
          />
        </div>
      ))}
      <div
        style={{
          marginTop: 8,
          padding: "12px 16px",
          background: "#eef2ff",
          borderRadius: 10,
          fontSize: 13,
          color: "#3730a3",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Profile editing is not yet available
        </div>
        To update your account details, please contact your account
        administrator or reach out to support.
      </div>
    </Card>

    <Card style={{ padding: 28 }}>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 16,
        }}
      >
        AI Configuration
      </div>
      {[
        { label: "Embedding Model", value: "text-embedding-3-small (OpenAI)" },
        { label: "Analysis Model", value: "GPT-4o Mini" },
        { label: "Scoring Method", value: "Cosine Similarity (0–100)" },
        { label: "Max CVs per Screening", value: "50 files" },
        { label: "Max File Size", value: "10 MB per file" },
      ].map((f) => (
        <div
          key={f.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid #f1f5f9",
            fontSize: 14,
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 500 }}>{f.label}</span>
          <span style={{ color: "#334155", fontWeight: 600 }}>{f.value}</span>
        </div>
      ))}
    </Card>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [selectedScreeningId, setSelectedScreeningId] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    apiJson("/auth/me")
      .then((me) => {
        setUser(me);
        setAuthChecked(true);
      })
      .catch(() => {
        clearToken();
        setAuthChecked(true);
      });
  }, []);

  const handleAuth = (me) => setUser(me);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setPage("dashboard");
    setSelectedScreeningId(null);
  };

  if (!authChecked)
    return (
      <>
        <GlobalStyles />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2
            size={28}
            color="#4f46e5"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
      </>
    );

  if (!user) return <AuthPage onAuth={handleAuth} />;

  const pageConfig = {
    dashboard: {
      title: "Dashboard",
      subtitle: `Welcome back, ${user.full_name || user.email.split("@")[0]}`,
    },
    new: {
      title: "New Screening",
      subtitle: "Upload a job description and candidate CVs to begin",
    },
    history: {
      title: "Screening History",
      subtitle: "View and revisit all previous screening sessions",
    },
    results: { title: "Results", subtitle: "AI-ranked candidate shortlist" },
    settings: {
      title: "Settings",
      subtitle: "Manage your account and AI configuration",
    },
  };

  const config = pageConfig[page] || pageConfig.dashboard;

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar
          active={page}
          setPage={setPage}
          user={user}
          onLogout={handleLogout}
        />
        <div
          style={{
            flex: 1,
            marginLeft: 220,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <TopBar title={config.title} subtitle={config.subtitle} />
          <main
            style={{ flex: 1, padding: "28px 32px", background: "#f8fafc" }}
          >
            {page === "dashboard" && (
              <DashboardView
                setPage={setPage}
                setSelectedScreeningId={setSelectedScreeningId}
              />
            )}
            {page === "new" && (
              <NewScreeningPage
                setPage={setPage}
                setSelectedScreeningId={setSelectedScreeningId}
              />
            )}
            {page === "history" && (
              <HistoryPage
                setPage={setPage}
                setSelectedScreeningId={setSelectedScreeningId}
              />
            )}
            {page === "results" && (
              <ResultsPage
                screeningId={selectedScreeningId}
                setPage={setPage}
              />
            )}
            {page === "settings" && <SettingsPage user={user} />}
          </main>
        </div>
      </div>
    </>
  );
}
