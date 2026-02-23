import { useState, useRef } from "react";
import {
  LayoutDashboard, Plus, History, Settings, ChevronDown, LogOut,
  User, Bell, Upload, FileText, Zap, BarChart3, Download, Eye,
  CheckCircle, Clock, AlertCircle, ArrowRight, X, Search,
  Users, TrendingUp, Briefcase, Star, ChevronRight, Menu, Shield,
  Mail, ExternalLink, Loader2
} from "lucide-react";

// ─── Color & Typography tokens ─────────────────────────────────────────────
// Palette: slate base, indigo accent, clean whites
// Font: DM Sans (display) + system stack

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-300: #cbd5e1;
      --slate-400: #94a3b8;
      --slate-500: #64748b;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
      --indigo-50: #eef2ff;
      --indigo-100: #e0e7ff;
      --indigo-500: #6366f1;
      --indigo-600: #4f46e5;
      --indigo-700: #4338ca;
      --emerald-500: #10b981;
      --amber-500: #f59e0b;
      --rose-500: #f43f5e;
    }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--slate-50);
      color: var(--slate-800);
      -webkit-font-smoothing: antialiased;
    }

    .mono { font-family: 'DM Mono', monospace; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--slate-100); }
    ::-webkit-scrollbar-thumb { background: var(--slate-300); border-radius: 3px; }

    /* Transitions */
    .transition-all { transition: all 0.15s ease; }

    /* Page fade */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.4s ease forwards; }
    .fade-up-1 { animation-delay: 0.05s; opacity: 0; }
    .fade-up-2 { animation-delay: 0.1s; opacity: 0; }
    .fade-up-3 { animation-delay: 0.15s; opacity: 0; }
    .fade-up-4 { animation-delay: 0.2s; opacity: 0; }

    /* Spinner */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }

    /* Progress bar */
    @keyframes progress {
      0% { width: 0%; }
      30% { width: 45%; }
      60% { width: 72%; }
      85% { width: 88%; }
      100% { width: 100%; }
    }
    .progress-bar { animation: progress 3s ease forwards; }

    /* Drag zone */
    .drag-active { border-color: var(--indigo-500) !important; background: var(--indigo-50) !important; }
  `}</style>
);

// ─── Shared Components ──────────────────────────────────────────────────────

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: { bg: "#f1f5f9", color: "#475569" },
    success: { bg: "#d1fae5", color: "#065f46" },
    warning: { bg: "#fef3c7", color: "#92400e" },
    error: { bg: "#fee2e2", color: "#991b1b" },
    indigo: { bg: "#e0e7ff", color: "#3730a3" },
  };
  const s = variants[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: s.bg, color: s.color
    }}>{children}</span>
  );
};

const Card = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    ...style
  }}>{children}</div>
);

const Button = ({ children, variant = "primary", onClick, disabled, style = {}, icon }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", border: "none",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
    opacity: disabled ? 0.6 : 1, ...style
  };
  const variants = {
    primary: { background: "#4f46e5", color: "#fff" },
    secondary: { background: "#fff", color: "#334155", border: "1px solid #e2e8f0" },
    ghost: { background: "transparent", color: "#64748b" },
    danger: { background: "#fee2e2", color: "#991b1b" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.target.style.filter = "brightness(0.95)"; }}
      onMouseLeave={e => { e.target.style.filter = ""; }}>
      {icon && icon}{children}
    </button>
  );
};

// ─── Landing Page ───────────────────────────────────────────────────────────

const LandingPage = ({ onEnterApp }) => {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 64, borderBottom: "1px solid #f1f5f9",
        position: "sticky", top: 0, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)", zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "#4f46e5",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: "#0f172a", letterSpacing: "-0.3px" }}>ShortlistAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Features", "Pricing", "Case Studies", "Docs"].map(l => (
            <a key={l} href="#" style={{ fontSize: 14, color: "#475569", textDecoration: "none", fontWeight: 500 }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="ghost" onClick={onEnterApp}>Sign In</Button>
          <Button onClick={onEnterApp}>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 960, margin: "0 auto", padding: "96px 32px 80px",
        textAlign: "center"
      }}>
        <div className="fade-up fade-up-1" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#eef2ff", border: "1px solid #c7d2fe",
          borderRadius: 20, padding: "6px 14px", marginBottom: 32
        }}>
          <Star size={13} color="#4f46e5" fill="#4f46e5" />
          <span style={{ fontSize: 13, color: "#4338ca", fontWeight: 600 }}>Now with GPT-4o candidate analysis</span>
        </div>

        <h1 className="fade-up fade-up-2" style={{
          fontSize: 60, fontWeight: 700, lineHeight: 1.1,
          color: "#0f172a", letterSpacing: "-2px", marginBottom: 24
        }}>
          Reduce CV Screening<br />
          <span style={{ color: "#4f46e5" }}>Time by 60%</span>
        </h1>

        <p className="fade-up fade-up-3" style={{
          fontSize: 20, color: "#64748b", lineHeight: 1.6, maxWidth: 560,
          margin: "0 auto 40px", fontWeight: 400
        }}>
          AI-powered candidate ranking for specialist recruitment agencies.
          Surface the best talent faster — without the manual slog.
        </p>

        <div className="fade-up fade-up-4" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button onClick={onEnterApp} style={{ padding: "13px 28px", fontSize: 15 }}
            icon={<ArrowRight size={16} />}>
            Request Demo
          </Button>
          <Button variant="secondary" onClick={onEnterApp} style={{ padding: "13px 28px", fontSize: 15 }}>
            Try Sample Screening
          </Button>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 64, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ display: "flex" }}>
            {["#6366f1","#8b5cf6","#06b6d4","#10b981"].map((c, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: "50%", background: c,
                border: "2px solid #fff", marginLeft: i > 0 ? -10 : 0,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <User size={14} color="#fff" />
              </div>
            ))}
          </div>
          <span style={{ fontSize: 14, color: "#64748b" }}>
            <strong style={{ color: "#334155" }}>340+ agencies</strong> saving 12+ hours per week
          </span>
        </div>
      </section>

      {/* Dashboard preview mockup */}
      <section style={{ padding: "0 48px 80px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          background: "linear-gradient(160deg, #eef2ff 0%, #f8fafc 100%)",
          borderRadius: 24, border: "1px solid #e2e8f0", padding: 24,
          boxShadow: "0 20px 60px rgba(79,70,229,0.08)"
        }}>
          {/* Mini dashboard preview */}
          <div style={{ display: "flex", gap: 16 }}>
            {/* Sidebar preview */}
            <div style={{
              width: 160, background: "#fff", borderRadius: 12,
              padding: 16, border: "1px solid #e2e8f0", flexShrink: 0
            }}>
              {["Dashboard","New Screening","History","Settings"].map((item, i) => (
                <div key={item} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8, marginBottom: 4,
                  background: i === 0 ? "#eef2ff" : "transparent",
                  color: i === 0 ? "#4f46e5" : "#64748b", fontSize: 12, fontWeight: 500
                }}>
                  {[<LayoutDashboard size={13}/>,<Plus size={13}/>,<History size={13}/>,<Settings size={13}/>][i]}
                  {item}
                </div>
              ))}
            </div>
            {/* Main content preview */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Screenings This Month", value: "24", icon: <BarChart3 size={16} color="#4f46e5"/>, bg: "#eef2ff" },
                  { label: "Avg Time Saved", value: "4.2h", icon: <Clock size={16} color="#10b981"/>, bg: "#d1fae5" },
                  { label: "Active Roles", value: "7", icon: <Briefcase size={16} color="#f59e0b"/>, bg: "#fef3c7" },
                ].map(m => (
                  <div key={m.label} style={{
                    flex: 1, background: "#fff", borderRadius: 12, padding: "14px 16px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{m.label}</span>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.icon}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {/* Table preview */}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
                  {["Role","Candidates","Top Match","Status"].map(h => (
                    <div key={h} style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                  ))}
                </div>
                {[
                  { role: "Senior React Dev", n: 34, match: "94%", s: "success" },
                  { role: "DevOps Engineer", n: 21, match: "87%", s: "success" },
                  { role: "Product Manager", n: 18, match: "79%", s: "warning" },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "8px 16px", display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#334155" }}>{r.role}</div>
                    <div style={{ flex: 1, fontSize: 12, color: "#64748b" }}>{r.n}</div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>{r.match}</div>
                    <div style={{ flex: 1 }}><Badge variant={r.s}>{r.s === "success" ? "Complete" : "Processing"}</Badge></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 96px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: 38, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px", marginBottom: 14 }}>
            Everything you need to shortlist faster
          </h2>
          <p style={{ fontSize: 17, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
            Purpose-built for recruitment teams who need precision at scale.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            {
              icon: <BarChart3 size={22} color="#4f46e5" />,
              iconBg: "#eef2ff",
              title: "AI Match Scoring",
              desc: "Each candidate receives a precise match score against your job spec — ranked 0–100 using semantic understanding, not just keyword matching.",
              points: ["Semantic role alignment", "Skills gap detection", "Experience weighting"]
            },
            {
              icon: <FileText size={22} color="#10b981" />,
              iconBg: "#d1fae5",
              title: "Candidate Summaries",
              desc: "Get a crisp, structured summary of each candidate's strengths and gaps — ready to share with hiring managers in one click.",
              points: ["Auto-generated highlights", "Customisable summary length", "Shareable PDF export"]
            },
            {
              icon: <Download size={22} color="#f59e0b" />,
              iconBg: "#fef3c7",
              title: "Exportable Shortlists",
              desc: "Export your ranked shortlist to CSV or PDF in seconds. Integrate directly with your ATS or share with clients instantly.",
              points: ["CSV & PDF export", "ATS-ready format", "Client sharing links"]
            }
          ].map(f => (
            <Card key={f.title} style={{ padding: 32 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: f.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, marginBottom: 20 }}>{f.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {f.points.map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                    <CheckCircle size={14} color="#10b981" />
                    {p}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: "0 48px 96px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          borderRadius: 24, padding: "64px 80px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <h2 style={{ fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "-0.8px", marginBottom: 12 }}>
              Ready to cut your screening time in half?
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)" }}>No credit card required. Get started in under 2 minutes.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexShrink: 0, marginLeft: 48 }}>
            <Button onClick={onEnterApp} style={{ background: "#fff", color: "#4f46e5", padding: "13px 28px" }}>
              Request Demo
            </Button>
            <Button variant="ghost" onClick={onEnterApp} style={{ color: "rgba(255,255,255,0.85)", padding: "13px 28px" }}>
              Try for Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #f1f5f9", padding: "48px 48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>ShortlistAI</span>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 280, lineHeight: 1.6 }}>
              AI-powered recruitment shortlisting for specialist agencies. Built in London.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
              <Mail size={13} color="#94a3b8" />
              <a href="mailto:hello@shortlistai.com" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>hello@shortlistai.com</a>
            </div>
          </div>
          <div style={{ display: "flex", gap: 64 }}>
            {[
              { label: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { label: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { label: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"] },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>{col.label}</div>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ display: "block", fontSize: 13, color: "#64748b", textDecoration: "none", marginBottom: 10 }}>{l}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>© 2025 ShortlistAI Ltd. All rights reserved.</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={12} color="#94a3b8" />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>SOC 2 Type II Certified · GDPR Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── App Shell (Authenticated) ──────────────────────────────────────────────

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "new", label: "New Screening", icon: Plus },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ active, setPage }) => (
  <div style={{
    width: 220, background: "#fff", borderRight: "1px solid #e2e8f0",
    display: "flex", flexDirection: "column", height: "100vh",
    position: "fixed", left: 0, top: 0, zIndex: 10
  }}>
    {/* Logo */}
    <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", letterSpacing: "-0.3px" }}>ShortlistAI</span>
      </div>
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, padding: "12px 12px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", padding: "8px 8px 12px" }}>Main Menu</div>
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "9px 10px", borderRadius: 9, marginBottom: 2, border: "none",
            background: isActive ? "#eef2ff" : "transparent",
            color: isActive ? "#4f46e5" : "#64748b",
            fontSize: 14, fontWeight: isActive ? 600 : 500, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", textAlign: "left",
            transition: "all 0.12s"
          }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>

    {/* User */}
    <div style={{ padding: 16, borderTop: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, background: "#f8fafc" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={16} color="#4f46e5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Sarah Mitchell</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Admin</div>
        </div>
        <ChevronDown size={14} color="#94a3b8" />
      </div>
    </div>
  </div>
);

const TopBar = ({ title, subtitle }) => (
  <div style={{
    height: 64, borderBottom: "1px solid #e2e8f0", background: "#fff",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 32px", position: "sticky", top: 0, zIndex: 5
  }}>
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{subtitle}</div>}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Bell size={16} color="#64748b" />
        <div style={{ position: "absolute", top: 7, right: 8, width: 6, height: 6, borderRadius: "50%", background: "#4f46e5", border: "1.5px solid #fff" }} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 9, border: "1px solid #e2e8f0", cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={14} color="#4f46e5" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>Sarah M.</span>
        <ChevronDown size={13} color="#94a3b8" />
      </div>
    </div>
  </div>
);

// ─── Dashboard View ─────────────────────────────────────────────────────────

const recentScreenings = [
  { role: "Senior React Developer", candidates: 34, topMatch: 94, date: "21 Feb 2025", status: "complete" },
  { role: "DevOps Engineer", candidates: 21, topMatch: 87, date: "20 Feb 2025", status: "complete" },
  { role: "Product Manager (B2B)", candidates: 18, topMatch: 79, date: "19 Feb 2025", status: "processing" },
  { role: "UX Designer — FinTech", candidates: 27, topMatch: 91, date: "18 Feb 2025", status: "complete" },
  { role: "Data Scientist", candidates: 42, topMatch: 83, date: "17 Feb 2025", status: "complete" },
  { role: "Head of Marketing", candidates: 15, topMatch: 0, date: "16 Feb 2025", status: "error" },
];

const DashboardView = ({ setPage }) => (
  <div className="fade-up">
    {/* Stat Cards */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
      {[
        { label: "Screenings This Month", value: "24", delta: "+6 vs last month", icon: <BarChart3 size={18} color="#4f46e5"/>, bg: "#eef2ff" },
        { label: "Average Time Saved", value: "4.2 hrs", delta: "per screening session", icon: <Clock size={18} color="#10b981"/>, bg: "#d1fae5" },
        { label: "Active Roles", value: "7", delta: "3 pending shortlist review", icon: <Briefcase size={18} color="#f59e0b"/>, bg: "#fef3c7" },
      ].map(s => (
        <Card key={s.label} style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px" }}>{s.value}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{s.delta}</div>
        </Card>
      ))}
    </div>

    {/* Recent Screenings Table */}
    <Card>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recent Screenings</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Your last 6 screening sessions</div>
        </div>
        <Button variant="secondary" style={{ fontSize: 13 }} icon={<History size={14}/>}>View All</Button>
      </div>
      <div>
        {/* Table Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
          padding: "10px 24px", borderBottom: "1px solid #f1f5f9"
        }}>
          {["Role Title", "Candidates", "Top Match %", "Date", "Status"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px" }}>{h}</div>
          ))}
        </div>
        {recentScreenings.map((row, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
            padding: "14px 24px", borderBottom: i < recentScreenings.length - 1 ? "1px solid #f8fafc" : "none",
            alignItems: "center", transition: "background 0.12s", cursor: "pointer"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}>{row.role}</div>
            <div style={{ fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={13} color="#94a3b8" />{row.candidates}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: row.topMatch >= 85 ? "#4f46e5" : row.topMatch >= 70 ? "#f59e0b" : "#94a3b8" }}>
              {row.topMatch > 0 ? `${row.topMatch}%` : "—"}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{row.date}</div>
            <div>
              <Badge variant={row.status === "complete" ? "success" : row.status === "processing" ? "indigo" : "error"}>
                {row.status === "complete" ? "Complete" : row.status === "processing" ? "Processing" : "Failed"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>

    {/* Quick action */}
    <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
      <Button onClick={() => setPage("new")} icon={<Plus size={16}/>}>New Screening</Button>
    </div>
  </div>
);

// ─── New Screening Page ─────────────────────────────────────────────────────

const NewScreeningPage = ({ setPage, setResults }) => {
  const [jd, setJd] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith(".pdf") || f.name.endsWith(".doc") || f.name.endsWith(".docx"));
    if (dropped.length === 0) { setError("Only PDF, DOC, and DOCX files are accepted."); return; }
    setError("");
    setFiles(prev => [...prev, ...dropped]);
  };

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    setError("");
  };

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const runScreening = () => {
    if (!jd.trim()) { setError("Please paste a job description before running the screening."); return; }
    if (files.length === 0) { setError("Please upload at least one CV to screen."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResults(true);
      setPage("results");
    }, 3500);
  };

  if (loading) return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420 }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Loader2 size={28} color="#4f46e5" className="spin" style={{ animation: "spin 0.8s linear infinite" }} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Running AI Screening…</div>
      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>Analysing {files.length} candidates against your job description</div>
      <div style={{ width: 400, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <div className="progress-bar" style={{ height: "100%", background: "linear-gradient(90deg, #4f46e5, #6366f1)", borderRadius: 3 }} />
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>This usually takes 15–30 seconds</div>
    </div>
  );

  return (
    <div className="fade-up" style={{ maxWidth: 800 }}>
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10,
          marginBottom: 20, fontSize: 14, color: "#991b1b"
        }}>
          <AlertCircle size={16} color="#ef4444" />
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#991b1b" /></button>
        </div>
      )}

      {/* Job Description */}
      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={16} color="#4f46e5" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Job Description</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Paste the full job spec for best results</div>
          </div>
        </div>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the full job description here, including responsibilities, required skills, qualifications, and any other criteria you're screening for…"
          style={{
            width: "100%", minHeight: 200, padding: "14px 16px",
            borderRadius: 10, border: "1px solid #e2e8f0",
            fontSize: 14, color: "#334155", lineHeight: 1.65,
            fontFamily: "'DM Sans', sans-serif", resize: "vertical",
            outline: "none", transition: "border-color 0.15s",
            background: "#fafbfc"
          }}
          onFocus={e => e.target.style.borderColor = "#6366f1"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{jd.length} characters</span>
        </div>
      </Card>

      {/* CV Upload */}
      <Card style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Upload size={16} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Upload CVs</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>PDF, DOC, DOCX — up to 50 files</div>
          </div>
          {files.length > 0 && <Badge variant="indigo" style={{ marginLeft: "auto" }}>{files.length} file{files.length !== 1 ? "s" : ""}</Badge>}
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={dragging ? "drag-active" : ""}
          style={{
            border: "2px dashed #e2e8f0", borderRadius: 12,
            padding: "40px 24px", textAlign: "center", cursor: "pointer",
            background: dragging ? "#eef2ff" : "#fafbfc",
            transition: "all 0.15s"
          }}>
          <Upload size={28} color={dragging ? "#4f46e5" : "#94a3b8"} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: dragging ? "#4f46e5" : "#475569", marginBottom: 6 }}>
            {dragging ? "Drop files here" : "Drag & drop CV files here"}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>or <span style={{ color: "#4f46e5", fontWeight: 600 }}>browse files</span> from your computer</div>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleFileInput} />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: "#f8fafc", borderRadius: 9, border: "1px solid #f1f5f9"
              }}>
                <FileText size={14} color="#4f46e5" />
                <span style={{ flex: 1, fontSize: 13, color: "#334155", fontWeight: 500 }}>{f.name}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{(f.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <X size={14} color="#94a3b8" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Run Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={runScreening} style={{ padding: "13px 32px", fontSize: 15 }}
          icon={<Zap size={16} fill="rgba(255,255,255,0.5)" />}>
          Run AI Screening
        </Button>
      </div>
    </div>
  );
};

// ─── Results Page ───────────────────────────────────────────────────────────

const candidates = [
  { rank: 1, name: "Priya Kapoor", score: 94, strengths: ["8 yrs React/TypeScript", "Led team of 12", "FinTech domain"], gaps: ["No GraphQL exp"], },
  { rank: 2, name: "Tom Ashworth", score: 89, strengths: ["Node + React stack", "AWS certified", "Agile/Scrum"], gaps: ["Shorter tenure avg"], },
  { rank: 3, name: "Mei-Ling Chen", score: 84, strengths: ["Frontend architect", "Figma handoffs", "Strong portfolio"], gaps: ["No TS at scale"], },
  { rank: 4, name: "James Okafor", score: 79, strengths: ["React Native exp", "Open source contrib"], gaps: ["Limited BA comms", "No CI/CD"], },
  { rank: 5, name: "Alicia Roberts", score: 73, strengths: ["Quick learner", "React + Vue"], gaps: ["3 yrs total exp", "No team lead"], },
  { rank: 6, name: "Daniel Marsh", score: 61, strengths: ["Strong CS degree", "Internship projects"], gaps: ["Junior level", "No prod exp"], },
];

const ResultsPage = () => {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 6 }}>Senior React Developer</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge>Screened 21 Feb 2025</Badge>
            <Badge variant="success">Screening Complete</Badge>
          </div>
        </div>
        <Button variant="secondary" icon={<Download size={15}/>}>Export CSV</Button>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Candidates", value: "34", sub: "Uploaded for screening", icon: <Users size={16} color="#4f46e5"/>, bg: "#eef2ff" },
          { label: "Top Match Score", value: "94%", sub: "Priya Kapoor", icon: <Star size={16} color="#f59e0b" fill="#f59e0b"/>, bg: "#fef3c7" },
          { label: "Average Match Score", value: "76%", sub: "Across all candidates", icon: <TrendingUp size={16} color="#10b981"/>, bg: "#d1fae5" },
        ].map(m => (
          <Card key={m.label} style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px" }}>{m.label}</div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.8px", marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{m.sub}</div>
          </Card>
        ))}
      </div>

      {/* Ranked Table */}
      <Card>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Ranked Shortlist</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Showing top 6 of 34 candidates</div>
        </div>

        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "60px 1.5fr 120px 2fr 1.5fr 100px", padding: "10px 24px", borderBottom: "1px solid #f1f5f9" }}>
          {["Rank", "Candidate", "Match Score", "Key Strengths", "Gaps", ""].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
          ))}
        </div>

        {candidates.map((c, i) => (
          <div key={i}>
            <div style={{
              display: "grid", gridTemplateColumns: "60px 1.5fr 120px 2fr 1.5fr 100px",
              padding: "16px 24px", borderBottom: i < candidates.length - 1 ? "1px solid #f8fafc" : "none",
              alignItems: "center", cursor: "pointer", transition: "background 0.12s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              {/* Rank */}
              <div>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: c.rank === 1 ? "#fef3c7" : c.rank === 2 ? "#f1f5f9" : "#f8fafc",
                  fontSize: 13, fontWeight: 700,
                  color: c.rank === 1 ? "#92400e" : c.rank === 2 ? "#475569" : "#94a3b8"
                }}>#{c.rank}</div>
              </div>

              {/* Name */}
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>

              {/* Score */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: c.score >= 85 ? "#4f46e5" : c.score >= 70 ? "#f59e0b" : "#64748b"
                  }}>{c.score}%</div>
                </div>
                <div style={{ width: 60, height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 5 }}>
                  <div style={{
                    width: `${c.score}%`, height: "100%", borderRadius: 2,
                    background: c.score >= 85 ? "#4f46e5" : c.score >= 70 ? "#f59e0b" : "#94a3b8"
                  }} />
                </div>
              </div>

              {/* Strengths */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {c.strengths.map(s => (
                  <span key={s} style={{ fontSize: 11, background: "#eef2ff", color: "#3730a3", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>{s}</span>
                ))}
              </div>

              {/* Gaps */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {c.gaps.map(g => (
                  <span key={g} style={{ fontSize: 11, background: "#fff7ed", color: "#9a3412", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>{g}</span>
                ))}
              </div>

              {/* View */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                  border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff",
                  fontSize: 12, fontWeight: 500, color: "#475569", cursor: "pointer"
                }}>
                  <Eye size={13} /> Summary
                  <ChevronRight size={12} style={{ transform: expanded === i ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              </div>
            </div>

            {/* Expanded Summary */}
            {expanded === i && (
              <div style={{ padding: "0 24px 20px", background: "#fafbfc", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Full Summary — {c.name}</div>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 16 }}>
                    {c.name} presents as a strong candidate for this role. With {c.strengths[0]}, they demonstrate the technical depth required. Their background shows consistent delivery in team environments. The main concern is {c.gaps[0].toLowerCase()}, which should be explored at interview stage.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="secondary" style={{ fontSize: 12, padding: "7px 14px" }} icon={<Download size={13}/>}>Download PDF</Button>
                    <Button variant="ghost" style={{ fontSize: 12, padding: "7px 14px" }} icon={<ExternalLink size={13}/>}>Share with Client</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── History Page ───────────────────────────────────────────────────────────

const HistoryPage = () => (
  <div className="fade-up">
    <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
        <Search size={15} color="#94a3b8" />
        <input placeholder="Search screenings…" style={{ border: "none", outline: "none", fontSize: 14, color: "#334155", fontFamily: "'DM Sans', sans-serif", flex: 1, background: "transparent" }} />
      </div>
      <Button variant="secondary">Filter</Button>
    </div>
    <Card>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>All Screening History</div>
      {[...recentScreenings, ...recentScreenings.slice(0, 3)].map((row, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
          padding: "14px 24px", borderBottom: "1px solid #f8fafc",
          alignItems: "center", cursor: "pointer", transition: "background 0.12s"
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}>{row.role}</div>
          <div style={{ fontSize: 14, color: "#64748b" }}>{row.candidates}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#4f46e5" }}>{row.topMatch > 0 ? `${row.topMatch}%` : "—"}</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>{row.date}</div>
          <div><Badge variant={row.status === "complete" ? "success" : row.status === "processing" ? "indigo" : "error"}>{row.status === "complete" ? "Complete" : row.status === "processing" ? "Processing" : "Failed"}</Badge></div>
        </div>
      ))}
    </Card>
  </div>
);

// ─── Settings Page ──────────────────────────────────────────────────────────

const SettingsPage = () => (
  <div className="fade-up" style={{ maxWidth: 640 }}>
    {[
      {
        title: "Profile Settings", fields: [
          { label: "Full Name", value: "Sarah Mitchell" },
          { label: "Email", value: "sarah@talentbridge.co.uk" },
          { label: "Organisation", value: "TalentBridge Recruitment" },
        ]
      },
      {
        title: "AI Preferences", fields: [
          { label: "Default Match Threshold", value: "70%" },
          { label: "Summary Length", value: "Medium (150 words)" },
          { label: "Scoring Model", value: "GPT-4o (Recommended)" },
        ]
      }
    ].map(section => (
      <Card key={section.title} style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>{section.title}</div>
        {section.fields.map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{f.label}</div>
            <input defaultValue={f.value} style={{
              width: "100%", padding: "10px 14px", borderRadius: 9,
              border: "1px solid #e2e8f0", fontSize: 14, color: "#334155",
              fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#fafbfc"
            }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <Button>Save Changes</Button>
        </div>
      </Card>
    ))}
  </div>
);

// ─── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("landing");
  const [page, setPage] = useState("dashboard");
  const [hasResults, setHasResults] = useState(false);

  const pageConfig = {
    dashboard: { title: "Dashboard", subtitle: "Welcome back, Sarah" },
    new: { title: "New Screening", subtitle: "Upload CVs and run AI analysis" },
    history: { title: "Screening History", subtitle: "Browse all past sessions" },
    results: { title: "Results", subtitle: "Senior React Developer · 34 candidates" },
    settings: { title: "Settings", subtitle: "Manage your account and preferences" },
  };

  if (view === "landing") {
    return (
      <>
        <GlobalStyles />
        <LandingPage onEnterApp={() => setView("app")} />
      </>
    );
  }

  const config = pageConfig[page];

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar active={page} setPage={setPage} />
        <div style={{ flex: 1, marginLeft: 220, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <TopBar title={config.title} subtitle={config.subtitle} />
          <main style={{ flex: 1, padding: "28px 32px", background: "#f8fafc" }}>
            {page === "dashboard" && <DashboardView setPage={setPage} />}
            {page === "new" && <NewScreeningPage setPage={setPage} setResults={setHasResults} />}
            {page === "history" && <HistoryPage />}
            {page === "results" && <ResultsPage />}
            {page === "settings" && <SettingsPage />}
          </main>
        </div>
      </div>
    </>
  );
}
