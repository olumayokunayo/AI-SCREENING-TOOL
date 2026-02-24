export const Button = ({
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
    fontFamily: "'DM Sans', sans-serif",
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
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "";
      }}
    >
      {icon}
      {children}
    </button>
  );
};
