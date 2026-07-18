import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ members: members || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { email, role, hourly_rate } = await request.json()

    if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', id)
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existing) return NextResponse.json({ error: 'Member already invited' }, { status: 400 })

    const { data: member, error } = await supabase
      .from('team_members')
      .insert({
        team_id: id,
        email: email.trim().toLowerCase(),
        role: role || 'member',
        hourly_rate: hourly_rate || 0,
        invited_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ member }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { member_id, ...updates } = await request.json()

    if (!member_id) return NextResponse.json({ error: 'Member ID required' }, { status: 400 })

    const { data: member, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', member_id)
      .eq('team_id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ member })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { member_id } = await request.json()

    if (!member_id) return NextResponse.json({ error: 'Member ID required' }, { status: 400 })

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', member_id)
      .eq('team_id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
