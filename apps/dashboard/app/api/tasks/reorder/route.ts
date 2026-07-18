import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskIds } = await request.json();
    if (!Array.isArray(taskIds)) {
      return NextResponse.json({ error: 'taskIds array required' }, { status: 400 });
    }

    for (let i = 0; i < taskIds.length; i++) {
      await supabase
        .from('tasks')
        .update({ sort_order: i })
        .eq('id', taskIds[i])
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
