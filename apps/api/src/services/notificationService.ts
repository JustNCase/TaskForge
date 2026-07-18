import { supabase } from '../lib/supabase';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export async function createNotification(
  userId: string,
  title: string,
  message: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function markAsRead(userId: string, notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
