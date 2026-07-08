export type UserProfile = {
  id: string;
  email?: string;
  level: number;
  xp: number;
};

export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch('/api/profile');

  if (!response.ok) {
    throw new Error('Unable to load profile');
  }

  return response.json();
}
