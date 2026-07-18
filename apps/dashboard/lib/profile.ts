import { createClient } from './supabase/server'

export async function ensureUserProfile(userId: string, email: string) {
  const supabase = await createClient()

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('id', userId)

  if (count === 0) {
    await supabase.from('profiles').insert({
      id: userId,
      display_name: email?.split('@')[0] || 'User',
    })

    await supabase.from('economy').upsert({
      user_id: userId,
      xp: 0,
      coins: 0,
      level: 1,
    })

    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'user_signed_up',
      metadata: { email },
    })
  }
}
