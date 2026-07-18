import { describe, it, expect } from 'vitest'
import { taskCompletionReward } from '@/lib/rewards'

describe('rewards', () => {
  it('returns xp and coins for task completion', () => {
    const reward = taskCompletionReward()
    expect(reward).toEqual({ xp: 50, coins: 25 })
  })
})
