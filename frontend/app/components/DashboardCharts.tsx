"use client";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Review = {
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

const CHART_COLORS = {
  accent: "#E8A020",
  success: "#52A878",
  critical: "#E05252",
  warning: "#E8A020",
  suggestion: "#5299E0",
  grid: "#2A2A2A",
  text: "#A0998F",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "24px",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontFamily: "JetBrains Mono",
        fontSize: "12px",
      }}
    >
      {label && (
        <p style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>
          {label}
        </p>
      )}
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color || "var(--text-primary)" }}>
          {entry.name}: {entry.value}
          {entry.payload?.suffix || ""}
        </p>
      ))}
    </div>
  );
}

export default function DashboardCharts() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reviews?limit=100&page=1`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (res.ok) setReviews(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const completed = useMemo(
    () => reviews.filter((r) => r.status === "completed" && r.result?.overallScore != null),
    [reviews],
  );

  const stats = useMemo(() => {
    const totalIssues = completed.reduce(
      (sum, r) => sum + (r.result?.issues?.length || 0),
      0,
    );
    const avgScore = completed.length
      ? Math.round(
          completed.reduce((sum, r) => sum + (r.result?.overallScore || 0), 0) /
            completed.length,
        )
      : 0;

    return {
      totalReviews: completed.length,
      avgScore,
      totalIssues,
    };
  }, [completed]);

  const scoreTrend = useMemo(() => {
    return [...completed]
      .reverse()
      .slice(-10)
      .map((r, i) => ({
        name: new Date(r.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: r.result?.overallScore ?? 0,
        label: r.filename || `Review ${i + 1}`,
      }));
  }, [completed]);

  const qualityBreakdown = useMemo(() => {
    if (!completed.length) return [];

    const totals = completed.reduce(
      (acc, r) => ({
        readability: acc.readability + (r.result?.readability || 0),
        performance: acc.performance + (r.result?.performance || 0),
        security: acc.security + (r.result?.security || 0),
        maintainability: acc.maintainability + (r.result?.maintainability || 0),
      }),
      { readability: 0, performance: 0, security: 0, maintainability: 0 },
    );

    const count = completed.length;
    return [
      { name: "Readability", score: Math.round(totals.readability / count) },
      { name: "Performance", score: Math.round(totals.performance / count) },
      { name: "Security", score: Math.round(totals.security / count) },
      { name: "Maintainability", score: Math.round(totals.maintainability / count) },
    ];
  }, [completed]);

  const issueSeverity = useMemo(() => {
    const counts = { critical: 0, warning: 0, suggestion: 0 };
    completed.forEach((r) => {
      r.result?.issues?.forEach((issue) => {
        if (issue.severity in counts) {
          counts[issue.severity as keyof typeof counts]++;
        }
      });
    });

    return [
      { name: "Critical", value: counts.critical, color: CHART_COLORS.critical },
      { name: "Warning", value: counts.warning, color: CHART_COLORS.warning },
      { name: "Suggestion", value: counts.suggestion, color: CHART_COLORS.suggestion },
    ].filter((d) => d.value > 0);
  }, [completed]);

  const languageData = useMemo(() => {
    const counts: Record<string, number> = {};
    completed.forEach((r) => {
      const lang = r.language || "auto";
      counts[lang] = (counts[lang] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [completed]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
        Loading charts...
      </div>
    );
  }

  if (!completed.length) {
    return (
      <div
        style={{
          ...cardStyle,
          textAlign: "center",
          padding: "48px 24px",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
        <h3
          style={{
            fontFamily: "Space Grotesk",
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          No review data yet
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Complete your first code review to see score trends and analytics here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Reviews", value: stats.totalReviews },
          { label: "Avg Score", value: `${stats.avgScore}/100` },
          { label: "Issues Found", value: stats.totalIssues },
        ].map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, textAlign: "center", padding: "20px" }}>
            <div
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "28px",
                fontWeight: "700",
                color: "var(--accent)",
                marginBottom: "4px",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "10px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={cardStyle}>
          <h3
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          >
            Score Trend
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              marginBottom: "20px",
            }}
          >
            Overall score across your last {scoreTrend.length} reviews
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreTrend}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke={CHART_COLORS.accent}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS.accent, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
        {/* Issue severity */}
        {issueSeverity.length > 0 && (
          <div style={cardStyle}>
            <h3
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              Issues by Severity
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                marginBottom: "12px",
              }}
            >
              Breakdown across all reviews
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={issueSeverity}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {issueSeverity.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", color: CHART_COLORS.text }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quality breakdown */}
        <div style={cardStyle}>
          <h3
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          >
            Quality Breakdown
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              marginBottom: "20px",
            }}
          >
            Average scores by category
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={qualityBreakdown} layout="vertical">
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="score" name="Score" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Languages */}
        {languageData.length > 0 && (
          <div style={cardStyle}>
            <h3
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              Reviews by Language
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                marginBottom: "20px",
              }}
            >
              Most reviewed languages
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={languageData}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Reviews" fill={CHART_COLORS.suggestion} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
