"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppIcon from "./AppIcon";
import styles from "./OnboardingModal.module.css";

const STORAGE_KEY = "onboarding_v1_seen";

const steps = [
  {
    icon: "code" as const,
    title: "Review a code snippet",
    description: "Paste any code and get severity-ranked issues, Big O complexity analysis, quality scores, and concrete refactors in seconds.",
    action: "Try a code review",
    href: "/review",
  },
  {
    icon: "repo" as const,
    title: "Review a repository",
    description: "Submit a public GitHub URL. CodeReviewAI samples up to eight key source files and returns one aggregated health report.",
    action: "Analyze a repository",
    href: "/repo-review",
  },
  {
    icon: "chat" as const,
    title: "Ask the AI assistant",
    description: "Ask follow-up questions about any review, or use the general assistant for code questions, design decisions, or explanations.",
    action: "Open the assistant",
    href: "/chat",
  },
];

export default function OnboardingModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    // Reading localStorage in an effect to determine initial visibility is
    // the correct pattern here — we cannot do this at module scope since
    // localStorage is unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const go = (href: string) => {
    dismiss();
    router.push(href);
  };

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className={styles.modal}>
        <button className={styles.close} onClick={dismiss} aria-label="Dismiss welcome guide">
          <AppIcon name="x" size={18} />
        </button>

        <div className={styles.kicker}>
          <span className={styles.kickerDot} />
          Welcome to CodeReviewAI
        </div>

        <div className={styles.stepTrack}>
          {steps.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ""} ${i < step ? styles.dotDone : ""}`}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className={styles.body}>
          <div className={styles.iconWrap}>
            <AppIcon name={current.icon} size={26} />
          </div>
          <h2 id="onboard-title">{current.title}</h2>
          <p>{current.description}</p>
        </div>

        <div className={styles.footer}>
          <button className={styles.skipBtn} onClick={dismiss}>
            {isLast ? "Skip tour" : "Skip"}
          </button>
          <div className={styles.footerActions}>
            {step > 0 && (
              <button className="app-button" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            )}
            {isLast ? (
              <button className="app-button primary" onClick={() => go(current.href)}>
                {current.action} →
              </button>
            ) : (
              <button className="app-button primary" onClick={() => setStep((s) => s + 1)}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
