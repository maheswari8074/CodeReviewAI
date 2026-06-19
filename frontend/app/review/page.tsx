"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { PageHeader } from "../components/UI";
import { useJobPolling } from "../hooks/useJobPolling";
import { apiFetch } from "../lib/api";
import { Review, ReviewResult } from "../types";
import styles from "./review.module.css";

const languages = ["auto", "javascript", "typescript", "python", "java", "c++", "go", "rust"];
type Tab = "issues" | "refactoring" | "summary";

function ScoreBar({ label, value = 0 }: { label: string; value?: number }) {
  return <div className={styles.scoreBar}><div><span>{label}</span><strong>{value}/100</strong></div><span className={styles.scoreBarTrack}><span style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} /></span></div>;
}

export default function ReviewPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [filename, setFilename] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("issues");
  const { polling, error: pollingError, startPolling } = useJobPolling({
    statusUrl: (id) => `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${id}/status`,
    onComplete: async (data) => {
      try { const review = await apiFetch<Review>(`/api/reviews/${String(data.reviewId)}`); setResult(review.result || null); setTab("issues"); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load the completed review."); }
      finally { setReviewing(false); }
    },
    onFailed: () => setReviewing(false),
  });

  useEffect(() => {
    const draft = sessionStorage.getItem("reviewDraft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft) as { code?: string; filename?: string; language?: string };
      setCode(parsed.code || ""); setFilename(parsed.filename || ""); setLanguage(languages.includes(parsed.language || "") ? parsed.language || "auto" : "auto");
    } finally { sessionStorage.removeItem("reviewDraft"); }
  }, []);

  const submit = async () => {
    if (!code.trim()) { setError("Paste or type some code before starting a review."); return; }
    setError(""); setReviewing(true); setResult(null);
    try {
      const data = await apiFetch<{ reviewId: string; status: string; result?: ReviewResult }>("/api/reviews", { method: "POST", body: JSON.stringify({ code, language, filename: filename.trim() }) });
      if (data.result) { setResult(data.result); setReviewing(false); setTab("issues"); }
      else startPolling(data.reviewId);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not start the review."); setReviewing(false); }
  };

  const busy = reviewing || polling;
  const editorLanguage = language === "auto" ? "javascript" : language === "c++" ? "cpp" : language;

  return <AppShell>
    <PageHeader eyebrow="Code review" title="Inspect a code snippet" description="Paste code, choose a language or use auto-detection, then review the findings and suggested improvements." />
    <div className={`${styles.workspace} ${result ? styles.withResult : ""}`}>
      <section className={styles.editorCard}>
        <div className={styles.controls}>
          <label><span>Filename <small>optional</small></span><input value={filename} onChange={(event) => setFilename(event.target.value)} placeholder="solution.py" disabled={busy} /></label>
          <label><span>Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={busy}>{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className={styles.editor} aria-label="Code editor"><Editor height="430px" language={editorLanguage} value={code} onChange={(value) => setCode(value || "")} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 21, padding: { top: 16 }, scrollBeyondLastLine: false, wordWrap: "on", readOnly: busy, automaticLayout: true }} /></div>
        <div className={styles.editorFooter}><span>{code.length.toLocaleString()} characters</span><button className="app-button primary" onClick={() => void submit()} disabled={busy || !code.trim()}>{busy ? "Analyzing code…" : "Review code"}</button></div>
        <div className="app-notice"><strong>Privacy:</strong><span>Submitted code is processed and stored with your review history. Remove secrets, tokens, and personal data before submitting.</span></div>
        {(error || pollingError) && <p className={styles.error} role="alert">{error || pollingError}</p>}
      </section>

      {result && <section className={styles.results} aria-label="Review results">
        <div className={styles.scoreCard}><div className={styles.overall}><span>Overall score</span><strong>{result.overallScore ?? 0}</strong><small>/100</small></div><div><ScoreBar label="Readability" value={result.readability} /><ScoreBar label="Performance" value={result.performance} /><ScoreBar label="Security" value={result.security} /><ScoreBar label="Maintainability" value={result.maintainability} /></div></div>
        <div className={styles.complexity}><div><span>Time complexity</span><strong>{result.timeComplexity || "Not determined"}</strong></div><div><span>Space complexity</span><strong>{result.spaceComplexity || "Not determined"}</strong></div></div>
        <div className={styles.tabs} role="tablist" aria-label="Review result sections">{(["issues", "refactoring", "summary"] as Tab[]).map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? styles.active : ""} onClick={() => setTab(item)}>{item}{item === "issues" ? ` (${result.issues?.length || 0})` : ""}</button>)}</div>
        <div className={styles.tabPanel} role="tabpanel">
          {tab === "issues" && (result.issues?.length ? <div className={styles.issueList}>{result.issues.map((issue, index) => <article className={`${styles.issue} ${styles[issue.severity]}`} key={`${issue.title}-${index}`}><div><span>{issue.severity}</span>{issue.line && <small>Line {issue.line}</small>}</div><h3>{issue.title}</h3>{issue.description && <p>{issue.description}</p>}{issue.suggestion && <aside><strong>Suggested fix</strong>{issue.suggestion}</aside>}</article>)}</div> : <p className={styles.noData}>No issues were identified in this review.</p>)}
          {tab === "refactoring" && (result.refactoring?.length ? <div className={styles.refactors}>{result.refactoring.map((item, index) => <article key={index}><div className={styles.codeCompare}><div><span>Before</span><pre>{item.before}</pre></div><div><span>After</span><pre>{item.after}</pre></div></div>{item.explanation && <p>{item.explanation}</p>}</article>)}</div> : <p className={styles.noData}>No refactoring examples were returned.</p>)}
          {tab === "summary" && <div className={styles.summary}>{result.summary || "No summary was returned."}</div>}
        </div>
      </section>}
    </div>
  </AppShell>;
}
