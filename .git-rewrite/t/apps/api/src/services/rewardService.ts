export type CompletionReward = {
  xp: number;
  coins: number;
};

export function completeTaskReward(): CompletionReward {
  return {
    xp: 50,
    coins: 25
  };
}

export async function applyTaskReward(userId: string) {
  return {
    userId,
    ...completeTaskReward()
  };
}
