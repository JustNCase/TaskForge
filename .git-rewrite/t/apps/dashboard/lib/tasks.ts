export type Task = {
  id: string;
  title: string;
  status: string;
};

export async function getTasks(): Promise<Task[]> {
  return [];
}
