export type TaskInput = {
  userId: string;
  title: string;
  description?: string;
};

export async function createTask(input: TaskInput) {
  return {
    id: crypto.randomUUID(),
    ...input,
    status: 'pending'
  };
}

export async function getUserTasks(userId: string) {
  return [];
}
