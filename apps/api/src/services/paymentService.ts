import { getStripe } from '../lib/stripe';

export async function createPaymentIntent(plan: string, userId: string) {
  const stripe = getStripe();

  const priceMap: Record<string, number> = {
    pro: 999,
    business: 2999,
  };

  const amount = priceMap[plan];
  if (!amount) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { userId, plan },
  });

  return { clientSecret: paymentIntent.client_secret, status: paymentIntent.status };
}
