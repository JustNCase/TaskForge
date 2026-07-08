type EconomyWidgetProps = {
  xp: number;
  coins: number;
  level: number;
};

export default function EconomyWidget({ xp, coins, level }: EconomyWidgetProps) {
  return (
    <section>
      <h2>Progress</h2>
      <p>Level: {level}</p>
      <p>XP: {xp}</p>
      <p>Coins: {coins}</p>
    </section>
  );
}
