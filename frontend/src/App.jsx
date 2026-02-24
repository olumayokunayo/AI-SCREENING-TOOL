import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import "./styles/global.css";

import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";

import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { NewScreening } from "./pages/NewScreening";
import { Results } from "./pages/Results";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";

import { getToken, clearToken, apiJson } from "./api/client";

const PAGE_CONFIG = {
  dashboard: {
    title: "Dashboard",
    subtitle: (user) =>
      `Welcome back, ${user.full_name || user.email.split("@")[0]}`,
  },
  new: {
    title: "New Screening",
    subtitle: () => "Upload a job description and candidate CVs to begin",
  },
  history: {
    title: "Screening History",
    subtitle: () => "View and revisit all previous screening sessions",
  },
  results: {
    title: "Results",
    subtitle: () => "AI-ranked candidate shortlist",
  },
  settings: {
    title: "Settings",
    subtitle: () => "Manage your account and AI configuration",
  },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [selectedScreeningId, setSelectedScreeningId] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    apiJson("/auth/me")
      .then((me) => {
        setUser(me);
        setAuthChecked(true);
      })
      .catch(() => {
        clearToken();
        setAuthChecked(true);
      });
  }, []);

  const handleAuth = (me) => setUser(me);
  const handleLogout = () => {
    clearToken();
    setUser(null);
    setPage("dashboard");
    setSelectedScreeningId(null);
  };

  // Loading splash
  if (!authChecked)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={28}
          color="#4f46e5"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
      </div>
    );

  // Unauthenticated
  if (!user) return <AuthPage onAuth={handleAuth} />;

  const config = PAGE_CONFIG[page] || PAGE_CONFIG.dashboard;
  const subtitle = config.subtitle(user);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        active={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
      />

      <div
        style={{
          flex: 1,
          marginLeft: 220,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <TopBar title={config.title} subtitle={subtitle} />

        <main style={{ flex: 1, padding: "28px 32px", background: "#f8fafc" }}>
          {page === "dashboard" && (
            <Dashboard
              setPage={setPage}
              setSelectedScreeningId={setSelectedScreeningId}
            />
          )}
          {page === "new" && (
            <NewScreening
              setPage={setPage}
              setSelectedScreeningId={setSelectedScreeningId}
            />
          )}
          {page === "history" && (
            <History
              setPage={setPage}
              setSelectedScreeningId={setSelectedScreeningId}
            />
          )}
          {page === "results" && (
            <Results screeningId={selectedScreeningId} setPage={setPage} />
          )}
          {page === "settings" && <Settings user={user} />}
        </main>
      </div>
    </div>
  );
}
