"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const performanceData = [
  { time: "00:00", users: 40, voice: 24, ai: 18 },
  { time: "04:00", users: 25, voice: 12, ai: 10 },
  { time: "08:00", users: 80, voice: 55, ai: 42 },
  { time: "12:00", users: 142, voice: 98, ai: 76 },
  { time: "16:00", users: 128, voice: 110, ai: 89 },
  { time: "20:00", users: 95, voice: 72, ai: 61 },
  { time: "Now", users: 142, voice: 120, ai: 95 },
];

const dailyCommands = [
  { day: "Mon", voice: 145, ai: 89, text: 34 },
  { day: "Tue", voice: 189, ai: 112, text: 41 },
  { day: "Wed", voice: 201, ai: 134, text: 52 },
  { day: "Thu", voice: 178, ai: 98, text: 38 },
  { day: "Fri", voice: 234, ai: 156, text: 67 },
  { day: "Sat", voice: 156, ai: 87, text: 29 },
  { day: "Sun", voice: 120, voice2: 0, ai: 65, text: 22 },
];

type ChartView = "performance" | "commands";

export function ChartPanel() {
  const [view, setView] = useState<ChartView>("performance");

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("performance")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === "performance" ? "bg-white shadow-sm text-genesis-700" : "text-gray-500"
            }`}
          >
            Realtime
          </button>
          <button
            onClick={() => setView("commands")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === "commands" ? "bg-white shadow-sm text-genesis-700" : "text-gray-500"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="h-72">
        {view === "performance" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4c6ef5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVoice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#51cf66" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#51cf66" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cc5de8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#cc5de8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#adb5bd" />
              <YAxis tick={{ fontSize: 12 }} stroke="#adb5bd" />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e9ecef" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#4c6ef5"
                fill="url(#colorUsers)"
                strokeWidth={2}
                name="Active Users"
              />
              <Area
                type="monotone"
                dataKey="voice"
                stroke="#51cf66"
                fill="url(#colorVoice)"
                strokeWidth={2}
                name="Voice Commands"
              />
              <Area
                type="monotone"
                dataKey="ai"
                stroke="#cc5de8"
                fill="url(#colorAI)"
                strokeWidth={2}
                name="AI Requests"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyCommands}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#adb5bd" />
              <YAxis tick={{ fontSize: 12 }} stroke="#adb5bd" />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e9ecef" }}
              />
              <Legend />
              <Bar dataKey="voice" fill="#4c6ef5" radius={[4, 4, 0, 0]} name="Voice" />
              <Bar dataKey="ai" fill="#cc5de8" radius={[4, 4, 0, 0]} name="AI" />
              <Bar dataKey="text" fill="#868e96" radius={[4, 4, 0, 0]} name="Text" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
