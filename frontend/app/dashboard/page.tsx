"use client";

import Link from "next/link";
import AppIcon, { AppIconName } from "../components/AppIcon";
import AppShell from "../components/AppShell";
import DashboardCharts from "../components/DashboardCharts";
import OnboardingModal from "../components/OnboardingModal";
import { PageHeader } from "../components/UI";
import { useAuth } from "../hooks/useAuth";
import styles from "./dashboard.module.css";

const actions: Array<{ href: string; icon: AppIconName; title: string; text: string; label: string }> = [
  { href: "/review", icon: "code", title: "Review code", text: "Paste a snippet and inspect issues, complexity, quality scores, and refactors.", label: "Start code review" },
  { href: "/repo-review", icon: "repo", title: "Review a repository", text: "Analyze up to eight key files from a public GitHub repository.", label: "Analyze repository" },
  { href: "/chat", icon: "chat", title: "Ask the AI assistant", text: "Work through coding questions, explanations, and engineering decisions.", label: "Open assistant" },
];

export default function Dashboard() {
  const { user } = useAuth();
  return <AppShell>
    <OnboardingModal />
    <PageHeader eyebrow="Workspace overview" title={`Welcome back${user ? `, ${user.name || user.username}` : ""}`} description="Choose a review workflow or inspect how your code quality is changing over time." />
    <section className={styles.quickStart} aria-labelledby="quick-start-title">
      <div className={styles.sectionHeading}><div><p className="app-eyebrow">Quick start</p><h2 id="quick-start-title">What would you like to review?</h2></div><Link href="/history">View all history</Link></div>
      <div className={styles.actionGrid}>{actions.map((action) => <Link href={action.href} className={styles.actionCard} key={action.href}><span className={styles.icon}><AppIcon name={action.icon} size={22} /></span><h3>{action.title}</h3><p>{action.text}</p><strong>{action.label} <span aria-hidden="true">→</span></strong></Link>)}</div>
    </section>
    <section aria-labelledby="analytics-title"><div className={styles.sectionHeading}><div><p className="app-eyebrow">Analytics</p><h2 id="analytics-title">Your review insights</h2></div></div><DashboardCharts /></section>
  </AppShell>;
}
