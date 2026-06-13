"use client";
import { useRouter } from "next/navigation";

export default function AuthError() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "16px"
    }}>
      <span style={{ fontSize: "48px" }}>⚠</span>
      <h2 style={{
        fontFamily: "Space Grotesk",
        fontSize: "24px",
        color: "var(--critical)"
      }}>
        Authentication Failed
      </h2>
      <p style={{
        fontFamily: "Inter",
        color: "var(--text-secondary)",
        fontSize: "14px"
      }}>
        Something went wrong during GitHub login.
      </p>
      <button onClick={() => router.push("/")} style={{
        background: "var(--accent)",
        color: "#0F0F0F",
        border: "none",
        padding: "12px 28px",
        borderRadius: "8px",
        fontFamily: "Space Grotesk",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "8px"
      }}>
        Back to Home
      </button>
    </div>
  );
}