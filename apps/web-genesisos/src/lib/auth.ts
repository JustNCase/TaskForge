import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "viewer";
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  validateToken: (token: string) => Promise<User | null>;
}

const TOKEN_KEY = "auth_token";

export function decodeToken(token: string): User | null {
  try {
    const payload = jwtDecode<{ sub?: string; id?: string; email?: string; name?: string; role?: string; iat?: number }>(token);
    return {
      id: payload.sub || payload.id || "",
      email: payload.email || "",
      name: payload.name || payload.email || "",
      role: (payload.role as User["role"]) || "user",
      createdAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  get isAuthenticated() {
    return !!(get().token && get().user);
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Login failed");
      }

      const data = await response.json();
      const user: User = data.user;

      localStorage.setItem(TOKEN_KEY, data.token);
      set({ user, token: data.token, isLoading: false });

      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null });
  },

  validateToken: async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const user: User = data.user;

      localStorage.setItem(TOKEN_KEY, token);
      set({ user, token });
      return user;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, token: null });
      return null;
    }
  },
}));

export function initializeAuth(): User | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const user = decodeToken(token);
  if (!user) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return user;
}
