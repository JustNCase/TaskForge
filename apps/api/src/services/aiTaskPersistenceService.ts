import { createAITask } from '../lib/openaiTaskClient';
import { createTask } from './taskService';

export async function generateAndSaveTask(userId: string, prompt: string) {
  const generated = await createAITask({ prompt });

  return createTask({
    userId,
    title: generated.title,
    description: generated.description,
    difficulty: generated.difficulty,
    subtasks: generated.subtasks,
  });
}
