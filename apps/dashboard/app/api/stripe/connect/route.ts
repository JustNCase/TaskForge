import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('stripe_connect')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existing?.onboarding_complete) {
      return NextResponse.json({ error: 'Already connected' }, { status: 400 })
    }

    const stripe = getStripe()

    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email || undefined,
      metadata: { userId: user.id },
    })

    await supabase
      .from('stripe_connect')
      .upsert({
        user_id: user.id,
        stripe_account_id: account.id,
        updated_at: new Date().toISOString(),
      })

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: connect } = await supabase
      .from('stripe_connect')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ connect: connect || null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
