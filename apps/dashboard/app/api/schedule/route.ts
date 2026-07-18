import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const teamId = searchParams.get('team_id')

    let query = supabase
      .from('scheduled_events')
      .select('*, jobs(title, status, clients(name))')
      .or(`user_id.eq.${user.id},team_id.in.(select team_id from team_members where user_id = '${user.id}' and status = 'active')`)

    if (start) query = query.gte('start_time', start)
    if (end) query = query.lte('end_time', end)
    if (teamId) query = query.eq('team_id', teamId)

    const { data, error } = await query.order('start_time', { ascending: true })

    if (error) throw error
    return NextResponse.json({ events: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, start_time, end_time, all_day, color, job_id, team_id } = body

    if (!title?.trim() || !start_time || !end_time) {
      return NextResponse.json({ error: 'Title, start_time, and end_time required' }, { status: 400 })
    }

    const { data: event, error } = await supabase
      .from('scheduled_events')
      .insert({
        user_id: user.id,
        team_id: team_id || null,
        job_id: job_id || null,
        title: title.trim(),
        description: description || '',
        start_time,
        end_time,
        all_day: all_day || false,
        color: color || '#3B82F6',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ event }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })

    const { data: event, error } = await supabase
      .from('scheduled_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ event })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })

    const { error } = await supabase
      .from('scheduled_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
