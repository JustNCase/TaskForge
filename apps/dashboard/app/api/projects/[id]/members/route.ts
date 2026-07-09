import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { email, role } = await request.json();

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const { data: invitedUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (!invitedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { error } = await supabase.from('project_members').insert({
      project_id: id,
      user_id: invitedUser.id,
      role: role || 'member',
      invited_by: user.id,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
