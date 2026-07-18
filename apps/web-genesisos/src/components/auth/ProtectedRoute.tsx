"use client";

import { useAuthStore } from "@/context";
import Link from "next/link";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access this page.</p>
          <Link
            href="/login"
            className="px-6 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
