"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { useJobPolling } from "../../hooks/useJobPolling";
import ChatPanel from "../../components/ChatPanel";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#E05252",
  warning: "#E8A020",
  suggestion: "#5299E0",
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--accent)";
  return "var(--critical)";
};

export default function RepoReviewDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [repoReview, setRepoReview] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("issues");

  const fetchFullReview = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/repo-reviews/${params.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    if (res.ok) setRepoReview(data);
    return { ok: res.ok, data };
  };

  const { startPolling } = useJobPolling({
    statusUrl: (id) =>
      `${process.env.NEXT_PUBLIC_API_URL}/api/repo-reviews/${id}/status`,
    onComplete: async () => {
      await fetchFullReview();
      setFetching(false);
    },
    onFailed: async () => {
      await fetchFullReview();
      setFetching(false);
    },
  });

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const { ok, data } = await fetchFullReview();
        if (!ok) {
          router.push("/repo-review");
          return;
        }
        if (data.status === "processing") {
          startPolling(params.id as string);
        } else {
          setFetching(false);
        }
      } catch {
        router.push("/repo-review");
      }
    };

    load();
  }, [user, params.id]);

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: "13px",
            color: "var(--accent)",
          }}
        >
          {value}/100
        </span>
      </div>
      <div
        style={{
          height: "4px",
          background: "var(--bg-tertiary)",
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: getScoreColor(value),
            borderRadius: "2px",
          }}
        />
      </div>
    </div>
  );

  if (fetching || repoReview?.status === "processing") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "2px solid var(--border)",
            borderTop: "2px solid var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            fontFamily: "Space Grotesk",
            fontSize: "15px",
            color: "var(--text-secondary)",
          }}
        >
          Analyzing repository files...
        </p>
        {repoReview?.repoName && (
          <p
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              color: "var(--accent)",
            }}
          >
            {repoReview.repoName}
          </p>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (repoReview?.status === "failed") {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <Nav router={router} />
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "80px 48px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>✕</div>
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            Review failed
          </h1>
          <p
            style={{
              color: "var(--critical)",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            {repoReview.error || "Something went wrong while reviewing this repo."}
          </p>
          <button
            onClick={() => router.push("/repo-review")}
            style={{
              background: "var(--accent)",
              color: "#0F0F0F",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontFamily: "Space Grotesk",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const selectedFile = repoReview?.files?.[selectedFileIndex];
  const fileResult = selectedFile?.result;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Nav router={router} />

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "11px",
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "8px",
            }}
          >
            Repository Review
          </p>
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "-1px",
              marginBottom: "8px",
            }}
          >
            {repoReview?.repoName}
          </h1>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <a
              href={repoReview?.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              {repoReview?.repoUrl}
            </a>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              {new Date(repoReview?.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Aggregate stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            { label: "Avg Score", value: repoReview?.avgScore, suffix: "/100" },
            { label: "Files Reviewed", value: repoReview?.filesReviewed },
            { label: "Total Issues", value: repoReview?.totalIssues },
            { label: "Critical", value: repoReview?.criticalCount },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "28px",
                  fontWeight: "700",
                  color:
                    stat.label === "Avg Score"
                      ? getScoreColor(stat.value || 0)
                      : stat.label === "Critical" && stat.value > 0
                        ? "var(--critical)"
                        : "var(--accent)",
                  marginBottom: "4px",
                }}
              >
                {stat.value ?? 0}
                {stat.suffix || ""}
              </div>
              <div
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* File list */}
          <div>
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "10px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}
            >
              Reviewed Files ({repoReview?.files?.length || 0})
            </div>
            {repoReview?.files?.map((file: any, i: number) => (
              <button
                key={file.path}
                onClick={() => {
                  setSelectedFileIndex(i);
                  setActiveTab("issues");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background:
                    selectedFileIndex === i
                      ? "var(--bg-tertiary)"
                      : "var(--bg-secondary)",
                  border: `1px solid ${selectedFileIndex === i ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "11px",
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                    wordBreak: "break-all",
                  }}
                >
                  {file.path}
                </div>
                {file.result?.overallScore != null && (
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: getScoreColor(file.result.overallScore),
                    }}
                  >
                    {file.result.overallScore}/100
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* File detail */}
          {fileResult ? (
            <div>
              <h2
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "20px",
                  wordBreak: "break-all",
                }}
              >
                {selectedFile.path}
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "240px 1fr",
                  gap: "24px",
                  alignItems: "start",
                }}
              >
                {/* Scores */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontSize: "56px",
                      fontWeight: "700",
                      lineHeight: "1",
                      color: getScoreColor(fileResult.overallScore),
                      marginBottom: "4px",
                    }}
                  >
                    {fileResult.overallScore}
                  </div>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: "10px",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "20px",
                    }}
                  >
                    File Score
                  </div>
                  <ScoreBar label="Readability" value={fileResult.readability} />
                  <ScoreBar label="Performance" value={fileResult.performance} />
                  <ScoreBar label="Security" value={fileResult.security} />
                  <ScoreBar
                    label="Maintainability"
                    value={fileResult.maintainability}
                  />
                </div>

                {/* Tabs */}
                <div>
                  <div
                    style={{ display: "flex", gap: "4px", marginBottom: "16px" }}
                  >
                    {["issues", "refactoring", "summary"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          background:
                            activeTab === tab
                              ? "var(--accent)"
                              : "var(--bg-secondary)",
                          color:
                            activeTab === tab
                              ? "#0F0F0F"
                              : "var(--text-secondary)",
                          border: `1px solid ${activeTab === tab ? "var(--accent)" : "var(--border)"}`,
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontFamily: "Space Grotesk",
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >
                        {tab}{" "}
                        {tab === "issues" &&
                          `(${fileResult.issues?.length || 0})`}
                      </button>
                    ))}
                  </div>

                  {activeTab === "issues" &&
                    fileResult.issues?.map((issue: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: "var(--bg-secondary)",
                          border: `1px solid ${SEVERITY_COLORS[issue.severity]}33`,
                          borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity]}`,
                          borderRadius: "8px",
                          padding: "16px",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "JetBrains Mono",
                              fontSize: "10px",
                              color: SEVERITY_COLORS[issue.severity],
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            {issue.severity} · {issue.category}
                          </span>
                          {issue.line && (
                            <span
                              style={{
                                fontFamily: "JetBrains Mono",
                                fontSize: "10px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              line {issue.line}
                            </span>
                          )}
                        </div>
                        <h4
                          style={{
                            fontFamily: "Space Grotesk",
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "6px",
                          }}
                        >
                          {issue.title}
                        </h4>
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            marginBottom: "8px",
                          }}
                        >
                          {issue.description}
                        </p>
                        {issue.suggestion && (
                          <p
                            style={{
                              color: "var(--success)",
                              fontSize: "12px",
                              fontFamily: "JetBrains Mono",
                            }}
                          >
                            → {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}

                  {activeTab === "refactoring" &&
                    (fileResult.refactoring?.length ? (
                      fileResult.refactoring.map((r: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            padding: "20px",
                            marginBottom: "12px",
                          }}
                        >
                          <div style={{ marginBottom: "12px" }}>
                            <div
                              style={{
                                fontFamily: "JetBrains Mono",
                                fontSize: "10px",
                                color: "var(--critical)",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                              }}
                            >
                              Before
                            </div>
                            <pre
                              style={{
                                background: "var(--bg-tertiary)",
                                padding: "12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                overflowX: "auto",
                                color: "var(--text-primary)",
                                lineHeight: "1.6",
                              }}
                            >
                              {r.before}
                            </pre>
                          </div>
                          <div style={{ marginBottom: "12px" }}>
                            <div
                              style={{
                                fontFamily: "JetBrains Mono",
                                fontSize: "10px",
                                color: "var(--success)",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                              }}
                            >
                              After
                            </div>
                            <pre
                              style={{
                                background: "var(--bg-tertiary)",
                                padding: "12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                overflowX: "auto",
                                color: "var(--text-primary)",
                                lineHeight: "1.6",
                              }}
                            >
                              {r.after}
                            </pre>
                          </div>
                          <p
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "13px",
                              lineHeight: "1.6",
                            }}
                          >
                            {r.explanation}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "14px",
                        }}
                      >
                        No refactoring suggestions for this file.
                      </p>
                    ))}

                  {activeTab === "summary" && (
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "24px",
                      }}
                    >
                      <p
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "15px",
                          lineHeight: "1.8",
                        }}
                      >
                        {fileResult.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              No review data available for the selected file.
            </p>
          )}
        </div>
      </div>

      <ChatPanel
        repoReviewId={params.id as string}
        title="Ask about this repo"
      />
    </main>
  );
}

function Nav({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 48px",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        background: "var(--bg-primary)",
        zIndex: 100,
      }}
    >
      <div
        onClick={() => router.push("/dashboard")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "var(--accent)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "700",
            color: "#0F0F0F",
            fontFamily: "Space Grotesk",
          }}
        >
          C
        </div>
        <span
          style={{
            fontFamily: "Space Grotesk",
            fontWeight: "600",
            fontSize: "18px",
          }}
        >
          CodeReviewAI
        </span>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => router.push("/repo-review")}
          style={{
            background: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontFamily: "Space Grotesk",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ← New Repo Review
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "var(--accent)",
            color: "#0F0F0F",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            fontFamily: "Space Grotesk",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>
      </div>
    </nav>
  );
}
