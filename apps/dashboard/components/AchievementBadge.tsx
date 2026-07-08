type AchievementBadgeProps = {
  title: string;
  description: string;
  unlocked: boolean;
};

export default function AchievementBadge({ title, description, unlocked }: AchievementBadgeProps) {
  return (
    <section>
      <h3>{title}</h3>
      <p>{description}</p>
      <span>{unlocked ? 'Unlocked' : 'Locked'}</span>
    </section>
  );
}
