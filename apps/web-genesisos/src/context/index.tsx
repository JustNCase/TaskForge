"use client";

import { useState, useEffect, ReactNode } from "react";
import { AuthProvider as AuthContextProvider } from "@/context/AuthContext";
import { useAuthStore, initializeAuth } from "@/lib/auth";

function AuthInitializer({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const user = initializeAuth();
    if (user) {
      useAuthStore.setState({ user, token: localStorage.getItem("auth_token") });
    }
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContextProvider>
      <AuthInitializer>{children}</AuthInitializer>
    </AuthContextProvider>
  );
}

export { useAuthStore } from "@/lib/auth";
