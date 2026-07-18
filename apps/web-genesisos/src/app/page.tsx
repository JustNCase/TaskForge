export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-genesis-600">Genesis-OS</h1>
        <p className="text-xl text-gray-600">AI-Powered Dashboard with Voice Control</p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
          >
            Open Dashboard
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 border border-genesis-600 text-genesis-600 rounded-lg hover:bg-genesis-50 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
