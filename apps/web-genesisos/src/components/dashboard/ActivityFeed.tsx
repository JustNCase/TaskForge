const activities = [
  { id: "1", type: "voice", message: "Voice command: 'Show analytics'", time: "2m ago" },
  { id: "2", type: "ai", message: "AI insight generated", time: "5m ago" },
  { id: "3", type: "system", message: "Health check passed", time: "10m ago" },
  { id: "4", type: "user", message: "Settings updated", time: "15m ago" },
];

const typeColors: Record<string, string> = {
  voice: "bg-blue-100 text-blue-700",
  ai: "bg-purple-100 text-purple-700",
  system: "bg-green-100 text-green-700",
  user: "bg-gray-100 text-gray-700",
};

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Activity</h2>
      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[a.type]}`}>
              {a.type}
            </span>
            <div>
              <p className="text-sm text-gray-700">{a.message}</p>
              <p className="text-xs text-gray-400">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
