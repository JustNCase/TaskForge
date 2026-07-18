'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch('/api/admin')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  if (isLoading) return <LoadingSkeleton rows={4} />
  if (!user) { router.push('/login'); return null }

  if (data?.error === 'Forbidden') {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Admin access only.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      {loading ? <LoadingSkeleton rows={3} /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats?.totalTasks || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Purchases</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats?.totalPurchases || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Subs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats?.activeSubscriptions || 0}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
            {data?.recentActivity?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No activity yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data?.recentActivity?.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{e.event_type}</span>
                    <span>{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
