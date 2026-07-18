import { getStripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';

export type Subscription = {
  userId: string;
  plan: string;
  status: string;
};

export async function createSubscription(userId: string, plan: string, paymentMethodId?: string): Promise<Subscription> {
  const stripe = getStripe();

  const priceMap: Record<string, string> = {
    pro: 'price_1TrHmVRymzAPScN27paCA2kG',
    business: 'price_1TrHmVRymzAPScN2jnYfBiou',
  };

  const priceId = priceMap[plan];
  if (!priceId) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const customer = await stripe.customers.create({ metadata: { userId } });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    ...(paymentMethodId ? { default_payment_method: paymentMethodId } : {}),
    metadata: { userId, plan },
  });

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customer.id,
    plan_id: plan,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  return { userId, plan, status: subscription.status };
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return null;

  return {
    userId: data.user_id,
    plan: data.plan_id,
    status: data.status,
  };
}
