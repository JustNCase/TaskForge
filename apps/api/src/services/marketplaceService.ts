import { supabase } from '../lib/supabase';

export type MarketplaceItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
};

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  const { data, error } = await supabase
    .from('marketplace_items')
    .select('*')
    .order('price');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getUserPurchases(userId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, marketplace_items(*)')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function buyItem(userId: string, itemId: string) {
  const { data: item, error: itemError } = await supabase
    .from('marketplace_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError || !item) throw new Error('Item not found');
  if (item.price <= 0) throw new Error('Invalid item price');

  const { data: economy, error: econError } = await supabase
    .from('economy')
    .select('coins')
    .eq('user_id', userId)
    .single();

  if (econError || !economy) throw new Error('Economy record not found');
  if (economy.coins < item.price) throw new Error('Insufficient coins');

  const { data: purchase, error: buyError } = await supabase
    .from('purchases')
    .insert({ user_id: userId, item_id: itemId })
    .select()
    .single();

  if (buyError) throw new Error(buyError.message);

  const { error: deductError } = await supabase
    .from('economy')
    .update({ coins: economy.coins - item.price })
    .eq('user_id', userId);

  if (deductError) throw new Error(deductError.message);

  return { purchase, coinsRemaining: economy.coins - item.price };
}
