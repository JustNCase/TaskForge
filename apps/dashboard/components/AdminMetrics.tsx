'use client'

import { useState, useEffect } from 'react'

export default function AdminMetrics() {
  const [stats, setStats] = useState({ users: 0, revenue: 0, subscriptions: 0 })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/subscription')
        const data = await res.json()
        if (data.subscription?.status === 'active') {
          setStats(prev => ({
            ...prev,
            subscriptions: 1,
            revenue: data.subscription.plan_id === 'business' ? 29.99 : 9.99,
          }))
        }
      } catch {}
    }
    load()
  }, [])

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Admin Metrics</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Users</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">${stats.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.subscriptions}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Subscriptions</p>
        </div>
      </div>
    </section>
  )
}
