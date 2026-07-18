import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('withdrawals')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ withdrawals: data || [], total: count || 0, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, method, account_details } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!['bank_transfer', 'paypal', 'stripe'].includes(method)) {
      return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 })
    }

    if (amount < 1000) {
      return NextResponse.json({ error: 'Minimum withdrawal is $10.00' }, { status: 400 })
    }

    const { data: wallet } = await supabase
      .from('wallet')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        method,
        account_details: account_details || {},
        status: 'pending',
      })
      .select()
      .single()

    if (withdrawalError) throw withdrawalError

    await supabase
      .from('wallet')
      .update({
        balance: wallet.balance - amount,
        total_withdrawn: wallet.total_withdrawn + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: -amount,
        type: 'withdrawal',
        description: `Withdrawal via ${method.replace('_', ' ')}`,
        reference_id: withdrawal.id,
      })

    return NextResponse.json({ withdrawal }, { status: 201 })
  } catch (error: any) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
