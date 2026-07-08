export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  return [
    {
      id: 'first-task',
      title: 'First Task Complete',
      description: 'Complete your first TaskForge task',
      unlocked: false,
    },
  ];
}

export async function unlockAchievement(userId: string, achievementId: string) {
  return {
    userId,
    achievementId,
    unlocked: true,
  };
}
