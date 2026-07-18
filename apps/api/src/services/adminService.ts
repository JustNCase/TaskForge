import { supabase } from '../lib/supabase';

export type AdminMetric = { name: string; value: number };

export async function getAdminMetrics(): Promise<AdminMetric[]> {
  const { count: users, error: uErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: tasks, error: tErr } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  const { count: purchases, error: pErr } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true });

  const { data: subData } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('status', 'active');

  const activeSubs = subData?.length || 0;

  if (uErr || tErr || pErr) {
    throw new Error('Failed to fetch admin metrics');
  }

  return [
    { name: 'users', value: users || 0 },
    { name: 'tasks', value: tasks || 0 },
    { name: 'purchases', value: purchases || 0 },
    { name: 'active_subscriptions', value: activeSubs },
  ];
}
