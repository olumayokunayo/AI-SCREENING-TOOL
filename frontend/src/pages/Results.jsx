import { useState, useEffect } from "react";
import {
  Users,
  Star,
  TrendingUp,
  Download,
  Eye,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { apiJson, apiFetch } from "../api/client";

export const Results = ({ screeningId, setPage }) => {
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
    } catch {
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

  const metrics = [
    {
      label: "CVs Screened",
      value: String(data.candidate_count),
      sub: "Candidates assessed against this role",
      icon: <Users size={16} color="#4f46e5" />,
      bg: "#eef2ff",
    },
    {
      label: "Top Role Match Score",
      value: data.top_match_score ? `${data.top_match_score.toFixed(1)}%` : "—",
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
  ];

  return (
    <div className="fade-up">
      {/* Header */}
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

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {metrics.map((m) => (
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

      {/* Ranked shortlist table */}
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
                {/* Rank */}
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

                {/* Name */}
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

                {/* Score */}
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

                {/* Strengths */}
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

                {/* Gaps */}
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

                {/* View button */}
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

              {/* Expanded summary */}
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
