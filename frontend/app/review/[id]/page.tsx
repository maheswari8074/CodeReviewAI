"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { useJobPolling } from "../../hooks/useJobPolling";
import ChatPanel from "../../components/ChatPanel";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const SEVERITY_COLORS: Record<string, string> = {
  critical: "#E05252",
  warning: "#E8A020",
  suggestion: "#5299E0",
};

export default function ReviewDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [review, setReview] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("issues");

  const { startPolling } = useJobPolling({
    statusUrl: (id) =>
      `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${id}/status`,
    onComplete: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (res.ok) setReview(data);
      setFetching(false);
    },
    onFailed: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (res.ok) setReview(data);
      setFetching(false);
    },
  });

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading]);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (res.ok) {
          if (data.status === "processing") {
            startPolling(params.id as string);
          } else {
            setReview(data);
            setFetching(false);
          }
        } else {
          router.push("/history");
        }
      } catch (err) {
        router.push("/history");
      }
    };
    if (user) fetchReview();
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
            background:
              value >= 80
                ? "var(--success)"
                : value >= 60
                  ? "var(--accent)"
                  : "var(--critical)",
            borderRadius: "2px",
          }}
        />
      </div>
    </div>
  );

  if (fetching)
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
          Analyzing code...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  const exportPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Header
    pdf.setFillColor(15, 15, 15);
    pdf.rect(0, 0, pageWidth, 297, "F");

    pdf.setTextColor(232, 160, 32);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("CodeReviewAI", 20, y);

    y += 8;
    pdf.setTextColor(160, 153, 143);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Code Review Report · ${new Date(review?.createdAt).toLocaleDateString()}`,
      20,
      y,
    );

    y += 6;
    pdf.setDrawColor(42, 42, 42);
    pdf.line(20, y, pageWidth - 20, y);
    y += 12;

    // Filename + Language
    pdf.setTextColor(240, 237, 230);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(review?.filename || "Untitled Code", 20, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.setTextColor(160, 153, 143);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Language: ${review?.language}`, 20, y);
    y += 12;

    // Overall Score
    pdf.setFontSize(13);
    pdf.setTextColor(232, 160, 32);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Overall Score: ${review?.result?.overallScore}/100`, 20, y);
    y += 8;

    // Score breakdown
    const scores = [
      { label: "Readability", value: review?.result?.readability },
      { label: "Performance", value: review?.result?.performance },
      { label: "Security", value: review?.result?.security },
      { label: "Maintainability", value: review?.result?.maintainability },
    ];

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    scores.forEach((s) => {
      pdf.setTextColor(160, 153, 143);
      pdf.text(`${s.label}: ${s.value}/100`, 20, y);
      y += 6;
    });

    y += 4;
    pdf.setDrawColor(42, 42, 42);
    pdf.line(20, y, pageWidth - 20, y);
    y += 10;

    // Complexity
    pdf.setTextColor(232, 160, 32);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Complexity Analysis", 20, y);
    y += 7;
    pdf.setTextColor(240, 237, 230);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Time Complexity: ${review?.result?.timeComplexity}`, 20, y);
    y += 6;
    pdf.text(`Space Complexity: ${review?.result?.spaceComplexity}`, 20, y);
    y += 10;

    pdf.setDrawColor(42, 42, 42);
    pdf.line(20, y, pageWidth - 20, y);
    y += 10;

    // Summary
    pdf.setTextColor(232, 160, 32);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary", 20, y);
    y += 7;
    pdf.setTextColor(240, 237, 230);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const summaryLines = pdf.splitTextToSize(
      review?.result?.summary || "",
      pageWidth - 40,
    );
    pdf.text(summaryLines, 20, y);
    y += summaryLines.length * 6 + 8;

    pdf.setDrawColor(42, 42, 42);
    pdf.line(20, y, pageWidth - 20, y);
    y += 10;

    // Issues
    pdf.setTextColor(232, 160, 32);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Issues (${review?.result?.issues?.length || 0})`, 20, y);
    y += 8;

    review?.result?.issues?.forEach((issue: any, i: number) => {
      if (y > 260) {
        pdf.addPage();
        pdf.setFillColor(15, 15, 15);
        pdf.rect(0, 0, pageWidth, 297, "F");
        y = 20;
      }

      const severityColor: Record<string, [number, number, number]> = {
        critical: [224, 82, 82],
        warning: [232, 160, 32],
        suggestion: [82, 153, 224],
      };
      const [r, g, b] = severityColor[issue.severity] || [160, 153, 143];
      pdf.setTextColor(r, g, b);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `${issue.severity.toUpperCase()} · ${issue.category}${issue.line ? ` · Line ${issue.line}` : ""}`,
        20,
        y,
      );
      y += 6;

      pdf.setTextColor(240, 237, 230);
      pdf.setFont("helvetica", "bold");
      pdf.text(issue.title, 20, y);
      y += 6;

      pdf.setTextColor(160, 153, 143);
      pdf.setFont("helvetica", "normal");
      const descLines = pdf.splitTextToSize(issue.description, pageWidth - 40);
      pdf.text(descLines, 20, y);
      y += descLines.length * 5 + 4;

      if (issue.suggestion) {
        pdf.setTextColor(82, 168, 120);
        const suggLines = pdf.splitTextToSize(
          `→ ${issue.suggestion}`,
          pageWidth - 40,
        );
        pdf.text(suggLines, 20, y);
        y += suggLines.length * 5 + 4;
      }

      y += 4;
    });

    // Footer
    pdf.setTextColor(42, 42, 42);
    pdf.setFontSize(9);
    pdf.text("Generated by CodeReviewAI", 20, 290);

    pdf.save(`${review?.filename || "codereview"}-report.pdf`);
  };
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Navbar */}
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
            onClick={() => router.push("/history")}
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
            ← History
          </button>
          <button
            onClick={exportPDF}
            style={{
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontFamily: "Space Grotesk",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Export PDF
          </button>
          <button
            onClick={() => router.push("/review")}
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
            New Review
          </button>
        </div>
      </nav>

      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 48px" }}
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
            Review Result
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
            {review?.filename || "Untitled Code"}
          </h1>
          <div style={{ display: "flex", gap: "16px" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              {review?.language}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              {new Date(review?.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* Left — Scores */}
          <div>
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "72px",
                  fontWeight: "700",
                  lineHeight: "1",
                  color:
                    review?.result?.overallScore >= 80
                      ? "var(--success)"
                      : review?.result?.overallScore >= 60
                        ? "var(--accent)"
                        : "var(--critical)",
                }}
              >
                {review?.result?.overallScore}
              </div>
              <div
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "24px",
                }}
              >
                Overall Score
              </div>
              <ScoreBar
                label="Readability"
                value={review?.result?.readability}
              />
              <ScoreBar
                label="Performance"
                value={review?.result?.performance}
              />
              <ScoreBar label="Security" value={review?.result?.security} />
              <ScoreBar
                label="Maintainability"
                value={review?.result?.maintainability}
              />
            </div>

            {/* Complexity */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              {[
                { label: "Time", value: review?.result?.timeComplexity },
                { label: "Space", value: review?.result?.spaceComplexity },
              ].map((c) => (
                <div
                  key={c.label}
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: "18px",
                      color: "var(--accent)",
                      fontWeight: "500",
                      marginBottom: "4px",
                    }}
                  >
                    {c.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: "10px",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    {c.label} Complexity
                  </div>
                </div>
              ))}
            </div>

            {/* Code Preview */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "10px",
                }}
              >
                Submitted Code
              </div>
              <pre
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "11px",
                  color: "var(--text-primary)",
                  overflowX: "auto",
                  maxHeight: "200px",
                  overflowY: "auto",
                  lineHeight: "1.6",
                }}
              >
                {review?.code}
              </pre>
            </div>
          </div>

          {/* Right — Tabs */}
          <div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
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
                      activeTab === tab ? "#0F0F0F" : "var(--text-secondary)",
                    border: `1px solid ${activeTab === tab ? "var(--accent)" : "var(--border)"}`,
                    padding: "8px 20px",
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
                    `(${review?.result?.issues?.length || 0})`}
                </button>
              ))}
            </div>

            {activeTab === "issues" &&
              review?.result?.issues?.map((issue: any, i: number) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-secondary)",
                    border: `1px solid ${SEVERITY_COLORS[issue.severity]}33`,
                    borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity]}`,
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "12px",
                    animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
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
              review?.result?.refactoring?.map((r: any, i: number) => (
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
                      fontFamily: "Inter",
                      lineHeight: "1.6",
                    }}
                  >
                    {r.explanation}
                  </p>
                </div>
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
                    fontFamily: "Inter",
                  }}
                >
                  {review?.result?.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <ChatPanel
        reviewId={params.id as string}
        title="Ask about this review"
      />
    </main>
  );
}
