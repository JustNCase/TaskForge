import { getStripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';

export type RevenuePlan = {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
};

export const revenuePlans: RevenuePlan[] = [
  { id: 'pro', name: 'TaskForge Pro', price: 9.99, interval: 'monthly' },
  { id: 'business', name: 'TaskForge Business', price: 29.99, interval: 'monthly' },
];

export function getRevenuePlans(): RevenuePlan[] {
  return revenuePlans;
}

export async function getRevenueMetrics() {
  const stripe = getStripe();

  const [balance, subscriptions, payments] = await Promise.all([
    stripe.balance.retrieve(),
    stripe.subscriptions.list({ limit: 100 }),
    stripe.paymentIntents.list({ limit: 100 }),
  ]);

  const { count: activeSubs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return {
    balance: balance.available.map((b) => ({ amount: b.amount, currency: b.currency })),
    totalSubscriptions: subscriptions.data.length,
    activeSubscriptions: activeSubs || 0,
    recentPayments: payments.data.length,
    mrr: revenuePlans[0].price * (activeSubs || 0),
  };
}
