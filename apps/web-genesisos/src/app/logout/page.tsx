"use client";

import { useAuthStore } from "@/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const { logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">Logging out...</h1>
      </div>
    </div>
  );
}
