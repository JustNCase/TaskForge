import { supabase } from '../lib/supabase';

export type ActivityEvent = {
  id: string;
  userId: string;
  event: string;
  metadata: Record<string, unknown>;
  timestamp: string;
};

export async function trackActivity(
  userId: string,
  event: string,
  metadata: Record<string, unknown> = {}
): Promise<ActivityEvent> {
  const { data, error } = await supabase
    .from('analytics_events')
    .insert({ user_id: userId, event, metadata })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    event: data.event,
    metadata: data.metadata,
    timestamp: data.created_at,
  };
}

export async function getUserActivity(userId: string) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return {
    userId,
    events: (data || []).map((e: any) => ({
      id: e.id,
      event: e.event,
      metadata: e.metadata,
      timestamp: e.created_at,
    })),
  };
}
