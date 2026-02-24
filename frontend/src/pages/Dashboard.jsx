import { useState, useEffect } from "react";
import { BarChart3, Star, Briefcase, Plus, Users, Loader2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { apiJson } from "../api/client";

export const Dashboard = ({ setPage, setSelectedScreeningId }) => {
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
    const d = new Date(s.created_at),
      now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const topScore =
    screenings.length > 0
      ? Math.max(...screenings.map((s) => s.top_match_score || 0)).toFixed(1)
      : "—";

  const viewScreening = (id) => {
    setSelectedScreeningId(id);
    setPage("results");
  };

  const stats = [
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
  ];

  return (
    <div className="fade-up">
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {stats.map((s) => (
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

      {/* Recent screenings table */}
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
