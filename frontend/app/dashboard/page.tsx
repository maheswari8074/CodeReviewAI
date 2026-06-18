"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import DashboardCharts from "../components/DashboardCharts";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src={user?.avatar}
            alt={user?.username}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "2px solid var(--border)",
            }}
          />
          <span
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            {user?.username}
          </span>
          <button
            onClick={logout}
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
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 48px" }}
      >
        {/* Welcome */}
        <div style={{ marginBottom: "48px" }}>
          <p
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              color: "var(--accent)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Welcome back
          </p>
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "36px",
              fontWeight: "700",
              letterSpacing: "-1px",
            }}
          >
            {user?.name || user?.username}
          </h1>
        </div>

        {/* Action Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "48px",
          }}
        >
          <div
            onClick={() => router.push("/review")}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "32px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⌥</div>
            <h3
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              New Review
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Paste your code and get instant AI-powered feedback on bugs,
              performance, and security.
            </p>
          </div>

          <div
            onClick={() => router.push("/history")}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "32px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>◫</div>
            <h3
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Review History
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Track your code quality improvement over time across all past
              reviews.
            </p>
          </div>

          <div
            onClick={() => router.push("/repo-review")}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "32px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⬡</div>
            <h3
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Repo Review
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Paste a GitHub repo URL and get an aggregated AI review of key
              files across the project.
            </p>
          </div>

          <div
            onClick={() => router.push("/chat")}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "32px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>💬</div>
            <h3
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              AI Chat
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Ask coding questions, get explanations, and discuss best practices
              with your AI assistant.
            </p>
          </div>
        </div>

        {/* Analytics */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ marginBottom: "24px" }}>
            <p
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
                color: "var(--accent)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Analytics
            </p>
            <h2
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "24px",
                fontWeight: "700",
                letterSpacing: "-0.5px",
              }}
            >
              Your Review Insights
            </h2>
          </div>
          <DashboardCharts />
        </div>
      </div>
    </main>
  );
}
