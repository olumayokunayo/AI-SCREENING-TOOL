import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { apiJson } from "../api/client";

export const History = ({ setPage, setSelectedScreeningId }) => {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiJson("/screenings?limit=50")
      .then((data) => setScreenings(data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = screenings.filter((s) =>
    (s.role_title || "Untitled Role")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const viewScreening = (id) => {
    setSelectedScreeningId(id);
    setPage("results");
  };

  return (
    <div className="fade-up">
      {/* Search bar */}
      <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            placeholder="Search by role title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#334155",
              fontFamily: "'DM Sans', sans-serif",
              flex: 1,
              background: "transparent",
            }}
          />
        </div>
      </div>

      <Card>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            All Screening History
          </div>
          <Badge variant="indigo">
            {filtered.length} screening{filtered.length !== 1 ? "s" : ""}
          </Badge>
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
              color="#4f46e5"
            />{" "}
            Retrieving screening history…
          </div>
        ) : error ? (
          <div style={{ padding: 32 }}>
            <ErrorBanner message={error} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            {search
              ? `No screenings found matching "${search}"`
              : "No screening history found. Run your first screening to get started."}
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
                "Candidates",
                "Top Match %",
                "Date",
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
            {filtered.map((row, i) => (
              <div
                key={row.id}
                onClick={() => viewScreening(row.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1.2fr 1fr",
                  padding: "14px 24px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #f8fafc" : "none",
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
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  {row.candidate_count}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      (row.top_match_score || 0) >= 80
                        ? "#4f46e5"
                        : (row.top_match_score || 0) >= 60
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
                      ? "Complete"
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
