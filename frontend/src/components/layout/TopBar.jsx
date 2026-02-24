import { Bell } from "lucide-react";

export const TopBar = ({ title, subtitle }) => (
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
