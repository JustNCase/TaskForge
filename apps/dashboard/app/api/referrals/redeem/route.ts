import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const REFERRAL_REWARD_CENTS = 500

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const { data: referralCode } = await supabase
      .from('user_referral_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (!referralCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    if (referralCode.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referralCode.user_id)
      .eq('referred_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already referred by this user' }, { status: 400 })
    }

    const { error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referralCode.user_id,
        referred_id: user.id,
        code: code.trim().toUpperCase(),
        status: 'completed',
        reward_granted: true,
        completed_at: new Date().toISOString(),
      })

    if (referralError) throw referralError

    await supabase
      .from('user_referral_codes')
      .update({ times_used: referralCode.times_used + 1 })
      .eq('user_id', referralCode.user_id)

    let { data: wallet } = await supabase
      .from('wallet')
      .select('*')
      .eq('user_id', referralCode.user_id)
      .single()

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('wallet')
        .insert({ user_id: referralCode.user_id })
        .select()
        .single()
      wallet = newWallet
    }

    await supabase
      .from('wallet')
      .update({
        balance: (wallet?.balance || 0) + REFERRAL_REWARD_CENTS,
        total_earned: (wallet?.total_earned || 0) + REFERRAL_REWARD_CENTS,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', referralCode.user_id)

    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: referralCode.user_id,
        amount: REFERRAL_REWARD_CENTS,
        type: 'bonus',
        description: `Referral bonus for inviting a new user`,
      })

    return NextResponse.json({ success: true, reward: REFERRAL_REWARD_CENTS })
  } catch (error: any) {
    console.error('Referral redeem error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
