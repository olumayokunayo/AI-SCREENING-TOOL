import { Card } from "../components/ui/Card";

export const Settings = ({ user }) => (
  <div className="fade-up" style={{ maxWidth: 640 }}>
    {/* Account Details */}
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
              fontFamily: "'DM Sans', sans-serif",
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

    {/* AI Configuration */}
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
