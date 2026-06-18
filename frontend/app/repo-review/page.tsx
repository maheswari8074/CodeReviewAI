"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { useJobPolling } from "../hooks/useJobPolling";

export default function RepoReviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const { startPolling, polling, error: pollError } = useJobPolling({
    statusUrl: (id) =>
      `${process.env.NEXT_PUBLIC_API_URL}/api/repo-reviews/${id}/status`,
    onComplete: (data) => {
      router.push(`/repo-review/${data.repoReviewId}`);
    },
    onFailed: () => {
      setSubmitting(false);
    },
  });

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading]);

  useEffect(() => {
    if (pollError) setError(pollError);
  }, [pollError]);

  const handleSubmit = async () => {
    if (!repoUrl.trim() || !repoUrl.includes("github.com")) {
      setError("Please enter a valid GitHub repo URL.");
      return;
    }
    setError("");
    setSubmitting(true);
    setStatus("Starting review...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repo-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("Analyzing repository files...");
        startPolling(data.repoReviewId);
      } else {
        setError(data.message || "Failed to start review.");
        setSubmitting(false);
      }
    } catch (err) {
      setError("Something went wrong.");
      setSubmitting(false);
    }
  };

  const isBusy = submitting || polling;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 48px",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        background: "var(--bg-primary)",
        zIndex: 100
      }}>
        <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "var(--accent)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: "700", color: "#0F0F0F",
            fontFamily: "Space Grotesk"
          }}>C</div>
          <span style={{ fontFamily: "Space Grotesk", fontWeight: "600", fontSize: "18px" }}>
            CodeReviewAI
          </span>
        </div>
        <button onClick={() => router.push("/dashboard")} style={{
          background: "transparent",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
          padding: "8px 16px",
          borderRadius: "8px",
          fontFamily: "Space Grotesk",
          fontSize: "13px",
          cursor: "pointer"
        }}>
          ← Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "100px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⬡</div>
          <h1 style={{
            fontFamily: "Space Grotesk",
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "12px",
            letterSpacing: "-1px"
          }}>
            Review an entire repository
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Paste a public GitHub repo URL. We'll analyze up to 8 key files and give you an aggregated report.
          </p>
        </div>

        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px"
        }}>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            disabled={isBusy}
            style={{
              width: "100%",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "14px 16px",
              color: "var(--text-primary)",
              fontFamily: "JetBrains Mono",
              fontSize: "14px",
              outline: "none",
              marginBottom: "16px"
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />

          {error && (
            <p style={{ color: "var(--critical)", fontFamily: "JetBrains Mono", fontSize: "12px", marginBottom: "16px" }}>
              ⚠ {error}
            </p>
          )}

          {status && isBusy && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                width: "16px", height: "16px",
                border: "2px solid var(--border)",
                borderTop: "2px solid var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: "13px", color: "var(--accent)" }}>
                {status}
              </span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isBusy}
            style={{
              width: "100%",
              background: isBusy ? "var(--bg-tertiary)" : "var(--accent)",
              color: isBusy ? "var(--text-secondary)" : "#0F0F0F",
              border: "none",
              padding: "14px",
              borderRadius: "8px",
              fontFamily: "Space Grotesk",
              fontWeight: "700",
              fontSize: "15px",
              cursor: isBusy ? "not-allowed" : "pointer",
            }}
          >
            {isBusy ? "Reviewing repository..." : "Analyze Repository →"}
          </button>
        </div>

        <p style={{
          textAlign: "center",
          color: "var(--text-secondary)",
          fontSize: "12px",
          marginTop: "16px",
          fontFamily: "JetBrains Mono"
        }}>
          This may take 30-60 seconds depending on repo size
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
