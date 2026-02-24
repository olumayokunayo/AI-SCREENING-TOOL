import { AlertCircle, X } from "lucide-react";

export const ErrorBanner = ({ message, onClose }) =>
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
