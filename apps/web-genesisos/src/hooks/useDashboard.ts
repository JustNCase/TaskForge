"use client";

import { useState, useEffect, useCallback } from "react";

interface DashboardMetrics {
  totalUsers: number;
  activeSessions: number;
  voiceCommands: number;
  aiRequests: number;
  uptime: string;
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/dashboard/metrics`);
      const data = await res.json();
      setMetrics(data.metrics);
    } catch {
      console.error("Failed to fetch dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { metrics, loading, refresh: fetchMetrics };
}
