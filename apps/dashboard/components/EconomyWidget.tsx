type EconomyWidgetProps = {
  xp: number;
  coins: number;
  level: number;
};

export default function EconomyWidget({ xp, coins, level }: EconomyWidgetProps) {
  const nextLevelXp = level * 100;
  const progress = Math.min(Math.round((xp / nextLevelXp) * 100), 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Progress</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">{level}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-600">{xp}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-600">{coins}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Coins</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Level {level}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
