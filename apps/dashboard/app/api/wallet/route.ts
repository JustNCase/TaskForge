import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let { data: wallet } = await supabase
      .from('wallet')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('wallet')
        .insert({ user_id: user.id })
        .select()
        .single()
      wallet = newWallet
    }

    return NextResponse.json({ wallet })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}
