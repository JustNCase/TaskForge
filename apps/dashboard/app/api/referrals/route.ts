import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'TF-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let { data: referralCode } = await supabase
      .from('user_referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!referralCode) {
      const code = generateCode()
      const { data: newCode } = await supabase
        .from('user_referral_codes')
        .insert({ user_id: user.id, code })
        .select()
        .single()
      referralCode = newCode
    }

    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    const completedCount = referrals?.filter(r => r.status === 'completed').length || 0
    const pendingCount = referrals?.filter(r => r.status === 'pending').length || 0

    return NextResponse.json({
      code: referralCode?.code,
      timesUsed: referralCode?.times_used || 0,
      referrals: referrals || [],
      stats: {
        completed: completedCount,
        pending: pendingCount,
        total: referrals?.length || 0,
      },
    })
  } catch (error) {
    console.error('Referrals fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
  }
}
