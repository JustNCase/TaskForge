import { describe, it, expect } from 'vitest'
import { plans } from '@/lib/plans'

describe('plans', () => {
  it('has pro and business plans', () => {
    expect(plans).toHaveLength(2)
    expect(plans[0].id).toBe('pro')
    expect(plans[1].id).toBe('business')
  })

  it('has valid stripe price IDs', () => {
    for (const plan of plans) {
      expect(plan.stripePriceId).toMatch(/^price_/)
    }
  })

  it('has prices in cents', () => {
    expect(plans[0].price).toBe(999)
    expect(plans[1].price).toBe(2999)
  })

  it('highlights business plan', () => {
    expect(plans[1].highlighted).toBe(true)
  })
})
