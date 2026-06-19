"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppIcon from "../components/AppIcon";
import AppShell from "../components/AppShell";
import { PageHeader } from "../components/UI";
import { useJobPolling } from "../hooks/useJobPolling";
import { apiFetch } from "../lib/api";
import styles from "./repo-review.module.css";

const steps = ["Reading the repository tree", "Selecting reviewable source files", "Analyzing code quality and risks", "Preparing the repository report"];

export default function RepoReviewPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const { polling, startPolling } = useJobPolling({
    statusUrl: (id) => `${process.env.NEXT_PUBLIC_API_URL}/api/repo-reviews/${id}/status`,
    onComplete: (data) => router.push(`/repo-review/${String(data.repoReviewId)}`),
    onFailed: (data) => { setSubmitting(false); setError(data.error || "Repository review failed."); },
  });

  const busy = submitting || polling;
  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, steps.length - 1)), 8500);
    return () => window.clearInterval(timer);
  }, [busy]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    let parsed: URL;
    try { parsed = new URL(repoUrl.trim()); } catch { setError("Enter a complete GitHub repository URL."); return; }
    if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || parsed.pathname.split("/").filter(Boolean).length < 2) { setError("Use a public GitHub URL such as https://github.com/owner/repository."); return; }
    setSubmitting(true); setStep(0);
    try {
      const data = await apiFetch<{ repoReviewId: string; status: string }>("/api/repo-reviews", { method: "POST", body: JSON.stringify({ repoUrl: parsed.toString() }) });
      startPolling(data.repoReviewId);
    } catch (caught) { setSubmitting(false); setError(caught instanceof Error ? caught.message : "Could not start the repository review."); }
  };

  return <AppShell>
    <PageHeader eyebrow="Repository review" title="Review a public GitHub repository" description="Get an aggregated assessment across a focused sample of source files." />
    <div className={styles.layout}>
      <section className={styles.formCard}>
        <form onSubmit={(event) => void submit(event)}>
          <label htmlFor="repo-url">GitHub repository URL</label>
          <div className={styles.inputWrap}><AppIcon name="repo" size={18} /><input id="repo-url" type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repository" disabled={busy} autoComplete="url" aria-describedby="repo-help repo-error" /></div>
          <p id="repo-help" className={styles.help}>Only public repositories are supported. The URL is stored with your report.</p>
          {error && <p id="repo-error" className={styles.error} role="alert">{error}</p>}
          <button className="app-button primary" type="submit" disabled={busy || !repoUrl.trim()}>{busy ? "Review in progress" : "Analyze repository"}</button>
        </form>
        {busy && <div className={styles.progress} role="status" aria-live="polite"><div className={styles.progressTop}><span className="app-spinner" /><div><strong>{steps[step]}</strong><p>Repository reviews usually take 30–60 seconds.</p></div></div><div className={styles.progressBar}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><ol>{steps.map((label, index) => <li className={index <= step ? styles.done : ""} key={label}><span>{index < step ? "✓" : index + 1}</span>{label}</li>)}</ol></div>}
      </section>
      <aside className={styles.info}>
        <div><p className="app-eyebrow">What gets reviewed</p><h2>A representative sample, not every file</h2><p>CodeReviewAI selects up to eight supported source files under 30 KB, skipping generated and dependency folders.</p></div>
        <ul><li><strong>Included</strong><span>Common JavaScript, TypeScript, Python, Java, C-family, Go, Rust, web, and database files.</span></li><li><strong>Skipped</strong><span>Dependencies, build output, generated folders, and files over 30 KB.</span></li><li><strong>Privacy</strong><span>File contents are processed for analysis and saved in your review report. Do not submit repositories containing secrets.</span></li></ul>
      </aside>
    </div>
  </AppShell>;
}
