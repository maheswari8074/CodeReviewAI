const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await response.json().catch(() => null) as T | { message?: string } | null;
  if (!response.ok) {
    const errData = data as Record<string, unknown> | null;
    const message = errData && typeof errData === "object" && typeof errData.message === "string"
      ? errData.message
      : "Something went wrong. Please try again.";
    throw new ApiError(message, response.status);
  }
  return data as T;
}
