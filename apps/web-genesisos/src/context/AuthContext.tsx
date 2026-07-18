"use client";

import React from "react";

export class AuthProvider extends React.Component<{ children: React.ReactNode }> {
  private unsubscribe: (() => void) | null = null;

  async componentDidMount() {
    if (typeof window !== "undefined") {
      const { useAuthStore, initializeAuth } = await import("@/lib/auth");
      const user = initializeAuth();
      if (user) {
        useAuthStore.setState({ user, token: localStorage.getItem("auth_token") });
      }

      this.unsubscribe = useAuthStore.subscribe((state) => {
        if (!state.user && state.token) {
          const user = initializeAuth();
          if (user) {
            useAuthStore.setState({ user, token: localStorage.getItem("auth_token") });
          }
        }
      });
    }
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  render() {
    return this.props.children;
  }
}
