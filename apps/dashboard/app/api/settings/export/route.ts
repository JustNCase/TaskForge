import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const format = new URL(request.url).searchParams.get('format') || 'json';

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (format === 'csv') {
      const headers = ['id', 'title', 'description', 'completed', 'difficulty', 'category', 'tags', 'created_at'];
      const rows = (tasks || []).map((t: any) =>
        headers.map(h => {
          const val = t[h];
          if (h === 'tags') return JSON.stringify(val || []);
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return val ?? '';
        }).join(',')
      );
      return new NextResponse([headers.join(','), ...rows].join('\n'), {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="taskforge-tasks.csv"' },
      });
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
