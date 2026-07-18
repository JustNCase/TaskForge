import { describe, it, expect } from 'vitest'

describe('economy', () => {
  it('loads test foundation', () => {
    expect(true).toBe(true)
  })

  it('can import economy lib utilities', async () => {
    const { taskCompletionReward } = await import('@/lib/rewards')
    const reward = taskCompletionReward()
    expect(reward).toHaveProperty('xp')
    expect(reward).toHaveProperty('coins')
  })
})
