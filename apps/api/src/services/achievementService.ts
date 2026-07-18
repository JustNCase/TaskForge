import { supabase } from '../lib/supabase';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type UserAchievement = Achievement & {
  unlocked_at: string;
};

export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('id');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  return (data || []).map((ua: any) => ({
    id: ua.achievement_id,
    title: ua.achievements.title,
    description: ua.achievements.description,
    icon: ua.achievements.icon,
    unlocked_at: ua.unlocked_at,
  }));
}

export async function unlockAchievement(userId: string, achievementId: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .insert({ user_id: userId, achievement_id: achievementId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { userId, achievementId, unlocked: false, reason: 'already_unlocked' };
    }
    throw new Error(error.message);
  }

  return { userId, achievementId, unlocked: true };
}
