import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email?.toLowerCase() || '';
    if (!email.endsWith('@taskforge.ai') && !email.endsWith('@admin.com')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [{ count: users }, { count: tasks }, { count: purchases }, { count: subscriptions }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('purchases').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const { data: recentActivity } = await supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      stats: {
        totalUsers: users || 0,
        totalTasks: tasks || 0,
        totalPurchases: purchases || 0,
        activeSubscriptions: subscriptions || 0,
      },
      recentActivity: recentActivity || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
