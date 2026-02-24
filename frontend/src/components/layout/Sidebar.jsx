import {
  LayoutDashboard,
  Plus,
  History,
  Settings,
  LogOut,
  User,
  Zap,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "new", label: "New Screening", icon: Plus },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({ active, setPage, user, onLogout }) => (
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
    {/* Logo */}
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

    {/* Nav items */}
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
              fontFamily: "'DM Sans', sans-serif",
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

    {/* User + logout */}
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
          fontFamily: "'DM Sans', sans-serif",
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
