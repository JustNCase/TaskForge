type LevelProgressProps = {
  level: number;
  xp: number;
};

export default function LevelProgress({ level, xp }: LevelProgressProps) {
  const nextLevelXp = level * 100;
  const progress = Math.min(Math.round((xp / nextLevelXp) * 100), 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Level Progress</h2>
      <div className="text-center mb-3">
        <span className="text-5xl font-bold text-blue-600">{level}</span>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current Level</p>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">{xp} / {nextLevelXp} XP</p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">{progress}% to Level {level + 1}</p>
    </div>
  );
}
