import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [{ data: profile }, { data: economy }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('economy').select('*').eq('user_id', user.id).single(),
    ]);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      displayName: profile?.display_name || '',
      level: economy?.level || 1,
      xp: economy?.xp || 0,
      coins: economy?.coins || 0,
      createdAt: profile?.created_at || user.created_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
