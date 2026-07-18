import { createAITask } from '../lib/openaiTaskClient';

export type GeneratedTask = {
  title: string;
  description: string;
  difficulty: number;
  subtasks: { title: string; description: string }[];
};

export async function generateTask(prompt: string): Promise<GeneratedTask> {
  return createAITask({ prompt });
}
