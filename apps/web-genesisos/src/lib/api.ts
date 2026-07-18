const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  dashboard: {
    getMetrics: () => apiFetch<{ metrics: Record<string, unknown> }>("/api/dashboard/metrics"),
    getActivity: () => apiFetch<{ activities: unknown[] }>("/api/dashboard/activity"),
  },
  voice: {
    getStatus: () => apiFetch<{ status: string }>("/api/voice/status"),
  },
  ai: {
    chat: (message: string) =>
      apiFetch<{ response: string }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
  },
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ token: string; user: unknown }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
};
