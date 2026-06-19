"use client";

import jsPDF from "jspdf";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import ChatPanel from "../../components/ChatPanel";
import ReviewReport from "../../components/ReviewReport";
import { LoadingCard, PageHeader, StateCard } from "../../components/UI";
import { apiFetch } from "../../lib/api";
import { RepoReview } from "../../types";
import styles from "./repo-detail.module.css";

export default function RepoReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const [review, setReview] = useState<RepoReview | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setReview(await apiFetch<RepoReview>(`/api/repo-reviews/${params.id}`));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load this repository review.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    // Load when route id changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (review?.status !== "processing") return;
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [load, review?.status]);

  const exportPdf = () => {
    if (!review) return;
    const pdf = new jsPDF();
    let y = 18;

    const line = (text: string, size = 10) => {
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, 175) as string[];
      if (y + lines.length * 5 > 282) { pdf.addPage(); y = 18; }
      pdf.text(lines, 18, y);
      y += lines.length * 5 + 3;
    };

    line("CodeReviewAI — Repository Report", 18);
    line(`Repository: ${review.repoName}`, 13);
    line(`Files sampled: ${review.filesReviewed ?? 0}  ·  Total issues: ${review.totalIssues ?? 0}  ·  Avg score: ${review.avgScore ?? 0}/100`);
    y += 4;

    review.files?.forEach((file, fi) => {
      if (!file.result) return;
      line(`${fi + 1}. ${file.path}  (score: ${file.result.overallScore ?? 0}/100)`, 12);
      if (file.result.summary) line(file.result.summary);
      file.result.issues?.forEach((issue, ii) => {
        line(`  ${ii + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`, 10);
        if (issue.description) line(`     ${issue.description}`);
        if (issue.suggestion)  line(`     Fix: ${issue.suggestion}`);
      });
      y += 3;
    });

    pdf.save(`${review.repoName.replace("/", "-")}-report.pdf`);
  };

  const file = review?.files?.[selected];

  return (
    <AppShell>
      {loading ? (
        <LoadingCard label="Loading repository report" />
      ) : error || !review ? (
        <StateCard tone="error" title="Report unavailable" description={error || "This repository report could not be found."} action={{ label: "New repository review", href: "/repo-review" }} />
      ) : review.status === "processing" ? (
        <LoadingCard label="Analyzing repository files (usually 30–60 seconds)" />
      ) : review.status === "failed" ? (
        <StateCard tone="error" title="Repository review failed" description={review.error || "The repository could not be analyzed."} action={{ label: "Try another repository", href: "/repo-review" }} />
      ) : (
        <>
          <PageHeader
            eyebrow="Repository report"
            title={review.repoName}
            description={`Sampled ${review.filesReviewed ?? 0} files · ${review.totalIssues ?? 0} issues · Avg score ${review.avgScore ?? 0}/100`}
            action={
              <div className="app-page-action-row">
                <Link className="app-button" href="/repo-review">New review</Link>
                <button className="app-button primary" onClick={exportPdf}>Export PDF</button>
              </div>
            }
          />

          <div className="app-notice app-notice-mb">
            <strong>Scope:</strong>
            <span>This report covers up to eight selected source files and is not a complete audit of the repository.</span>
          </div>

          <div className={styles.layout}>
            <aside className={styles.files}>
              <h2>Reviewed files</h2>
              {review.files?.map((item, index) => (
                <button
                  key={item.path}
                  className={selected === index ? styles.active : ""}
                  onClick={() => setSelected(index)}
                >
                  <span>{item.path}</span>
                  <strong>{item.result?.overallScore ?? "—"}</strong>
                </button>
              ))}
            </aside>

            <div className={styles.report}>
              {file?.result ? (
                <>
                  <h2>{file.path}</h2>
                  <ReviewReport result={file.result} />
                </>
              ) : (
                <StateCard title="No file selected" description="Choose a reviewed file from the list to inspect its findings." />
              )}
            </div>
          </div>

          <ChatPanel repoReviewId={review._id} title="Ask about this repository" />
        </>
      )}
    </AppShell>
  );
}
