import { supabase } from '../lib/supabase';

export type HealthStatus = {
  service: string;
  status: 'healthy' | 'degraded';
  checkedAt: string;
};

export async function getHealthStatus(): Promise<HealthStatus[]> {
  const now = new Date().toISOString();
  const results: HealthStatus[] = [];

  // Supabase
  try {
    const { error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    results.push({
      service: 'Supabase',
      status: error ? 'degraded' : 'healthy',
      checkedAt: now,
    });
  } catch {
    results.push({ service: 'Supabase', status: 'degraded', checkedAt: now });
  }

  // Stripe
  try {
    const { default: Stripe } = await import('stripe');
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      const stripe = new Stripe(key, { apiVersion: '2025-02-24' });
      await stripe.balance.retrieve();
      results.push({ service: 'Stripe', status: 'healthy', checkedAt: now });
    } else {
      results.push({ service: 'Stripe', status: 'degraded', checkedAt: now });
    }
  } catch {
    results.push({ service: 'Stripe', status: 'degraded', checkedAt: now });
  }

  // API
  results.push({ service: 'TaskForge API', status: 'healthy', checkedAt: now });

  return results;
}
