import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [{ data: tasks }, { data: economy }, { data: events }] = await Promise.all([
      supabase.from('tasks').select('completed, created_at, difficulty, category').eq('user_id', user.id),
      supabase.from('economy').select('xp, coins').eq('user_id', user.id).single(),
      supabase.from('analytics_events').select('event_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ]);

    const total = tasks?.length || 0;
    const completed = tasks?.filter(t => t.completed).length || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const difficultyBuckets: Record<string, number> = {};
    tasks?.forEach(t => {
      const key = String(t.difficulty || 1);
      difficultyBuckets[key] = (difficultyBuckets[key] || 0) + 1;
    });

    const categoryBuckets: Record<string, number> = {};
    tasks?.forEach(t => {
      const key = t.category || 'general';
      categoryBuckets[key] = (categoryBuckets[key] || 0) + 1;
    });

    const eventsByType: Record<string, number> = {};
    events?.forEach(e => {
      eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
    });

    return NextResponse.json({
      total,
      completed,
      completionRate,
      coins: economy?.coins || 0,
      xp: economy?.xp || 0,
      difficultyBuckets,
      categoryBuckets,
      eventsByType,
      recentEvents: events?.slice(0, 20) || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
