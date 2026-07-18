export interface DashboardData {
  metrics: Record<string, number>;
  timeSeries: { timestamp: string; value: number }[];
  alerts: { id: string; message: string; severity: "info" | "warning" | "critical" }[];
}

export class DashboardService {
  async getData(): Promise<DashboardData> {
    return {
      metrics: { activeUsers: 0, voiceCommands: 0, aiRequests: 0 },
      timeSeries: [],
      alerts: [],
    };
  }
}
