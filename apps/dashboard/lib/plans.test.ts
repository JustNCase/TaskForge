import { describe, it, expect } from 'vitest'
import { plans } from '@/lib/plans'

describe('plans', () => {
  it('has starter and pro plans', () => {
    expect(plans).toHaveLength(2)
    expect(plans[0].id).toBe('starter')
    expect(plans[1].id).toBe('pro')
  })

  it('has valid stripe price IDs', () => {
    for (const plan of plans) {
      expect(plan.stripePriceId).toMatch(/^price_/)
    }
  })

  it('has prices in cents', () => {
    expect(plans[0].price).toBe(4900)
    expect(plans[1].price).toBe(9900)
  })

  it('highlights pro plan', () => {
    expect(plans[1].highlighted).toBe(true)
  })
})
