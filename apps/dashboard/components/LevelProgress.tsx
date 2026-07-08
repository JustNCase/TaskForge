type LevelProgressProps = {
  level: number;
  xp: number;
};

export default function LevelProgress({ level, xp }: LevelProgressProps) {
  const nextLevelXp = level * 1000;
  const progress = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <div>
      <h2>Level {level}</h2>
      <p>{xp} XP</p>
      <progress value={progress} max={100} />
    </div>
  );
}
