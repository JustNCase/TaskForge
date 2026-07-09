type AchievementBadgeProps = {
  title: string;
  description: string;
  icon?: string;
  unlocked: boolean;
};

export default function AchievementBadge({ title, description, icon, unlocked }: AchievementBadgeProps) {
  return (
    <div className={`rounded-lg p-4 border-2 ${
      unlocked
        ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
    }`}>
      <div className="text-2xl mb-1">{icon || '🏆'}</div>
      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
        unlocked
          ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {unlocked ? 'Unlocked' : 'Locked'}
      </span>
    </div>
  );
}
