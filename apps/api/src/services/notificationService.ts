export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
};

export async function createNotification(
  userId: string,
  title: string,
  message: string
): Promise<Notification> {
  return {
    id: crypto.randomUUID(),
    userId,
    title,
    message,
    read: false,
  };
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  return [];
}
