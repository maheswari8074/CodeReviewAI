"use client";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { apiFetch } from "../lib/api";
import { ReviewListResponse, RepoReviewListResponse } from "../types";
import styles from "./DashboardCharts.module.css";

type ChartReview = {
  _id: string;
  language: string;
  filename: string;
  createdAt: string;
  status: string;
  result?: {
    overallScore?: number;
    readability?: number;
    performance?: number;
    security?: number;
    maintainability?: number;
    issues?: { severity: string }[];
  };
};

type ChartRepoReview = {
  _id: string;
  repoName: string;
  createdAt: string;
  status: string;
  avgScore?: number;
  totalIssues?: number;
  criticalCount?: number;
  filesReviewed?: number;
};

const C = {
  accent:     "#E8A020",
  success:    "#52A878",
  critical:   "#E05252",
  warning:    "#E8A020",
  suggestion: "#5299E0",
  repo:       "#C87ED4",
  grid:       "#2A2A2A",
  text:       "#A0998F",
};

type TooltipEntry = { color?: string; name?: string; value?: string | number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className={styles.tooltipEntry} style={{ color: entry.color ?? "var(--text-primary)" }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardCharts() {
  const [reviews, setReviews] = useState<ChartReview[]>([]);
  const [repoReviews, setRepoReviews] = useState<ChartRepoReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<ReviewListResponse>("/api/reviews?limit=100&page=1"),
      apiFetch<RepoReviewListResponse>("/api/repo-reviews?limit=100&page=1"),
    ])
      .then(([codeData, repoData]) => {
        setReviews((codeData.data as ChartReview[]) || []);
        setRepoReviews((repoData.data as ChartRepoReview[]) || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completed = useMemo(
    () => reviews.filter((r) => r.status === "completed" && r.result?.overallScore != null),
    [reviews],
  );

  const completedRepo = useMemo(
    () => repoReviews.filter((r) => r.status === "completed" && r.avgScore != null),
    [repoReviews],
  );

  const stats = useMemo(() => {
    const avgScore = completed.length
      ? Math.round(completed.reduce((s, r) => s + (r.result?.overallScore ?? 0), 0) / completed.length)
      : 0;
    const totalIssues = completed.reduce((s, r) => s + (r.result?.issues?.length ?? 0), 0)
      + completedRepo.reduce((s, r) => s + (r.totalIssues ?? 0), 0);
    return {
      totalReviews: completed.length,
      totalRepoReviews: completedRepo.length,
      avgScore,
      totalIssues,
    };
  }, [completed, completedRepo]);

  const scoreTrend = useMemo(() => {
    const codePoints = [...completed].reverse().slice(-8).map((r, i) => ({
      name: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      code: r.result?.overallScore ?? 0,
      repo: null as number | null,
      label: r.filename || `Review ${i + 1}`,
    }));
    const repoPoints = [...completedRepo].reverse().slice(-4).map((r) => ({
      name: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      code: null as number | null,
      repo: r.avgScore ?? 0,
      label: r.repoName,
    }));
    return [...codePoints, ...repoPoints].sort(
      (a, b) => new Date(a.name).getTime() - new Date(b.name).getTime(),
    ).slice(-10);
  }, [completed, completedRepo]);

  const qualityBreakdown = useMemo(() => {
    if (!completed.length) return [];
    const totals = completed.reduce(
      (acc, r) => ({
        readability:     acc.readability     + (r.result?.readability     ?? 0),
        performance:     acc.performance     + (r.result?.performance     ?? 0),
        security:        acc.security        + (r.result?.security        ?? 0),
        maintainability: acc.maintainability + (r.result?.maintainability ?? 0),
      }),
      { readability: 0, performance: 0, security: 0, maintainability: 0 },
    );
    const n = completed.length;
    return [
      { name: "Readability",     score: Math.round(totals.readability / n) },
      { name: "Performance",     score: Math.round(totals.performance / n) },
      { name: "Security",        score: Math.round(totals.security / n) },
      { name: "Maintainability", score: Math.round(totals.maintainability / n) },
    ];
  }, [completed]);

  const issueSeverity = useMemo(() => {
    const counts = { critical: 0, warning: 0, suggestion: 0 };
    completed.forEach((r) =>
      r.result?.issues?.forEach((issue) => {
        if (issue.severity in counts) counts[issue.severity as keyof typeof counts]++;
      }),
    );
    // add repo critical counts
    completedRepo.forEach((r) => { counts.critical += r.criticalCount ?? 0; });
    return [
      { name: "Critical",   value: counts.critical,   color: C.critical },
      { name: "Warning",    value: counts.warning,    color: C.warning },
      { name: "Suggestion", value: counts.suggestion, color: C.suggestion },
    ].filter((d) => d.value > 0);
  }, [completed, completedRepo]);

  const languageData = useMemo(() => {
    const counts: Record<string, number> = {};
    completed.forEach((r) => { const lang = r.language || "auto"; counts[lang] = (counts[lang] ?? 0) + 1; });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [completed]);

  const hasAnyData = completed.length > 0 || completedRepo.length > 0;

  if (loading) return <div className={styles.loading}>Loading charts…</div>;

  if (!hasAnyData) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📊</div>
        <h3>No review data yet</h3>
        <p>Complete your first code review to see score trends and analytics here.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Stats row */}
      <div className={styles.statGrid}>
        {[
          { label: "Code Reviews",  value: stats.totalReviews },
          { label: "Repo Reviews",  value: stats.totalRepoReviews },
          { label: "Avg Score",     value: stats.avgScore ? `${stats.avgScore}/100` : "—" },
          { label: "Issues Found",  value: stats.totalIssues },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.charts}>
        {/* Score trend — combined code + repo */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Score Trend</h3>
          <span className={styles.cardSub}>Code reviews and repository reviews over time</span>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreTrend}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: C.text, fontSize: 11 }} axisLine={{ stroke: C.grid }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: C.text, fontSize: 11 }} axisLine={{ stroke: C.grid }} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: C.text }} />
              <Line connectNulls type="monotone" dataKey="code" name="Code review" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 3 }} activeDot={{ r: 5 }} />
              <Line connectNulls type="monotone" dataKey="repo" name="Repo review" stroke={C.repo} strokeWidth={2} dot={{ fill: C.repo, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartGrid}>
          {/* Issues by severity */}
          {issueSeverity.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Issues by Severity</h3>
              <span className={styles.cardSubTight}>All code and repository reviews</span>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={issueSeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {issueSeverity.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: C.text }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quality breakdown (code reviews) */}
          {qualityBreakdown.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Quality Breakdown</h3>
              <span className={styles.cardSub}>Average scores by category · code reviews</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={qualityBreakdown} layout="vertical">
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: C.text, fontSize: 11 }} axisLine={{ stroke: C.grid }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.text, fontSize: 11 }} axisLine={{ stroke: C.grid }} tickLine={false} width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="score" name="Score" fill={C.success} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Languages */}
          {languageData.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Reviews by Language</h3>
              <span className={styles.cardSub}>Most reviewed languages</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={languageData}>
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: C.text, fontSize: 11 }} axisLine={{ stroke: C.grid }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: C.text, fontSize: 11 }} axisLine={{ stroke: C.grid }} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Reviews" fill={C.suggestion} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Repo review scores */}
          {completedRepo.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Repository Scores</h3>
              <span className={styles.cardSub}>Avg score per repository reviewed</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={completedRepo.slice(-6).map((r) => ({ name: r.repoName.split("/")[1] ?? r.repoName, score: r.avgScore ?? 0 }))}>
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: C.text, fontSize: 10 }} axisLine={{ stroke: C.grid }} tickLine={false} />
                  <YAxis domain={[0, 100]} allowDecimals={false} tick={{ fill: C.text, fontSize: 11 }} axisLine={{ stroke: C.grid }} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="score" name="Avg score" fill={C.repo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
