"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AppIcon, { AppIconName } from "./AppIcon";
import styles from "./AppShell.module.css";

const links: Array<{ href: string; label: string; icon: AppIconName }> = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/review", label: "Code review", icon: "code" },
  { href: "/repo-review", label: "Repository review", icon: "repo" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/chat", label: "AI assistant", icon: "chat" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, router, user]);

  if (loading || !user) return <div className="app-loading" role="status"><span className="app-spinner" /><span className="sr-only">Loading account</span></div>;

  const navigation = (
    <>
      <Link href="/" className={styles.brand}><span className={styles.mark}><AppIcon name="code" /></span><span>CodeReview<em>AI</em></span></Link>
      <nav className={styles.nav} aria-label="Workspace navigation">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
          return <Link href={link.href} onClick={() => setOpen(false)} className={active ? styles.active : ""} key={link.href}><AppIcon name={link.icon} />{link.label}</Link>;
        })}
      </nav>
      <div className={styles.profile}>
        <div className={styles.person}><Image src={user.avatar} alt="" width={34} height={34} className={styles.avatar} unoptimized /><div><strong>{user.name || user.username}</strong><span>@{user.username}</span></div></div>
        <button className={styles.logout} onClick={logout}><AppIcon name="logout" size={16} /> Sign out</button>
      </div>
    </>
  );

  return <div className={styles.shell}>
    <header className={styles.mobileHeader}><Link href="/" className={styles.brand}><span className={styles.mark}><AppIcon name="code" /></span><span>CodeReview<em>AI</em></span></Link><button className={styles.menu} onClick={() => setOpen(true)} aria-label="Open navigation"><AppIcon name="menu" /></button></header>
    {open && <button className={styles.backdrop} onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>{navigation}</aside>
    <main className={styles.content}><div className={styles.inner}>{children}</div></main>
  </div>;
}
