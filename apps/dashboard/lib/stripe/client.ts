import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'

let stripePromise: Promise<StripeJS | null> | null = null

export function getStripeClient(): Promise<StripeJS | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}
