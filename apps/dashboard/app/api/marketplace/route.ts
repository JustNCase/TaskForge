import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('marketplace_items').select('*').order('price');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

    const { data: item } = await supabase.from('marketplace_items').select('price').eq('id', itemId).single();
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const { data: economy } = await supabase.from('economy').select('coins').eq('user_id', user.id).single();
    if (!economy || economy.coins < item.price) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    const { error: buyError } = await supabase.from('purchases').insert({ user_id: user.id, item_id: itemId });
    if (buyError) return NextResponse.json({ error: buyError.message }, { status: 500 });

    await supabase.from('economy').update({ coins: economy.coins - item.price }).eq('user_id', user.id);

    return NextResponse.json({ success: true, coinsRemaining: economy.coins - item.price });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
