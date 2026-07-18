type ProgressCardProps = {
  xp: number;
  coins: number;
  level: number;
};

export default function ProgressCard({ xp, coins, level }: ProgressCardProps) {
  return (
    <div>
      <h2>Progress</h2>
      <p>Level: {level}</p>
      <p>XP: {xp}</p>
      <p>Coins: {coins}</p>
    </div>
  );
}
