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

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: members } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', id);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ project, members: members || [], tasks: tasks || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
