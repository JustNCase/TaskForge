import { supabase } from '../lib/supabase';

export type TaskInput = {
  userId: string;
  title: string;
  description?: string;
  difficulty?: number;
  reward?: number;
  subtasks?: { title: string; description: string }[];
};

export async function createTask(input: TaskInput) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: input.userId,
      title: input.title,
      description: input.description || '',
      difficulty: input.difficulty ?? 1,
      reward: input.reward ?? 10,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (input.subtasks?.length) {
    const subtaskInserts = input.subtasks.map((st) => ({
      task_id: data.id,
      user_id: input.userId,
      title: st.title,
      description: st.description,
    }));

    const { error: subError } = await supabase
      .from('subtasks')
      .insert(subtaskInserts);

    if (subError) throw new Error(subError.message);
  }

  return data;
}

export async function getUserTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  return data;
}
