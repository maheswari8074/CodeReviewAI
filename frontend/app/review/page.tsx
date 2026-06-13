"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

const LANGUAGES = ["auto", "javascript", "typescript", "python", "java", "c++", "go", "rust"];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#E05252",
  warning: "#E8A020",
  suggestion: "#5299E0",
};

export default function ReviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("issues");
  const [filename, setFilename] = useState("");
  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading]);

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Please paste some code first.");
      return;
    }
    setError("");
    setReviewing(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language, filename }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
        setActiveTab("issues");
      } else {
        setError(data.message || "Review failed.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setReviewing(false);
    }
  };

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontFamily: "Inter", fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: "13px", color: "var(--accent)" }}>{value}/100</span>
      </div>
      <div style={{ height: "4px", background: "var(--bg-tertiary)", borderRadius: "2px" }}>
        <div style={{
          height: "100%",
          width: `${value}%`,
          background: value >= 80 ? "var(--success)" : value >= 60 ? "var(--accent)" : "var(--critical)",
          borderRadius: "2px",
          transition: "width 1s ease"
        }} />
      </div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Navbar */}
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
        <div
          onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
        >
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => router.push("/history")} style={{
            background: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontFamily: "Space Grotesk",
            fontSize: "13px",
            cursor: "pointer"
          }}>
            History
          </button>
          {user?.avatar && (
            <img src={user.avatar} alt={user.username}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid var(--border)" }}
            />
          )}
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: "32px", alignItems: "start" }}>

          {/* Left — Code Input */}
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{ fontFamily: "Space Grotesk", fontSize: "28px", fontWeight: "700", marginBottom: "8px", letterSpacing: "-1px" }}>
                Review Code
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Paste your code below and get instant AI feedback.
              </p>
            </div>
            {/* Filename Input */}
<input
  type="text"
  value={filename}
  onChange={(e) => setFilename(e.target.value)}
  placeholder="Filename (e.g. solution.py)"
  style={{
    width: "100%",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 16px",
    color: "var(--text-primary)",
    fontFamily: "JetBrains Mono",
    fontSize: "13px",
    outline: "none",
    marginBottom: "12px",
    transition: "border-color 0.2s"
  }}
  onFocus={e => e.target.style.borderColor = "var(--accent)"}
  onBlur={e => e.target.style.borderColor = "var(--border)"}
/>

            {/* Language Selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  style={{
                    background: language === lang ? "var(--accent)" : "var(--bg-secondary)",
                    color: language === lang ? "#0F0F0F" : "var(--text-secondary)",
                    border: `1px solid ${language === lang ? "var(--accent)" : "var(--border)"}`,
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontFamily: "JetBrains Mono",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Code Editor */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your code here..."
              style={{
                width: "100%",
                height: "420px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
                color: "var(--text-primary)",
                fontFamily: "JetBrains Mono",
                fontSize: "13px",
                lineHeight: "1.7",
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />

            {error && (
              <p style={{ color: "var(--critical)", fontFamily: "JetBrains Mono", fontSize: "12px", marginTop: "8px" }}>
                ⚠ {error}
              </p>
            )}

            <button
              onClick={handleReview}
              disabled={reviewing}
              style={{
                width: "100%",
                marginTop: "16px",
                background: reviewing ? "var(--bg-tertiary)" : "var(--accent)",
                color: reviewing ? "var(--text-secondary)" : "#0F0F0F",
                border: "none",
                padding: "16px",
                borderRadius: "10px",
                fontFamily: "Space Grotesk",
                fontWeight: "700",
                fontSize: "15px",
                cursor: reviewing ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {reviewing ? "Analyzing code..." : "Review Code →"}
            </button>
          </div>

          {/* Right — Results */}
          {result && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              {/* Overall Score */}
              <div style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                <div style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "64px",
                  fontWeight: "700",
                  color: result.overallScore >= 80 ? "var(--success)" : result.overallScore >= 60 ? "var(--accent)" : "var(--critical)",
                  lineHeight: "1"
                }}>
                  {result.overallScore}
                </div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
                  Overall Score
                </div>
                <ScoreBar label="Readability" value={result.readability} />
                <ScoreBar label="Performance" value={result.performance} />
                <ScoreBar label="Security" value={result.security} />
                <ScoreBar label="Maintainability" value={result.maintainability} />

                {/* Complexity */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
                  {[
                    { label: "Time", value: result.timeComplexity },
                    { label: "Space", value: result.spaceComplexity }
                  ].map((c) => (
                    <div key={c.label} style={{
                      background: "var(--bg-tertiary)",
                      borderRadius: "8px",
                      padding: "12px",
                      textAlign: "center"
                    }}>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: "16px", color: "var(--accent)", fontWeight: "500" }}>
                        {c.value}
                      </div>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "4px" }}>
                        {c.label} Complexity
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                {["issues", "refactoring", "summary"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: activeTab === tab ? "var(--accent)" : "var(--bg-secondary)",
                      color: activeTab === tab ? "#0F0F0F" : "var(--text-secondary)",
                      border: `1px solid ${activeTab === tab ? "var(--accent)" : "var(--border)"}`,
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontFamily: "Space Grotesk",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {tab} {tab === "issues" && `(${result.issues?.length || 0})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {activeTab === "issues" && result.issues?.map((issue: any, i: number) => (
                  <div key={i} style={{
                    background: "var(--bg-secondary)",
                    border: `1px solid ${SEVERITY_COLORS[issue.severity]}33`,
                    borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity]}`,
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "12px",
                    animation: `fadeIn 0.3s ease ${i * 0.05}s both`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: "10px",
                        color: SEVERITY_COLORS[issue.severity],
                        textTransform: "uppercase",
                        letterSpacing: "1px"
                      }}>
                        {issue.severity} · {issue.category}
                      </span>
                      {issue.line && (
                        <span style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "var(--text-secondary)" }}>
                          line {issue.line}
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontFamily: "Space Grotesk", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
                      {issue.title}
                    </h4>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5", marginBottom: "8px" }}>
                      {issue.description}
                    </p>
                    {issue.suggestion && (
                      <p style={{ color: "var(--success)", fontSize: "12px", fontFamily: "JetBrains Mono" }}>
                        → {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))}

                {activeTab === "refactoring" && result.refactoring?.map((r: any, i: number) => (
                  <div key={i} style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "12px"
                  }}>
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "var(--critical)", marginBottom: "6px", textTransform: "uppercase" }}>Before</div>
                      <pre style={{ background: "var(--bg-tertiary)", padding: "10px", borderRadius: "6px", fontSize: "12px", overflowX: "auto", color: "var(--text-primary)" }}>
                        {r.before}
                      </pre>
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "var(--success)", marginBottom: "6px", textTransform: "uppercase" }}>After</div>
                      <pre style={{ background: "var(--bg-tertiary)", padding: "10px", borderRadius: "6px", fontSize: "12px", overflowX: "auto", color: "var(--text-primary)" }}>
                        {r.after}
                      </pre>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontFamily: "Inter" }}>
                      {r.explanation}
                    </p>
                  </div>
                ))}

                {activeTab === "summary" && (
                  <div style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "20px"
                  }}>
                    <p style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.8", fontFamily: "Inter" }}>
                      {result.summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}