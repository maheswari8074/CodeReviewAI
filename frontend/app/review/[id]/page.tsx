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
import { Review } from "../../types";

export default function ReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setReview(await apiFetch<Review>(`/api/reviews/${params.id}`)); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load this review."); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => {
    // Load the record when the route identifier changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (!review || !["pending", "processing"].includes(review.status)) return;
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [load, review]);

  const exportPdf = () => {
    if (!review?.result) return;
    const pdf = new jsPDF(); let y = 18;
    const line = (text: string, size = 10) => { pdf.setFontSize(size); const lines = pdf.splitTextToSize(text, 175) as string[]; if (y + lines.length * 5 > 282) { pdf.addPage(); y = 18; } pdf.text(lines, 18, y); y += lines.length * 5 + 3; };
    line("CodeReviewAI", 18); line(`Review report · ${review.filename || "Untitled code"}`, 13); line(`Language: ${review.language}  |  Score: ${review.result.overallScore ?? 0}/100`); line(review.result.summary || "No summary.");
    review.result.issues?.forEach((issue, index) => { line(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`, 11); if (issue.description) line(issue.description); if (issue.suggestion) line(`Suggested fix: ${issue.suggestion}`); });
    pdf.save(`${review.filename || "code-review"}-report.pdf`);
  };

  return <AppShell>
    {loading ? <LoadingCard label="Loading review report" /> : error || !review ? <StateCard tone="error" title="Review unavailable" description={error || "This review could not be found."} action={{ label: "Return to history", href: "/history" }} /> : review.status === "failed" ? <StateCard tone="error" title="Review failed" description={review.error || "The analysis could not be completed."} action={{ label: "Try a new review", href: "/review" }} /> : !review.result ? <LoadingCard label="Analysis in progress" /> : <><PageHeader eyebrow="Code review report" title={review.filename || "Untitled code"} description={`${review.language} · ${new Date(review.createdAt).toLocaleString()}`} action={<div className="app-page-action-row"><Link className="app-button" href="/review">New review</Link><button className="app-button primary" onClick={exportPdf}>Export PDF</button></div>} /><ReviewReport result={review.result} /><ChatPanel reviewId={review._id} title="Ask about this review" /></>}
  </AppShell>;
}
