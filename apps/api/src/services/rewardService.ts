import { supabase } from '../lib/supabase';

export type CompletionReward = {
  xp: number;
  coins: number;
};

export function completeTaskReward(): CompletionReward {
  return { xp: 50, coins: 25 };
}

export async function applyTaskReward(userId: string) {
  const base = completeTaskReward();

  const { data: economy, error: fetchError } = await supabase
    .from('economy')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const nextXp = economy.xp + base.xp;
  const level = Math.floor(nextXp / 100) + 1;

  const { error: updateError } = await supabase
    .from('economy')
    .update({
      xp: nextXp,
      coins: economy.coins + base.coins,
      level,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) throw new Error(updateError.message);

  return { userId, ...base, level };
}
