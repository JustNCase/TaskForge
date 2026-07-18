import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    if (body.completed === true) {
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      if (task.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 });

      const difficulty = task.difficulty || 1;
      const xpGain = difficulty * 25;
      const coinGain = difficulty * 10;

      const { data: updated, error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const { data: economy } = await supabase
        .from('economy')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const newXp = (economy?.xp || 0) + xpGain;
      const newCoins = (economy?.coins || 0) + coinGain;
      const newLevel = Math.floor(newXp / 100) + 1;

      await supabase.from('economy').upsert({
        user_id: user.id,
        xp: newXp,
        coins: newCoins,
        level: newLevel,
      });

      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_type: 'task_completed',
        metadata: { task_id: id, difficulty, xp_gained: xpGain, coins_gained: coinGain },
      });

      const requirementMap: Record<string, { type: string; value: number }> = {
        'first-task': { type: 'tasks_completed', value: 1 },
        'task-master': { type: 'tasks_completed', value: 50 },
        'level-5': { type: 'level_reached', value: 5 },
        'level-10': { type: 'level_reached', value: 10 },
        'shopper': { type: 'purchases_made', value: 1 },
        'streak-7': { type: 'streak_days', value: 7 },
      };

      const { data: allAchievements } = await supabase.from('achievements').select('*');
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      const unlocked = new Set((userAchievements || []).map((ua: any) => ua.achievement_id));
      const newlyUnlocked: any[] = [];

      for (const ach of allAchievements || []) {
        if (unlocked.has(ach.id)) continue;
        const req = requirementMap[ach.id];
        if (!req) continue;
        let met = false;
        if (req.type === 'tasks_completed') {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('completed', true);
          met = (count || 0) >= req.value;
        } else if (req.type === 'level_reached') {
          met = newLevel >= req.value;
        }
        if (met) {
          newlyUnlocked.push(ach);
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: ach.id,
          });
        }
      }

      const notifTitle = newlyUnlocked.length > 0
        ? `Achievement${newlyUnlocked.length > 1 ? 's' : ''} Unlocked!`
        : 'Task Completed';
      const notifMessage = newlyUnlocked.length > 0
        ? `You earned ${xpGain} XP and ${coinGain} coins, and unlocked: ${newlyUnlocked.map((a: any) => a.title).join(', ')}`
        : `You earned ${xpGain} XP and ${coinGain} coins for completing "${task.title}"`;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: notifTitle,
        message: notifMessage,
      });

      return NextResponse.json({
        ...updated,
        xpGained: xpGain,
        coinGained: coinGain,
        newLevel,
        newXp,
        newCoins,
        achievementsUnlocked: newlyUnlocked.map((a: any) => ({ id: a.id, title: a.title, icon: a.icon })),
      });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
