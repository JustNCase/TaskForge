import { supabase } from '../lib/supabase';

export function calculateLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export async function getProgress(userId: string) {
  const { data, error } = await supabase.from('economy').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data;
}

export async function addReward(userId: string, xp: number, coins: number) {
  const current = await getProgress(userId);
  const nextXp = current.xp + xp;
  const { data, error } = await supabase.from('economy').update({
    xp: nextXp,
    coins: current.coins + coins,
    level: calculateLevel(nextXp),
    updated_at: new Date().toISOString()
  }).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}
