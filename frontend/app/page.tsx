"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
const DEMO_CODE = `def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(len(arr)):
            if i != j and arr[i] == arr[j]:
                if arr[i] not in duplicates:
                    duplicates.append(arr[i])
    return duplicates`;

const DEMO_ISSUES = [
  {
    severity: "critical",
    title: "O(n²) time complexity",
    desc: "Nested loops cause quadratic performance on large inputs.",
  },
  {
    severity: "warning",
    title: "Redundant membership check",
    desc: "'not in duplicates' is O(n), making this O(n³) worst case.",
  },
  {
    severity: "suggestion",
    title: "Use a set for O(n) solution",
    desc: "Track seen elements with a hash set for linear time.",
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#E05252",
  warning: "#E8A020",
  suggestion: "#5299E0",
};

export default function Home() {
  const router = useRouter();
  const [typedCode, setTypedCode] = useState("");
  const [showIssues, setShowIssues] = useState(false);
  const [visibleIssues, setVisibleIssues] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const { user } = useAuth();
  useEffect(() => {
    // Type the demo code
    let i = 0;
    const typeTimer = setInterval(() => {
      if (i < DEMO_CODE.length) {
        setTypedCode(DEMO_CODE.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeTimer);
        // Start scanning after typing
        setTimeout(() => {
          setScanning(true);
          setTimeout(() => {
            setScanning(false);
            setShowIssues(true);
            setScore(62);
            // Show issues one by one
            let issueCount = 0;
            const issueTimer = setInterval(() => {
              issueCount++;
              setVisibleIssues(issueCount);
              if (issueCount >= DEMO_ISSUES.length) clearInterval(issueTimer);
            }, 400);
          }, 2000);
        }, 500);
      }
    }, 18);
    return () => clearInterval(typeTimer);
  }, []);

  const handleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`;
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div className="dot-grid" />
      <div className="hero-bg" />
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
          onClick={() => router.push("/")}
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
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="#features"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontFamily: "Inter",
              fontSize: "14px",
            }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontFamily: "Inter",
              fontSize: "14px",
            }}
          >
            How it works
          </a>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={user.avatar}
                alt={user.username}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                }}
              />
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  background: "var(--accent)",
                  color: "#0F0F0F",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontFamily: "Space Grotesk",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              style={{
                background: "var(--accent)",
                color: "#0F0F0F",
                border: "none",
                padding: "10px 24px",
                borderRadius: "8px",
                fontFamily: "Space Grotesk",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Login with GitHub
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 48px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "64px",
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "inline-block",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "24px",
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              color: "var(--accent)",
            }}
          >
            ✦ Powered by Llama 3.3 70B
          </div>

          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "clamp(36px, 4vw, 56px)",
              fontWeight: "700",
              lineHeight: "1.1",
              marginBottom: "20px",
              letterSpacing: "-2px",
            }}
          >
            Your personal
            <br />
            <span style={{ color: "var(--accent)" }}>senior engineer</span>
            <br />
            on demand.
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "16px",
              lineHeight: "1.7",
              marginBottom: "36px",
              fontFamily: "Inter",
            }}
          >
            Paste any code and get instant feedback on bugs, complexity,
            security, and style — the kind of review it takes weeks to get from
            a real team.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={user ? () => router.push("/dashboard") : handleLogin}
              style={{
                background: "var(--accent)",
                color: "#0F0F0F",
                border: "none",
                padding: "14px 32px",
                borderRadius: "10px",
                fontFamily: "Space Grotesk",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              {user ? "Go to Dashboard →" : "Start for free →"}
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("demo")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                background: "transparent",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                padding: "14px 32px",
                borderRadius: "10px",
                fontFamily: "Space Grotesk",
                fontWeight: "600",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              See demo ↓
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "32px", marginTop: "48px" }}>
            {[
              { value: "~3s", label: "Avg review time" },
              { value: "5+", label: "Languages" },
              { value: "100%", label: "Free to use" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: "Space Grotesk",
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "var(--accent)",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Live Demo */}
        <div
          id="demo"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 0 60px rgba(232, 160, 32, 0.05)",
          }}
        >
          {/* Editor header */}
          <div
            style={{
              background: "var(--bg-tertiary)",
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#E05252",
              }}
            />
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#E8A020",
              }}
            />
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#52A878",
              }}
            />
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginLeft: "8px",
              }}
            >
              find_duplicates.py
            </span>
            {scanning && (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "JetBrains Mono",
                  fontSize: "10px",
                  color: "var(--accent)",
                  animation: "pulse 1s infinite",
                }}
              >
                ● analyzing...
              </span>
            )}
          </div>

          {/* Code */}
          <pre
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              lineHeight: "1.7",
              padding: "16px",
              color: "var(--text-primary)",
              margin: 0,
              minHeight: "180px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {typedCode}
            <span
              style={{ color: "var(--accent)", animation: "blink 1s infinite" }}
            >
              |
            </span>
          </pre>

          {/* Score */}
          {score && (
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                animation: "fadeIn 0.4s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}
              >
                Overall Score
              </span>
              <span
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "var(--accent)",
                }}
              >
                {score}/100
              </span>
              <div
                style={{
                  flex: 1,
                  height: "4px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "2px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${score}%`,
                    background: "var(--accent)",
                    borderRadius: "2px",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Issues */}
          <div style={{ padding: "12px 16px" }}>
            {showIssues &&
              DEMO_ISSUES.slice(0, visibleIssues).map((issue, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity]}`,
                    paddingLeft: "10px",
                    marginBottom: "10px",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: "10px",
                      color: SEVERITY_COLORS[issue.severity],
                      textTransform: "uppercase",
                      marginBottom: "2px",
                    }}
                  >
                    {issue.severity}
                  </div>
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "2px",
                    }}
                  >
                    {issue.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {issue.desc}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "80px 48px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}
          >
            What you get
          </p>
          <h2
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "36px",
              fontWeight: "700",
              letterSpacing: "-1px",
            }}
          >
            Everything a senior engineer would catch
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              icon: "⚠",
              label: "Critical",
              title: "Bug Detection",
              desc: "Catches logic errors, null references, out-of-bounds access and security vulnerabilities before they hit production.",
            },
            {
              icon: "◎",
              label: "Analysis",
              title: "Complexity Analysis",
              desc: "Automatically computes Time and Space complexity in Big O notation for every function you submit.",
            },
            {
              icon: "↗",
              label: "Refactor",
              title: "Refactoring Suggestions",
              desc: "See before/after code examples with clear explanations of why the new version is better.",
            },
            {
              icon: "◈",
              label: "Score",
              title: "Quality Score",
              desc: "Get scored on Readability, Performance, Security and Maintainability — all in one dashboard.",
            },
            {
              icon: "◷",
              label: "History",
              title: "Progress Tracking",
              desc: "Track how your code quality improves over time across all your past reviews.",
            },
            {
              icon: "⬡",
              label: "Export",
              title: "PDF Reports",
              desc: "Download a complete formatted report with all issues, scores, and suggestions.",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "28px",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ color: "var(--accent)", fontSize: "20px" }}>
                  {f.icon}
                </span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {f.label}
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "10px",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "80px 48px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "36px",
              fontWeight: "700",
              letterSpacing: "-1px",
            }}
          >
            Three steps to better code
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "32px",
          }}
        >
          {[
            {
              step: "01",
              title: "Login with GitHub",
              desc: "One click authentication. No passwords, no forms. Your GitHub account is all you need.",
            },
            {
              step: "02",
              title: "Paste your code",
              desc: "Use the built-in VS Code editor. Select your language and give your file a name.",
            },
            {
              step: "03",
              title: "Get your review",
              desc: "AI analyzes your code in seconds. View issues, scores, refactoring suggestions, and export a PDF.",
            },
          ].map((s) => (
            <div
              key={s.step}
              style={{ textAlign: "center", padding: "32px 24px" }}
            >
              <div
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "48px",
                  fontWeight: "700",
                  color: "var(--accent)",
                  opacity: 0.3,
                  marginBottom: "16px",
                  letterSpacing: "-2px",
                }}
              >
                {s.step}
              </div>
              <h3
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  fontFamily: "Inter",
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          borderTop: "1px solid var(--border)",
          padding: "80px 48px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "Space Grotesk",
            fontSize: "40px",
            fontWeight: "700",
            letterSpacing: "-1px",
            marginBottom: "16px",
          }}
        >
          Ready to write better code?
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "16px",
            marginBottom: "32px",
            fontFamily: "Inter",
          }}
        >
          Free to use. No credit card required.
        </p>
        <button
          onClick={handleLogin}
          style={{
            background: "var(--accent)",
            color: "#0F0F0F",
            border: "none",
            padding: "16px 48px",
            borderRadius: "10px",
            fontFamily: "Space Grotesk",
            fontWeight: "700",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Get started with GitHub →
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "var(--text-secondary)",
          fontFamily: "JetBrains Mono",
          fontSize: "12px",
        }}
      >
        <span>CodeReviewAI © 2026</span>
        <span>
          Built by{" "}
          <a
            href="https://github.com/maheswari8074"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            maheswari8074
          </a>
        </span>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
