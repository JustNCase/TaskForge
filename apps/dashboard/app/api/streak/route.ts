import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: completions } = await supabase
      .from('tasks')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('created_at', { ascending: false });

    if (!completions || completions.length === 0) {
      return NextResponse.json({ currentStreak: 0, bestStreak: 0, todayCompleted: false });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = completions.map(c => {
      const d = new Date(c.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const uniqueDays = [...new Set(dates)].sort((a, b) => b - a);

    let currentStreak = 0;
    const todayMs = today.getTime();
    const dayMs = 86400000;

    if (uniqueDays[0] === todayMs || uniqueDays[0] === todayMs - dayMs) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        if (uniqueDays[i] === uniqueDays[i - 1] - dayMs) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    let bestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if (uniqueDays[i] === uniqueDays[i - 1] - dayMs) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    if (uniqueDays.length === 1) bestStreak = 1;

    const todayCompleted = uniqueDays[0] === todayMs;

    return NextResponse.json({ currentStreak, bestStreak, todayCompleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
