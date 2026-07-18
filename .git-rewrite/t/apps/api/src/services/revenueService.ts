export type RevenuePlan = {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
};

export const revenuePlans: RevenuePlan[] = [
  {
    id: 'pro',
    name: 'TaskForge Pro',
    price: 9.99,
    interval: 'monthly',
  },
  {
    id: 'business',
    name: 'TaskForge Business',
    price: 29.99,
    interval: 'monthly',
  },
];

export function getRevenuePlans() {
  return revenuePlans;
}
