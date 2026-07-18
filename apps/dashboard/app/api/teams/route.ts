import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: owned } = await supabase
      .from('teams')
      .select('*, team_members(*)')
      .eq('owner_id', user.id)

    const { data: memberOf } = await supabase
      .from('team_members')
      .select('*, teams(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    return NextResponse.json({
      owned: owned || [],
      memberOf: memberOf?.map(m => m.teams) || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, description } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Team name required' }, { status: 400 })

    const { data: team, error } = await supabase
      .from('teams')
      .insert({ owner_id: user.id, name: name.trim(), description: description || '' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ team }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
