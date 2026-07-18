import { supabase } from '../lib/supabase';
import { addReward } from './economyService';
import { unlockAchievement } from './achievementService';
import { createNotification } from './notificationService';

export async function completeTask(userId: string, taskId: string) {
  const { data: task, error } = await supabase
    .from('tasks')
    .update({ completed: true })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!task) throw new Error('Task not found');

  const reward = await addReward(userId, 50, 25);

  const { count: completedCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true);

  if (completedCount === 1) {
    await unlockAchievement(userId, 'first-task').catch(() => {});
  }

  if (completedCount === 50) {
    await unlockAchievement(userId, 'task-master').catch(() => {});
  }

  await createNotification(userId, 'Task Completed', `"${task.title}" completed! +50 XP, +25 coins`).catch(() => {});

  return { taskId, completed: true, reward };
}
