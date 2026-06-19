"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./callback.module.css";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  }, [router, searchParams]);

  return (
    <div className={styles.page} role="status" aria-label="Authenticating with GitHub">
      <span className="app-spinner" aria-hidden="true" />
      <p>Authenticating…</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
