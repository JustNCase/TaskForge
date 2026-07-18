"use client";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  suffix?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  color = 'blue',
  suffix = ''
}: DashboardCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-center">
        <div className={`${colorClasses[color].bg} ${colorClasses[color].text} p-3 rounded-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value.toLocaleString()}
            {suffix && <span className="text-lg font-normal ml-1">{suffix}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
