export type Reward = {
  xp: number;
  coins: number;
};

export function taskCompletionReward(): Reward {
  return {
    xp: 50,
    coins: 25,
  };
}
