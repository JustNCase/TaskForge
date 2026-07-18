import { getStripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';

export type BillingStatus = 'active' | 'paused' | 'cancelled';

export async function updateBillingStatus(userId: string, status: BillingStatus) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .single();

  if (!sub?.stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  const stripe = getStripe();

  if (status === 'cancelled') {
    await stripe.subscriptions.cancel(sub.stripe_subscription_id);
  } else if (status === 'paused') {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      pause_collection: { behavior: 'void' },
    });
  } else {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      pause_collection: '',
    });
  }

  await supabase
    .from('subscriptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return { userId, status, updatedAt: new Date().toISOString() };
}
