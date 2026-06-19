import Link from "next/link";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="app-page-header"><div><p className="app-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="app-page-action">{action}</div>}</header>;
}

export function StateCard({ title, description, action, tone = "default" }: { title: string; description: string; action?: { label: string; href: string }; tone?: "default" | "error" }) {
  return <div className={`app-state-card ${tone === "error" ? "is-error" : ""}`} role={tone === "error" ? "alert" : undefined}><span className="app-state-mark">{tone === "error" ? "!" : "{}"}</span><h2>{title}</h2><p>{description}</p>{action && <Link href={action.href} className="app-button primary">{action.label}</Link>}</div>;
}

export function LoadingCard({ label = "Loading" }: { label?: string }) {
  return <div className="app-loading-card" role="status"><span className="app-spinner" /><span>{label}</span></div>;
}
