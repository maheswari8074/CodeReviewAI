"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import ChatPanel from "../components/ChatPanel";

export default function ChatPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.push("/dashboard")}
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
            ← Dashboard
          </button>
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

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "48px",
        }}
      >
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
            AI Assistant
          </p>
          <h1
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "32px",
              fontWeight: "700",
              letterSpacing: "-1px",
              marginBottom: "8px",
            }}
          >
            Chat with CodeReviewAI
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Ask coding questions, get explanations, or discuss best practices.
          </p>
        </div>

        <ChatPanel floating={false} title="CodeReviewAI Chat" />
      </div>
    </main>
  );
}
