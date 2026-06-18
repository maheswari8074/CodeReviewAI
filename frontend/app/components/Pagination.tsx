"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "...")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  const buttonStyle = (active: boolean, disabled = false): React.CSSProperties => ({
    background: active ? "var(--accent)" : "var(--bg-secondary)",
    color: active ? "#0F0F0F" : disabled ? "var(--text-secondary)" : "var(--text-primary)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
    padding: "8px 14px",
    borderRadius: "6px",
    fontFamily: "Space Grotesk",
    fontSize: "13px",
    fontWeight: active ? "600" : "400",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "24px",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <span
        style={{
          fontFamily: "JetBrains Mono",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        Page {page} of {totalPages} · {total} total
      </span>

      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={buttonStyle(false, page <= 1)}
        >
          ← Prev
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              style={{ color: "var(--text-secondary)", padding: "0 4px" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={buttonStyle(p === page)}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={buttonStyle(false, page >= totalPages)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
