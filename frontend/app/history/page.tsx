"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/reviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setReviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    if (user) fetchReviews();
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--accent)";
    return "var(--critical)";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          <button onClick={() => router.push("/review")} style={{
            background: "var(--accent)",
            color: "#0F0F0F",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            fontFamily: "Space Grotesk",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer"
          }}>
            New Review
          </button>
          {user?.avatar && (
            <img src={user.avatar} alt={user.username}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid var(--border)" }}
            />
          )}
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px" }}>
        <div style={{ marginBottom: "40px" }}>
          <p style={{
            fontFamily: "JetBrains Mono",
            fontSize: "12px",
            color: "var(--accent)",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            Your Progress
          </p>
          <h1 style={{
            fontFamily: "Space Grotesk",
            fontSize: "32px",
            fontWeight: "700",
            letterSpacing: "-1px"
          }}>
            Review History
          </h1>
        </div>

        {fetching ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
            <div style={{
              width: "40px", height: "40px",
              border: "2px solid var(--border)",
              borderTop: "2px solid var(--accent)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
          </div>
        ) : reviews.length === 0 ? (
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "80px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>◫</div>
            <h3 style={{ fontFamily: "Space Grotesk", fontSize: "20px", marginBottom: "8px" }}>
              No reviews yet
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Submit your first code review to start tracking your progress.
            </p>
            <button onClick={() => router.push("/review")} style={{
              background: "var(--accent)",
              color: "#0F0F0F",
              border: "none",
              padding: "12px 28px",
              borderRadius: "8px",
              fontFamily: "Space Grotesk",
              fontWeight: "600",
              cursor: "pointer"
            }}>
              Start First Review
            </button>
          </div>
        ) : (
          <div>
            {/* Stats Summary */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              marginBottom: "32px"
            }}>
              {[
                { label: "Total Reviews", value: reviews.length },
                {
                  label: "Avg Score",
                  value: Math.round(reviews.filter(r => r.result?.overallScore).reduce((acc, r) => acc + r.result.overallScore, 0) / reviews.filter(r => r.result?.overallScore).length) || "—"
                },
                {
                  label: "Latest Score",
                  value: reviews[0]?.result?.overallScore || "—"
                },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "20px",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontFamily: "Space Grotesk",
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "var(--accent)",
                    marginBottom: "4px"
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "1px"
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Review List */}
            {reviews.map((review, i) => (
              <div
                key={review._id}
                onClick={() => router.push(`/review/${review._id}`)}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "20px 24px",
                  marginBottom: "12px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "border-color 0.2s",
                  animation: `fadeIn 0.3s ease ${i * 0.05}s both`
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "48px", height: "48px",
                    borderRadius: "10px",
                    background: "var(--bg-tertiary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "Space Grotesk",
                    fontWeight: "700",
                    fontSize: "18px",
                    color: getScoreColor(review.result?.overallScore || 0)
                  }}>
                    {review.result?.overallScore || "?"}
                  </div>
                  <div>
                    <div style={{ fontFamily: "Space Grotesk", fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
                      {review.filename || "Untitled Code"}
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--text-secondary)" }}>
                        {review.language}
                      </span>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--text-secondary)" }}>
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    background: review.status === "completed" ? "var(--success)22" : "var(--accent)22",
                    color: review.status === "completed" ? "var(--success)" : "var(--accent)",
                  }}>
                    {review.status}
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "18px" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}