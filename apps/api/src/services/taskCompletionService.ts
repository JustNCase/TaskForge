import { addReward } from './economyService';

export async function completeTask(userId: string, taskId: string) {
  const reward = await addReward(userId, 50, 25);

  return {
    taskId,
    completed: true,
    reward
  };
}
