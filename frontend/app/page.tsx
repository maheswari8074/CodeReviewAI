"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "./hooks/useAuth";

type IconName = "arrow" | "chat" | "chart" | "check" | "code" | "file" | "github" | "history" | "repo" | "shield" | "star" | "zap" | "lock";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow:   <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    chat:    <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></>,
    chart:   <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    check:   <path d="m5 12 4 4L19 6" />,
    code:    <><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></>,
    file:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    github:  <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.3 4 5 5 0 0 0 19.1.5S18 0 15 2a13.4 13.4 0 0 0-7 0C5-.1 3.9.5 3.9.5A5 5 0 0 0 3.7 4a5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" /><path d="M8 19c-3 .9-3-1.5-4-2" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    repo:    <><path d="M3 3h7a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H3Z" /><path d="M21 3h-7a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h7Z" /></>,
    shield:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    star:    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    zap:     <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></>,
    lock:    <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/* ── Hero mockup data ── */
const codeLines = [
  { n: 1,  tokens: [{ t: "keyword", v: "def " }, { t: "fn", v: "find_duplicates" }, { t: "plain", v: "(arr):" }] },
  { n: 2,  tokens: [{ t: "plain", v: "    duplicates = []" }] },
  { n: 3,  tokens: [{ t: "keyword", v: "    for " }, { t: "plain", v: "i " }, { t: "keyword", v: "in " }, { t: "fn", v: "range" }, { t: "plain", v: "(" }, { t: "fn", v: "len" }, { t: "plain", v: "(arr)):" }] },
  { n: 4,  tokens: [{ t: "keyword", v: "        for " }, { t: "plain", v: "j " }, { t: "keyword", v: "in " }, { t: "fn", v: "range" }, { t: "plain", v: "(" }, { t: "fn", v: "len" }, { t: "plain", v: "(arr)):" }] },
  { n: 5,  tokens: [{ t: "keyword", v: "            if " }, { t: "plain", v: "i != j " }, { t: "keyword", v: "and " }, { t: "plain", v: "arr[i] == arr[j]:" }] },
  { n: 6,  tokens: [{ t: "plain", v: "                duplicates." }, { t: "fn", v: "append" }, { t: "plain", v: "(arr[i])" }] },
  { n: 7,  tokens: [{ t: "keyword", v: "    return " }, { t: "plain", v: "duplicates" }] },
];

const findings = [
  { tone: "red",   label: "Critical",   line: "L3–4", title: "O(n²) quadratic loop", delay: "0ms" },
  { tone: "amber", label: "Warning",    line: "L5",   title: "Repeated membership test", delay: "120ms" },
  { tone: "blue",  label: "Suggestion", line: "L1",   title: "Replace with Set-based pass", delay: "240ms" },
];

const scoreDimensions = [
  { label: "Readability",     pct: 78 },
  { label: "Performance",     pct: 38 },
  { label: "Security",        pct: 91 },
  { label: "Maintainability", pct: 62 },
];

/* ── Features ── */
type FeatureItem = { icon: IconName; eyebrow: string; title: string; text: string; meta: string; accent: string };
const features: FeatureItem[] = [
  { icon: "code",    eyebrow: "Snippet review",    title: "Find what's hiding in your code",       text: "Paste any snippet. Get severity-ranked issues, Big O analysis, and concrete refactors in seconds.",          meta: "Auto-detect + 7 languages", accent: "#E8A020" },
  { icon: "repo",    eyebrow: "Repository review", title: "Zoom out to the whole repository",       text: "Submit a public GitHub URL. CodeReviewAI samples key files and returns one aggregated health report.",       meta: "Up to 8 key files",          accent: "#5299E0" },
  { icon: "chat",    eyebrow: "AI chat",           title: "Keep asking until it clicks",            text: "Ask follow-up questions about any review, or use the general assistant for code and design questions.",      meta: "Review-aware context",       accent: "#52A878" },
  { icon: "chart",   eyebrow: "Analytics",         title: "See quality improve over time",          text: "Track review volume, average scores, language usage, and quality trends right from your dashboard.",         meta: "Score trends + history",     accent: "#C87ED4" },
  { icon: "file",    eyebrow: "PDF reports",       title: "Turn findings into a shareable artifact", text: "Export a clean PDF with score breakdowns, issues, complexity notes, and suggested improvements.",           meta: "One-click export",           accent: "#E8A020" },
  { icon: "history", eyebrow: "Review history",    title: "Every review stays within reach",        text: "Return to completed reviews, rerun them with a single click, or delete what you no longer need.",           meta: "Search + filter timeline",   accent: "#5299E0" },
];

/* ── Tech badges ── */
const techStack = ["Next.js 15", "TypeScript", "Node.js", "MongoDB", "Redis", "Groq AI", "GitHub OAuth", "JWT"];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [scanDone, setScanDone] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setScanDone(true), 1100);
    const t2 = window.setTimeout(() => setScoreVisible(true), 600);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  const login = () => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`; };
  const go = () => (user ? router.push("/dashboard") : login());

  return (
    <main className="hp">

      {/* ── subtle grid + glows ── */}
      <div className="hp-grid" aria-hidden="true" />
      <div className="hp-glow-a" aria-hidden="true" />
      <div className="hp-glow-b" aria-hidden="true" />

      {/* ════ NAV ════ */}
      <nav className="hp-nav" aria-label="Main navigation">
        <button className="hp-brand" onClick={() => router.push("/")} aria-label="CodeReviewAI home">
          <span className="hp-brand-mark"><Icon name="code" size={17} /></span>
          <span>CodeReview<em>AI</em></span>
        </button>

        <div className="hp-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <a href="#stack">Tech stack</a>
        </div>

        <div className="hp-nav-end">
          {user?.avatar && <Image src={user.avatar} alt="" width={30} height={30} className="hp-avatar" unoptimized />}
          <button className="hp-btn hp-btn-sm" onClick={go}>
            {user ? "Open dashboard" : <><Icon name="github" size={16} /> Sign in with GitHub</>}
          </button>
        </div>
      </nav>

      {/* ════ HERO ════ */}
      <section className="hp-hero">
        <div className="hp-hero-copy">
          <div className="hp-pill">
            <span className="hp-pill-dot" />
            AI-powered · Real development workflow
          </div>

          <h1>Ship better code.<br /><em>Understand why.</em></h1>

          <p className="hp-lede">
            Review a snippet or an entire GitHub repository. Get severity-ranked issues,
            quality scores, Big O analysis, and answers you can keep exploring.
          </p>

          <div className="hp-hero-btns">
            <button className="hp-btn hp-btn-primary" onClick={go}>
              {user ? "Go to dashboard" : "Start reviewing free"}
              <Icon name="arrow" size={17} />
            </button>
            <a className="hp-btn hp-btn-ghost" href="#features">See features</a>
          </div>

          <div className="hp-trust">
            <span><Icon name="check" size={14} /> GitHub sign-in</span>
            <span><Icon name="check" size={14} /> No setup needed</span>
            <span><Icon name="check" size={14} /> PDF export</span>
            <span><Icon name="check" size={14} /> Free to use</span>
          </div>
        </div>

        {/* ── Product window ── */}
        <div className="hp-window" aria-label="Live product preview">
          {/* title bar */}
          <div className="hp-winbar">
            <div className="hp-dots"><i /><i /><i /></div>
            <span className="hp-winbar-file">
              <span className="hp-lang-badge">PY</span>
              duplicate-finder.py
            </span>
            <span className={`hp-scan-badge ${scanDone ? "done" : ""}`}>
              <i />
              {scanDone ? "Review complete" : "Analyzing…"}
            </span>
          </div>

          {/* body: code + results side by side */}
          <div className="hp-win-body">
            {/* code pane */}
            <div className="hp-code-pane">
              <div className="hp-scan-line" aria-hidden="true" />
              <pre>
                <code>
                  {codeLines.map((line) => (
                    <div
                      key={line.n}
                      className={`hp-line ${scanDone && (line.n === 3 || line.n === 4) ? "hp-line-warn" : ""} ${scanDone && line.n === 5 ? "hp-line-crit" : ""}`}
                    >
                      <span className="hp-ln">{line.n}</span>
                      {line.tokens.map((tok, i) => (
                        <span key={i} className={`hp-tok-${tok.t}`}>{tok.v}</span>
                      ))}
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* results pane */}
            <div className="hp-results-pane">
              {/* score */}
              <div className="hp-score-block">
                <div className="hp-score-labels">
                  <span>Code health</span>
                  <strong className={scoreVisible ? "hp-score-visible" : ""}>62<small>/100</small></strong>
                </div>
                <div className="hp-ring" aria-label="Score: 62 out of 100">
                  <svg viewBox="0 0 44 44" className="hp-ring-svg">
                    <circle cx="22" cy="22" r="18" className="hp-ring-track" />
                    <circle cx="22" cy="22" r="18" className={`hp-ring-fill ${scoreVisible ? "hp-ring-animated" : ""}`} />
                  </svg>
                  <span className="hp-ring-num">62</span>
                </div>
              </div>

              {/* score bars */}
              <div className="hp-bars">
                {scoreDimensions.map((d) => (
                  <div key={d.label} className="hp-bar-row">
                    <div className="hp-bar-meta">
                      <span>{d.label}</span><span>{d.pct}</span>
                    </div>
                    <div className="hp-bar-track">
                      <div
                        className={`hp-bar-fill ${scoreVisible ? "hp-bar-animated" : ""}`}
                        style={{ "--bar-w": `${d.pct}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* divider */}
              <div className="hp-div" />

              {/* findings */}
              <div className="hp-findings-head">
                <span>3 findings</span>
                <small>Sorted by severity</small>
              </div>
              <div className="hp-findings">
                {findings.map((f) => (
                  <div
                    key={f.title}
                    className={`hp-finding hp-finding-${f.tone} ${scanDone ? "hp-finding-visible" : ""}`}
                    style={{ transitionDelay: f.delay }}
                  >
                    <div className="hp-finding-top">
                      <span>{f.label}</span>
                      <small>{f.line}</small>
                    </div>
                    <strong>{f.title}</strong>
                  </div>
                ))}
              </div>

              <button className="hp-open-report" onClick={go}>
                View full report <Icon name="arrow" size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════ STATS STRIP ════ */}
      <div className="hp-stats" aria-label="Product highlights">
        {[
          { icon: "code"    as IconName, num: "7+",  label: "Languages"        },
          { icon: "zap"     as IconName, num: "4",   label: "Quality dimensions" },
          { icon: "shield"  as IconName, num: "3",   label: "Severity levels"  },
          { icon: "star"    as IconName, num: "100", label: "Point score scale" },
          { icon: "lock"    as IconName, num: "JWT", label: "Auth + Redis cache"},
        ].map((s) => (
          <div key={s.label} className="hp-stat">
            <span className="hp-stat-icon"><Icon name={s.icon} size={16} /></span>
            <strong>{s.num}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ════ FEATURES ════ */}
      <section className="hp-features" id="features">
        <div className="hp-section-intro">
          <div>
            <p className="hp-eyebrow"><span /> Everything in one review loop</p>
            <h2>From first scan to<br />the deeper question.</h2>
          </div>
          <p>CodeReviewAI does more than flag a line. It gives you the context to understand the problem, act on it, and measure what changed.</p>
        </div>

        <div className="hp-feature-grid">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="hp-feature-card"
              style={{ "--card-accent": f.accent } as React.CSSProperties}
            >
              <div className="hp-feat-number">0{i + 1}</div>
              <div className="hp-feat-icon" style={{ borderColor: `${f.accent}30`, background: `${f.accent}10`, color: f.accent }}>
                <Icon name={f.icon} size={20} />
              </div>
              <p className="hp-feat-eyebrow" style={{ color: f.accent }}>{f.eyebrow}</p>
              <h3>{f.title}</h3>
              <span>{f.text}</span>
              <footer>
                <span className="hp-feat-check" style={{ color: f.accent }}>
                  <Icon name="check" size={13} />
                </span>
                {f.meta}
              </footer>
            </article>
          ))}
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="hp-workflow" id="workflow">
        <div className="hp-workflow-copy">
          <p className="hp-eyebrow"><span /> How it works</p>
          <h2>A focused review,<br />without the ceremony.</h2>
          <p>Three steps from raw code to an actionable report. Your results stay organized for the next time you need them.</p>
          <button className="hp-text-link" onClick={go}>
            Run your first review <Icon name="arrow" size={15} />
          </button>
        </div>

        <div className="hp-steps">
          {[
            { n: "01", icon: "code"   as IconName, title: "Bring the code",      body: "Paste a snippet or submit a public GitHub repository URL. Supports 7+ languages with auto-detection." },
            { n: "02", icon: "shield" as IconName, title: "Let AI inspect it",    body: "The engine evaluates issues, Big O complexity, security risks, readability, performance, and maintainability." },
            { n: "03", icon: "chart"  as IconName, title: "Act with context",     body: "Explore refactors, ask follow-up questions in the contextual chat, revisit history, or export the full PDF report." },
          ].map((step) => (
            <article key={step.n}>
              <div className="hp-step-num">{step.n}</div>
              <div className="hp-step-body">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
              <div className="hp-step-icon"><Icon name={step.icon} size={22} /></div>
            </article>
          ))}
        </div>
      </section>

      {/* ════ TECH STACK ════ */}
      <section className="hp-stack" id="stack">
        <div className="hp-stack-copy">
          <p className="hp-eyebrow"><span /> Built with</p>
          <h2>A production-grade stack,<br />not tutorial code.</h2>
          <p>
            Every layer was chosen deliberately — async job processing with polling,
            Redis caching to skip repeat LLM calls, ownership-scoped queries,
            and per-user rate limiting throughout.
          </p>
          <a
            className="hp-btn hp-btn-ghost"
            href="https://github.com/maheswari8074/CodeReviewAI"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="github" size={16} /> View source on GitHub
          </a>
        </div>

        <div className="hp-stack-grid">
          {techStack.map((name) => (
            <div key={name} className="hp-stack-badge">{name}</div>
          ))}

          <div className="hp-stack-highlight">
            <Icon name="zap" size={18} />
            <div>
              <strong>Async processing</strong>
              <span>Submit → immediate ID → poll for results. No blocking, no timeouts.</span>
            </div>
          </div>

          <div className="hp-stack-highlight">
            <Icon name="lock" size={18} />
            <div>
              <strong>Secure by design</strong>
              <span>JWT auth, ownership-scoped DB queries, rate limiting, Redis caching.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="hp-cta">
        <div className="hp-cta-glow" aria-hidden="true" />
        <div className="hp-cta-copy">
          <p className="hp-eyebrow"><span /> Your next review is ready</p>
          <h2>Good code starts with<br />a better second look.</h2>
          <p>Connect GitHub and turn your next review into a clear plan of action. Free, no setup required.</p>
          <button className="hp-btn hp-btn-primary hp-btn-lg" onClick={go}>
            {user ? "Open dashboard" : "Continue with GitHub"}
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="hp-cta-checks">
          {["GitHub OAuth login", "Code + repository review", "Context-aware AI chat", "PDF export", "Review history", "Score analytics"].map((item) => (
            <div key={item} className="hp-cta-check">
              <Icon name="check" size={14} /> {item}
            </div>
          ))}
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="hp-footer">
        <div className="hp-footer-brand">
          <span className="hp-brand-mark sm"><Icon name="code" size={16} /></span>
          <span>CodeReview<em>AI</em></span>
        </div>

        <p className="hp-footer-desc">
          AI-powered code review — issues, scores, refactors, and answers in one place.
        </p>

        <div className="hp-footer-links">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <a href="#stack">Tech stack</a>
          <a href="https://github.com/maheswari8074/CodeReviewAI" target="_blank" rel="noopener noreferrer">
            <Icon name="github" size={14} /> GitHub
          </a>
        </div>

        <div className="hp-footer-stack">
          {techStack.slice(0, 5).map((t) => <span key={t}>{t}</span>)}
        </div>

        <span className="hp-footer-copy">© {new Date().getFullYear()} CodeReviewAI · Built for better code</span>
      </footer>
    </main>
  );
}
