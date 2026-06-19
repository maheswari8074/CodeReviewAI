"use client";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import styles from "./ChatPanel.module.css";

type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ChatResponse = {
  messages: Message[];
  message?: string;
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
        const params = new URLSearchParams();
        if (reviewId) params.set("reviewId", reviewId);
        if (repoReviewId) params.set("repoReviewId", repoReviewId);
        const data = await apiFetch<ChatResponse>(`/api/chat?${params.toString()}`);
        setMessages(data.messages || []);
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
      const data = await apiFetch<ChatResponse>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage, reviewId, repoReviewId }),
      });
      setMessages(data.messages || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to send message.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const panelClass = `${styles.panel} ${floating ? styles.panelFloating : ""}`;

  const panel = (
    <div className={panelClass}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <strong>{title}</strong>
          <span>{reviewId || repoReviewId ? "Context-aware" : "General coding help"}</span>
        </div>
        {floating && (
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close chat">
            ×
          </button>
        )}
      </div>

      <div className={styles.messages}>
        {loading ? (
          <p className={styles.loadingText}>Loading chat…</p>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💬</div>
            <p>
              {reviewId || repoReviewId
                ? "Ask about issues, fixes, or improvements for this review."
                : "Ask anything about code quality, bugs, or best practices."}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}`}
            >
              <div className={styles.bubbleInner}>{msg.content}</div>
            </div>
          ))
        )}
        {sending && (
          <div className={styles.thinking}>
            <div className={styles.thinkingInner}>Thinking…</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        {error && <p className={styles.inputError}>{error}</p>}
        <div className={styles.inputRow}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            rows={1}
            aria-label="Chat message"
          />
          <button
            className={styles.sendBtn}
            onClick={() => void sendMessage()}
            disabled={sending || !input.trim()}
            aria-label="Send message"
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
      {open && <div className={styles.floatingWrap}>{panel}</div>}
      {!open && (
        <button
          className={styles.floatingToggle}
          onClick={() => setOpen(true)}
          aria-label="Open AI Chat"
        >
          💬
        </button>
      )}
    </>
  );
}
