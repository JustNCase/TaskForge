'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

export default function BillingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        const res = await fetch('/api/subscription')
        const data = await res.json()
        setSubscription(data.subscription)
      } catch {
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.assign(data.url)
    } catch (err) {
      console.error(err)
    }
    setPortalLoading(false)
  }

  if (isLoading) return <LoadingSkeleton rows={3} />
  if (!user) { router.push('/login'); return null }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing</h1>

      {loading ? <LoadingSkeleton rows={2} /> : subscription ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{subscription.plan_id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              subscription.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              subscription.status === 'past_due' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {subscription.status?.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Period Start</p>
              <p className="text-gray-900 dark:text-white">{new Date(subscription.current_period_start).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Period End</p>
              <p className="text-gray-900 dark:text-white">{new Date(subscription.current_period_end).toLocaleDateString()}</p>
            </div>
          </div>
          {subscription.cancel_at_period_end && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              Your subscription will cancel at the end of the current billing period.
            </div>
          )}
          <button onClick={openPortal} disabled={portalLoading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {portalLoading ? 'Opening...' : 'Manage in Stripe'}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No active subscription.</p>
          <Link href="/pricing" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Plans</Link>
        </div>
      )}
    </div>
  )
}
