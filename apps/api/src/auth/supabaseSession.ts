export type SessionUser = {
  id: string;
  email?: string;
};

export async function getAuthenticatedUser(token?: string): Promise<SessionUser | null> {
  if (!token) return null;

  return {
    id: 'authenticated-user'
  };
}
