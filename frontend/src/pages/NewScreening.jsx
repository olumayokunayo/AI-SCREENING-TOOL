import { useState, useRef } from "react";
import { FileText, Upload, Zap, X, Loader2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { apiFetch } from "../api/client";

export const NewScreening = ({ setPage, setSelectedScreeningId }) => {
  const [jd, setJd] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(pdf|docx?)$/i.test(f.name),
    );
    if (!dropped.length) {
      setError(
        "Unsupported file type. Please upload PDF, DOC, or DOCX files only.",
      );
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileInput = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    setError("");
  };

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const runScreening = async () => {
    if (!jd.trim()) {
      setError("Please paste a job description before running the screening.");
      return;
    }
    if (!files.length) {
      setError("Please upload at least one CV to screen against this role.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("job_description", jd);
      files.forEach((f) => formData.append("cvs", f));
      const res = await apiFetch("/screenings", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setSelectedScreeningId(data.id);
      setPage("results");
    } catch (err) {
      setError(
        err.message ||
          "The screening could not be completed. Please check your files and try again.",
      );
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div
        className="fade-up"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 420,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Loader2
            size={28}
            color="#4f46e5"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Screening in Progress
        </div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
          Analysing {files.length} candidate{files.length !== 1 ? "s" : ""} ·
          This takes 15–45 seconds
        </div>
        <div
          style={{
            width: 420,
            height: 6,
            background: "#e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            className="progress-bar"
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #4f46e5, #6366f1)",
              borderRadius: 3,
            }}
          />
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
          Extracting CV text, calculating role match scores, and writing
          candidate summaries…
        </div>
      </div>
    );

  return (
    <div className="fade-up" style={{ maxWidth: 800 }}>
      <ErrorBanner message={error} onClose={() => setError("")} />

      {/* Job Description */}
      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={16} color="#4f46e5" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Job Description
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Include the full role brief — responsibilities, required skills,
              and essential criteria — for the most accurate candidate matching.
            </div>
          </div>
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here. The more detail you include, the more accurately candidates will be scored and ranked against the role."
          style={{
            width: "100%",
            minHeight: 200,
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            color: "#334155",
            lineHeight: 1.65,
            fontFamily: "'DM Sans', sans-serif",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.15s",
            background: "#fafbfc",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
        >
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {jd.length} characters
          </span>
        </div>
      </Card>

      {/* CV Upload */}
      <Card style={{ padding: 28, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Upload size={16} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Upload Candidate CVs
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Accepted formats: PDF, DOC, DOCX. Maximum 50 CVs per screening, 10
              MB per file.
            </div>
          </div>
          {files.length > 0 && (
            <Badge variant="indigo" style={{ marginLeft: "auto" }}>
              {files.length} file{files.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={dragging ? "drag-active" : ""}
          style={{
            border: "2px dashed #e2e8f0",
            borderRadius: 12,
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "#eef2ff" : "#fafbfc",
            transition: "all 0.15s",
          }}
        >
          <Upload
            size={28}
            color={dragging ? "#4f46e5" : "#94a3b8"}
            style={{ margin: "0 auto 12px" }}
          />
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: dragging ? "#4f46e5" : "#475569",
              marginBottom: 6,
            }}
          >
            {dragging ? "Release to add files" : "Drag and drop CV files here"}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            or{" "}
            <span style={{ color: "#4f46e5", fontWeight: 600 }}>
              browse your computer
            </span>{" "}
            to select files
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </div>

        {files.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderRadius: 9,
                  border: "1px solid #f1f5f9",
                }}
              >
                <FileText size={14} color="#4f46e5" />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#334155",
                    fontWeight: 500,
                  }}
                >
                  {f.name}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => removeFile(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                  }}
                >
                  <X size={14} color="#94a3b8" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={runScreening}
          style={{ padding: "13px 32px", fontSize: 15 }}
          icon={<Zap size={16} />}
        >
          Analyse & Rank Candidates
        </Button>
      </div>
    </div>
  );
};
