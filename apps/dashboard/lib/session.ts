export type UserSession = {
  id: string;
  email?: string;
};

export function getSessionUser() {
  return null as UserSession | null;
}
