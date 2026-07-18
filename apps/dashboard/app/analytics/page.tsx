'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  if (isLoading) return <LoadingSkeleton rows={6} />
  if (!user) { router.push('/login'); return null }

  const catColors: Record<string, string> = {
    work: '#3B82F6', personal: '#10B981', income: '#F59E0B', repair: '#EF4444', general: '#8B5CF6', urgent: '#EC4899',
  }

  const maxCat = data?.categoryBuckets ? Math.max(...Object.values(data.categoryBuckets) as number[], 1) : 1
  const maxDiff = data?.difficultyBuckets ? Math.max(...Object.values(data.difficultyBuckets) as number[], 1) : 1

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.total || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600">{data?.completed || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
              <p className="text-3xl font-bold text-blue-600">{data?.completionRate || 0}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">XP Earned</p>
              <p className="text-3xl font-bold text-purple-600">{data?.xp || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Category Distribution</h2>
              {data?.categoryBuckets && Object.keys(data.categoryBuckets).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.categoryBuckets).map(([cat, count]) => {
                    const pct = (count as number) / maxCat * 100
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700 dark:text-gray-300">{cat}</span>
                          <span className="text-gray-500">{count as number}</span>
                        </div>
                        <svg width="100%" height="20" className="rounded-full overflow-hidden">
                          <rect width="100%" height="20" fill="#e5e7eb" className="dark:fill-gray-600" rx="10" />
                          <rect width={`${pct}%`} height="20" fill={catColors[cat] || '#8B5CF6'} rx="10" />
                        </svg>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No tasks yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Difficulty Distribution</h2>
              {data?.difficultyBuckets && Object.keys(data.difficultyBuckets).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.difficultyBuckets).sort(([a], [b]) => Number(a) - Number(b)).map(([level, count]) => {
                    const pct = (count as number) / maxDiff * 100
                    return (
                      <div key={level}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">Level {level}</span>
                          <span className="text-gray-500">{count as number}</span>
                        </div>
                        <svg width="100%" height="20" className="rounded-full overflow-hidden">
                          <rect width="100%" height="20" fill="#e5e7eb" className="dark:fill-gray-600" rx="10" />
                          <rect width={`${pct}%`} height="20" fill="#3B82F6" rx="10" />
                        </svg>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No tasks yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Event Activity</h2>
              {data?.eventsByType && Object.keys(data.eventsByType).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(data.eventsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{count as number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No events yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
              {data?.recentEvents && data.recentEvents.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.recentEvents.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <span className="text-gray-600 dark:text-gray-400">{e.event_type.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No recent activity.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
