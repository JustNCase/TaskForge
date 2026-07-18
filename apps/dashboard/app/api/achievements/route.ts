import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const requirementMap: Record<string, { type: string; value: number }> = {
  'first-task': { type: 'tasks_completed', value: 1 },
  'task-master': { type: 'tasks_completed', value: 50 },
  'level-5': { type: 'level_reached', value: 5 },
  'level-10': { type: 'level_reached', value: 10 },
  'shopper': { type: 'purchases_made', value: 1 },
  'streak-7': { type: 'streak_days', value: 7 },
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: allAchievements } = await supabase.from('achievements').select('*').order('id');

    const unlocked = new Set((data || []).map((ua: any) => ua.achievement_id));

    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true);

    const { data: economy } = await supabase
      .from('economy')
      .select('level')
      .eq('user_id', user.id)
      .single();

    const { count: purchases } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const currentLevel = economy?.level || 1;

    function getProgress(achId: string): { current: number; target: number } {
      const req = requirementMap[achId];
      if (!req) return { current: 0, target: 1 };
      switch (req.type) {
        case 'tasks_completed': return { current: completedTasks || 0, target: req.value };
        case 'level_reached': return { current: currentLevel, target: req.value };
        case 'purchases_made': return { current: purchases || 0, target: req.value };
        default: return { current: 0, target: req.value };
      }
    }

    const result = (allAchievements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlocked: unlocked.has(a.id),
      progress: getProgress(a.id),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
