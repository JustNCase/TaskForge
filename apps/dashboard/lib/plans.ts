export type PlanId = 'starter' | 'pro'

export type Plan = {
  id: PlanId
  name: string
  description: string
  price: number
  interval: 'month' | 'year'
  stripePriceId: string
  features: string[]
  highlighted?: boolean
}

export const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Everything a solo contractor needs to get organized',
    price: 4900,
    interval: 'month',
    stripePriceId: 'price_starter_monthly',
    features: [
      'Up to 50 jobs/month',
      'Client management',
      'Estimate & invoice creation',
      'Payment tracking',
      'Mobile app access',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing contractor businesses',
    price: 9900,
    interval: 'month',
    stripePriceId: 'price_pro_monthly',
    features: [
      'Unlimited jobs',
      'Everything in Starter',
      'Recurring invoices',
      'Revenue analytics & reports',
      'Team member access (up to 5)',
      'Priority support',
      'Custom branding on invoices',
    ],
    highlighted: true,
  },
]
