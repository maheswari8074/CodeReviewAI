"use client";
import { useRouter } from "next/navigation";
import styles from "./error.module.css";

export default function AuthError() {
  const router = useRouter();

  return (
    <div className={styles.page} role="alert" aria-labelledby="auth-err-title">
      <span className={styles.icon} aria-hidden="true">⚠</span>
      <h2 id="auth-err-title" className={styles.title}>Authentication failed</h2>
      <p className={styles.body}>Something went wrong during GitHub login. Please try again.</p>
      <button className="app-button primary" onClick={() => router.push("/")}>
        Back to home
      </button>
    </div>
  );
}
