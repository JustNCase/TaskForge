'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: { current: number; target: number }
}

export default function AchievementsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    fetch('/api/achievements')
      .then(r => r.json())
      .then(setAchievements)
      .catch(() => {})
  }, [])

  if (isLoading) return <LoadingSkeleton rows={6} />

  if (!user) {
    router.push('/login')
    return null
  }

  const unlocked = achievements.filter(a => a.unlocked)
  const locked = achievements.filter(a => !a.unlocked)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
      <p className="text-gray-600 dark:text-gray-400">
        {unlocked.length} / {achievements.length} unlocked
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(a => {
          const pct = Math.min(100, Math.round((a.progress.current / a.progress.target) * 100))
          return (
            <div
              key={a.id}
              className={`rounded-lg p-5 border-2 ${
                a.unlocked
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-3xl mb-2">{a.icon || '🏆'}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{a.description}</p>

              {a.unlocked ? (
                <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                  Unlocked
                </span>
              ) : (
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {a.progress.current} / {a.progress.target}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
