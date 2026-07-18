interface MetricCardProps {
  title: string;
  value: string;
  change: string;
}

export function MetricCard({ title, value, change }: MetricCardProps) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className={`text-sm mt-2 ${isPositive ? "text-green-600" : "text-gray-500"}`}>
        {change}
      </p>
    </div>
  );
}
