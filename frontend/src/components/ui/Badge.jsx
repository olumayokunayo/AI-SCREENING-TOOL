export const Badge = ({ children, variant = "default" }) => {
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
