"use client";
import { useState, useEffect, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ChatPanelProps = {
  reviewId?: string;
  repoReviewId?: string;
  floating?: boolean;
  title?: string;
};

export default function ChatPanel({
  reviewId,
  repoReviewId,
  floating = true,
  title = "AI Assistant",
}: ChatPanelProps) {
  const [open, setOpen] = useState(!floating);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (reviewId) params.set("reviewId", reviewId);
        if (repoReviewId) params.set("repoReviewId", repoReviewId);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chat?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (res.ok) setMessages(data.messages || []);
      } catch {
        setError("Failed to load chat history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [reviewId, repoReviewId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setError("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          reviewId,
          repoReviewId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.message || "Failed to send message.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const panel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: floating ? "16px" : "12px",
        overflow: "hidden",
        height: floating ? "480px" : "100%",
        minHeight: floating ? undefined : "520px",
        boxShadow: floating ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-primary)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "10px",
              color: "var(--text-secondary)",
              marginTop: "2px",
            }}
          >
            {reviewId || repoReviewId ? "Context-aware" : "General coding help"}
          </div>
        </div>
        {floating && (
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "18px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {loading ? (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            Loading chat...
          </p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "40px", padding: "0 16px" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>💬</div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              {reviewId || repoReviewId
                ? "Ask about issues, fixes, or improvements for this review."
                : "Ask anything about code quality, bugs, or best practices."}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  background:
                    msg.role === "user"
                      ? "var(--accent)"
                      : "var(--bg-tertiary)",
                  color:
                    msg.role === "user" ? "#0F0F0F" : "var(--text-primary)",
                  padding: "10px 14px",
                  borderRadius:
                    msg.role === "user"
                      ? "12px 12px 4px 12px"
                      : "12px 12px 12px 4px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div style={{ alignSelf: "flex-start" }}>
            <div
              style={{
                background: "var(--bg-tertiary)",
                padding: "10px 14px",
                borderRadius: "12px 12px 12px 4px",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-primary)",
        }}
      >
        {error && (
          <p
            style={{
              color: "var(--critical)",
              fontSize: "12px",
              marginBottom: "8px",
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            style={{
              flex: 1,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "var(--text-primary)",
              fontFamily: "Inter",
              fontSize: "13px",
              resize: "none",
              outline: "none",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            style={{
              background: sending || !input.trim() ? "var(--bg-tertiary)" : "var(--accent)",
              color: sending || !input.trim() ? "var(--text-secondary)" : "#0F0F0F",
              border: "none",
              borderRadius: "8px",
              padding: "0 16px",
              fontFamily: "Space Grotesk",
              fontSize: "13px",
              fontWeight: "600",
              cursor: sending || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  if (!floating) return panel;

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "380px",
            zIndex: 1000,
          }}
        >
          {panel}
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#0F0F0F",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(232, 160, 32, 0.3)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Open AI Chat"
        >
          💬
        </button>
      )}
    </>
  );
}
