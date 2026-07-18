"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { VoiceTranscript } from "@/components/voice/VoiceTranscript";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { useAuthStore } from "@/context";
import { useVoice } from "@/hooks/useVoice";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboard();
  const { user } = useAuthStore();
  const voice = useVoice((intent, target) => {
    const t = target.toLowerCase();
    if (t.includes("user") || t.includes("admin")) {
      router.push("/dashboard/users");
    } else if (t.includes("analytics") || t.includes("chart") || t.includes("metric")) {
      document.getElementById("metrics-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (t.includes("dashboard") || t.includes("overview") || t.includes("home")) {
      router.push("/dashboard");
    }
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-genesis-700">Genesis-OS Dashboard</h1>
            <div className="flex items-center gap-4">
              <VoiceButton
                listening={voice.listening}
                connected={voice.connected}
                error={voice.error}
                onToggle={() => voice.listening ? voice.stopListening() : voice.startListening()}
              />
              <div className="w-8 h-8 rounded-full bg-genesis-200 flex items-center justify-center text-genesis-700 font-bold">
                U
              </div>
            </div>
          </div>
        </header>

        <nav className="bg-white border-t px-6 py-2 flex items-center justify-between">
          <div className="flex gap-4">
            <a href="/dashboard" className="text-sm text-gray-600 hover:text-genesis-600">Overview</a>
            {user?.role === "admin" && <a href="/dashboard/users" className="text-sm text-gray-600 hover:text-genesis-600">Users</a>}
          </div>
          <div className="flex gap-4">
            <span className="text-sm text-gray-600">Role: {user?.role}</span>
            <a href="/logout" className="text-sm text-gray-500 hover:text-genesis-600">Logout</a>
          </div>
        </nav>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Users"
            value={loading ? "..." : String(metrics?.totalUsers ?? 142)}
            change="+12%"
          />
          <MetricCard
            title="Voice Commands"
            value={loading ? "..." : String(metrics?.voiceCommands ?? 1204)}
            change="+8%"
          />
          <MetricCard
            title="AI Requests"
            value={loading ? "..." : String(metrics?.aiRequests ?? 892)}
            change="+23%"
          />
          <MetricCard
            title="Uptime"
            value={loading ? "..." : (metrics?.uptime ?? "99.7%")}
            change="stable"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartPanel />
          </div>
          <div className="space-y-6">
            <ActivityFeed />
            <AIAssistant />
          </div>
        </div>

        <VoiceTranscript entries={voice.transcript} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
