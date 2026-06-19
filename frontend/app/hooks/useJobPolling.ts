"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type JobStatus = {
  status: string;
  error?: string;
  reviewId?: string;
  repoReviewId?: string;
  [key: string]: unknown;
};

type UseJobPollingOptions = {
  statusUrl: (id: string) => string;
  intervalMs?: number;
  onComplete?: (data: JobStatus) => void;
  onFailed?: (data: JobStatus) => void;
};

export function useJobPolling({
  statusUrl,
  intervalMs = 3000,
  onComplete,
  onFailed,
}: UseJobPollingOptions) {
  const [status, setStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onFailedRef.current = onFailed;
  }, [onComplete, onFailed]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  }, []);

  const checkStatus = useCallback(
    async (id: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch(statusUrl(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to check status");
      setStatus(data.status);
      return data as JobStatus;
    },
    [statusUrl],
  );

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      setPolling(true);
      setError("");
      setStatus("processing");

      const tick = async () => {
        try {
          const data = await checkStatus(id);
          if (data.status === "completed") {
            stopPolling();
            onCompleteRef.current?.(data);
          } else if (data.status === "failed") {
            stopPolling();
            const message = data.error || "Job failed";
            setError(message);
            onFailedRef.current?.(data);
          }
        } catch (err) {
          stopPolling();
          setError(err instanceof Error ? err.message : "Failed to check status");
        }
      };

      tick();
      intervalRef.current = setInterval(tick, intervalMs);
    },
    [checkStatus, intervalMs, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { status, polling, error, startPolling, stopPolling, checkStatus };
}
