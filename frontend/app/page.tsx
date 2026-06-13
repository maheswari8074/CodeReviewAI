"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [typedText, setTypedText] = useState("");
  const fullText = "Your code, reviewed by AI in seconds.";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/github";
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        <button onClick={handleLogin} style={{
          background: "var(--accent)",
          color: "#0F0F0F",
          border: "none",
          padding: "10px 24px",
          borderRadius: "8px",
          fontFamily: "Space Grotesk",
          fontWeight: "600",
          fontSize: "14px",
          cursor: "pointer",
        }}>
          Login with GitHub
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "120px 48px 80px",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-block",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          borderRadius: "100px",
          padding: "6px 16px",
          marginBottom: "32px",
          fontFamily: "JetBrains Mono",
          fontSize: "12px",
          color: "var(--accent)"
        }}>
          ✦ AI-Powered · Instant · Free
        </div>

        <h1 style={{
          fontFamily: "Space Grotesk",
          fontSize: "clamp(40px, 6vw, 72px)",
          fontWeight: "700",
          lineHeight: "1.1",
          marginBottom: "24px",
          letterSpacing: "-2px"
        }}>
          Stop guessing.<br />
          <span style={{ color: "var(--accent)" }}>Start knowing.</span>
        </h1>

        <p style={{
          fontFamily: "JetBrains Mono",
          fontSize: "16px",
          color: "var(--text-secondary)",
          marginBottom: "48px",
          minHeight: "24px"
        }}>
          {typedText}<span style={{ color: "var(--accent)", animation: "blink 1s infinite" }}>|</span>
        </p>

        <button onClick={handleLogin} style={{
          background: "var(--accent)",
          color: "#0F0F0F",
          border: "none",
          padding: "16px 40px",
          borderRadius: "10px",
          fontFamily: "Space Grotesk",
          fontWeight: "700",
          fontSize: "16px",
          cursor: "pointer",
          marginRight: "16px"
        }}>
          Start Reviewing Code →
        </button>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "0 48px 120px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px"
      }}>
        {[
          { icon: "⚠", label: "Critical", title: "Bug Detection", desc: "Catches logic errors, null references, out-of-bounds access and common pitfalls before they hit production." },
          { icon: "◎", label: "Analysis", title: "Complexity Analysis", desc: "Automatically computes Time and Space complexity in Big O notation for every function you submit." },
          { icon: "↗", label: "Refactor", title: "Refactoring Suggestions", desc: "See before/after code examples with clear explanations of why the new version is better." },
          { icon: "◈", label: "Score", title: "Quality Score", desc: "Get scored on Readability, Performance, Security and Maintainability — all in one dashboard." },
        ].map((f) => (
          <div key={f.title} style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "28px",
            transition: "border-color 0.2s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ color: "var(--accent)", fontSize: "20px" }}>{f.icon}</span>
              <span style={{
                fontFamily: "JetBrains Mono",
                fontSize: "11px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>{f.label}</span>
            </div>
            <h3 style={{ fontFamily: "Space Grotesk", fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
              {f.title}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px 48px",
        textAlign: "center",
        color: "var(--text-secondary)",
        fontFamily: "JetBrains Mono",
        fontSize: "12px"
      }}>
        CodeReviewAI © 2025 — Built with Next.js + Groq
      </footer>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </main>
  );
}