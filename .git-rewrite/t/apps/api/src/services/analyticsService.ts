export type ActivityEvent = {
  userId: string;
  event: string;
  timestamp: string;
};

export async function trackActivity(
  userId: string,
  event: string
): Promise<ActivityEvent> {
  return {
    userId,
    event,
    timestamp: new Date().toISOString(),
  };
}

export async function getUserActivity(userId: string) {
  return {
    userId,
    events: [],
  };
}
