export const Card = ({ children, style = {} }) => (
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
