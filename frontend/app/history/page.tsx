"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppIcon from "../components/AppIcon";
import AppShell from "../components/AppShell";
import Pagination from "../components/Pagination";
import { LoadingCard, PageHeader, StateCard } from "../components/UI";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../lib/api";
import { Review, ReviewListResponse, ReviewStatus, RepoReview, RepoReviewListResponse } from "../types";
import styles from "./history.module.css";

const PAGE_SIZE = 10;
const emptyPagination = { page: 1, totalPages: 1, total: 0 };
type ActiveTab = "code" | "repo";

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Code reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetchingCode, setFetchingCode] = useState(true);
  const [codeError, setCodeError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ReviewStatus>("all");
  const [codePage, setCodePage] = useState(1);
  const [codePagination, setCodePagination] = useState(emptyPagination);
  const [summary, setSummary] = useState({ totalReviews: 0, avgScore: null as number | null, latestScore: null as number | null });
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  // Repo reviews state
  const [repoReviews, setRepoReviews] = useState<RepoReview[]>([]);
  const [fetchingRepo, setFetchingRepo] = useState(true);
  const [repoError, setRepoError] = useState("");
  const [repoQuery, setRepoQuery] = useState("");
  const [repoPage, setRepoPage] = useState(1);
  const [repoPagination, setRepoPagination] = useState(emptyPagination);
  const [deletingRepo, setDeletingRepo] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("code");

  const loadCodeReviews = useCallback(async () => {
    setFetchingCode(true);
    setCodeError("");
    try {
      const params = new URLSearchParams({ page: String(codePage), limit: String(PAGE_SIZE) });
      if (query.trim()) params.set("q", query.trim());
      if (status !== "all") params.set("status", status);
      const data = await apiFetch<ReviewListResponse>(`/api/reviews?${params}`);
      setReviews(data.data || []);
      setCodePagination(data.pagination || emptyPagination);
      if (data.summary) setSummary(data.summary);
    } catch (caught) {
      setCodeError(caught instanceof Error ? caught.message : "Could not load your code reviews.");
    } finally {
      setFetchingCode(false);
    }
  }, [codePage, query, status]);

  const loadRepoReviews = useCallback(async () => {
    setFetchingRepo(true);
    setRepoError("");
    try {
      const params = new URLSearchParams({ page: String(repoPage), limit: String(PAGE_SIZE) });
      if (repoQuery.trim()) params.set("q", repoQuery.trim());
      const data = await apiFetch<RepoReviewListResponse>(`/api/repo-reviews?${params}`);
      setRepoReviews(data.data || []);
      setRepoPagination(data.pagination || emptyPagination);
    } catch (caught) {
      setRepoError(caught instanceof Error ? caught.message : "Could not load your repository reviews.");
    } finally {
      setFetchingRepo(false);
    }
  }, [repoPage, repoQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) void loadCodeReviews();
  }, [loadCodeReviews, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) void loadRepoReviews();
  }, [loadRepoReviews, user]);

  const deleteCodeReview = async (review: Review) => {
    if (!window.confirm(`Delete "${review.filename || "this review"}"? This cannot be undone.`)) return;
    setDeletingCode(review._id);
    try {
      await apiFetch(`/api/reviews/${review._id}`, { method: "DELETE" });
      await loadCodeReviews();
    } catch (caught) {
      setCodeError(caught instanceof Error ? caught.message : "Could not delete the review.");
    } finally {
      setDeletingCode(null);
    }
  };

  const rerunReview = async (review: Review) => {
    try {
      const fullReview = await apiFetch<Review>(`/api/reviews/${review._id}`);
      sessionStorage.setItem("reviewDraft", JSON.stringify({
        code: fullReview.code,
        filename: fullReview.filename,
        language: fullReview.language,
      }));
      router.push("/review?draft=history");
    } catch (caught) {
      setCodeError(caught instanceof Error ? caught.message : "Could not prepare this review.");
    }
  };

  const deleteRepoReview = async (review: RepoReview) => {
    if (!window.confirm(`Delete "${review.repoName}"? This cannot be undone.`)) return;
    setDeletingRepo(review._id);
    try {
      await apiFetch(`/api/repo-reviews/${review._id}`, { method: "DELETE" });
      await loadRepoReviews();
    } catch (caught) {
      setRepoError(caught instanceof Error ? caught.message : "Could not delete the repository review.");
    } finally {
      setDeletingRepo(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Saved work"
        title="Review history"
        description="Find, revisit, rerun, or remove previous code and repository reviews."
        action={
          <div className={styles.headerActions}>
            <Link className="app-button" href="/repo-review">New repo review</Link>
            <Link className="app-button primary" href="/review">New code review</Link>
          </div>
        }
      />

      {/* Tab switcher */}
      <div className={styles.tabs} role="tablist" aria-label="Review type">
        <button
          role="tab"
          aria-selected={activeTab === "code"}
          className={activeTab === "code" ? styles.activeTab : ""}
          onClick={() => setActiveTab("code")}
        >
          <AppIcon name="code" size={15} /> Code reviews
          {codePagination.total > 0 && <span className={styles.tabCount}>{codePagination.total}</span>}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "repo"}
          className={activeTab === "repo" ? styles.activeTab : ""}
          onClick={() => setActiveTab("repo")}
        >
          <AppIcon name="repo" size={15} /> Repository reviews
          {repoPagination.total > 0 && <span className={styles.tabCount}>{repoPagination.total}</span>}
        </button>
      </div>

      {/* Code reviews tab */}
      {activeTab === "code" && (
        <>
          {codeError && (
            <div className={styles.error} role="alert">
              <span>{codeError}</span>
              <button onClick={() => void loadCodeReviews()}>Try again</button>
            </div>
          )}

          {fetchingCode ? (
            <LoadingCard label="Loading review history" />
          ) : reviews.length === 0 && !query && status === "all" ? (
            <StateCard
              title="No code reviews yet"
              description="Run your first code review to begin tracking scores and improvements."
              action={{ label: "Start first review", href: "/review" }}
            />
          ) : (
            <>
              <div className={styles.stats}>
                {[
                  { label: "Total reviews", value: summary.totalReviews || codePagination.total },
                  { label: "Average score", value: summary.avgScore != null ? `${summary.avgScore}/100` : "—" },
                  { label: "Latest score", value: summary.latestScore != null ? `${summary.latestScore}/100` : "—" },
                ].map((item) => (
                  <div className="app-card" key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.toolbar}>
                <label className={styles.search}>
                  <AppIcon name="search" size={17} />
                  <span className="sr-only">Search code reviews</span>
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setCodePage(1); }}
                    placeholder="Search filename or language"
                  />
                </label>
                <label className={styles.filter}>
                  <span>Status</span>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value as "all" | ReviewStatus); setCodePage(1); }}
                  >
                    <option value="all">All statuses</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
              </div>

              {reviews.length === 0 ? (
                <StateCard
                  title="No matching reviews"
                  description="Try a different filename, language, or status filter."
                />
              ) : (
                <div className={styles.list}>
                  {reviews.map((review) => (
                    <article className={styles.row} key={review._id}>
                      <button
                        className={styles.open}
                        onClick={() => router.push(`/review/${review._id}`)}
                        aria-label={`Open ${review.filename || "untitled review"}`}
                      >
                        <span className={styles.score}>{review.result?.overallScore ?? "—"}</span>
                        <span className={styles.details}>
                          <strong>{review.filename || "Untitled code"}</strong>
                          <small>{review.language} · {new Date(review.createdAt).toLocaleDateString()}</small>
                        </span>
                        <span className={`${styles.status} ${styles[review.status]}`}>{review.status}</span>
                      </button>
                      <div className={styles.actions}>
                        <button onClick={() => void rerunReview(review)}>Rerun</button>
                        <button
                          onClick={() => void deleteCodeReview(review)}
                          disabled={deletingCode === review._id}
                          aria-label={`Delete ${review.filename || "review"}`}
                        >
                          <AppIcon name="trash" size={15} />
                          {deletingCode === review._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <Pagination
                page={codePagination.page}
                totalPages={codePagination.totalPages}
                total={codePagination.total}
                onPageChange={setCodePage}
              />
            </>
          )}
        </>
      )}

      {/* Repository reviews tab */}
      {activeTab === "repo" && (
        <>
          {repoError && (
            <div className={styles.error} role="alert">
              <span>{repoError}</span>
              <button onClick={() => void loadRepoReviews()}>Try again</button>
            </div>
          )}

          {fetchingRepo ? (
            <LoadingCard label="Loading repository history" />
          ) : repoReviews.length === 0 && !repoQuery ? (
            <StateCard
              title="No repository reviews yet"
              description="Submit a public GitHub repository URL to get an aggregated code health report."
              action={{ label: "Review a repository", href: "/repo-review" }}
            />
          ) : (
            <>
              <div className={styles.toolbar}>
                <label className={styles.search}>
                  <AppIcon name="search" size={17} />
                  <span className="sr-only">Search repository reviews</span>
                  <input
                    value={repoQuery}
                    onChange={(e) => { setRepoQuery(e.target.value); setRepoPage(1); }}
                    placeholder="Search repository name"
                  />
                </label>
              </div>

              {repoReviews.length === 0 ? (
                <StateCard
                  title="No matching repositories"
                  description="Try a different repository name."
                />
              ) : (
                <div className={styles.list}>
                  {repoReviews.map((review) => (
                    <article className={styles.row} key={review._id}>
                      <button
                        className={styles.open}
                        onClick={() => router.push(`/repo-review/${review._id}`)}
                        aria-label={`Open ${review.repoName}`}
                      >
                        <span className={styles.score}>{review.avgScore ?? "—"}</span>
                        <span className={styles.details}>
                          <strong>{review.repoName}</strong>
                          <small>
                            {review.filesReviewed ?? 0} files · {review.totalIssues ?? 0} issues · {new Date(review.createdAt).toLocaleDateString()}
                          </small>
                        </span>
                        <span className={`${styles.status} ${styles[review.status]}`}>{review.status}</span>
                      </button>
                      <div className={styles.actions}>
                        <button
                          onClick={() => void deleteRepoReview(review)}
                          disabled={deletingRepo === review._id}
                          aria-label={`Delete ${review.repoName}`}
                        >
                          <AppIcon name="trash" size={15} />
                          {deletingRepo === review._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <Pagination
                page={repoPagination.page}
                totalPages={repoPagination.totalPages}
                total={repoPagination.total}
                onPageChange={setRepoPage}
              />
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
