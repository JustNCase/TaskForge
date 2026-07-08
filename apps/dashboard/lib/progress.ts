export type Progress = {
  xp: number;
  coins: number;
  level: number;
};

export async function getProgress(): Promise<Progress> {
  const response = await fetch('/api/progress');

  if (!response.ok) {
    throw new Error('Unable to load progress');
  }

  return response.json();
}
