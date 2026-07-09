'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function UpgradeCard() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(d => setSubscription(d.subscription))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  if (subscription?.status === 'active' || subscription?.status === 'trialing') {
    return (
      <section className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <h2 className="text-lg font-bold">{subscription.plan_id === 'business' ? 'Business' : 'Pro'} Plan</h2>
        <p className="text-sm opacity-90 mt-1">
          {subscription.cancel_at_period_end
            ? 'Cancels at end of billing period'
            : 'Active subscription'}
        </p>
        <Link
          href="/pricing"
          className="inline-block mt-4 text-sm bg-white/20 rounded-lg px-4 py-2 hover:bg-white/30 transition-colors"
        >
          Manage
        </Link>
      </section>
    )
  }

  return (
    <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
      <h2 className="text-lg font-bold">Upgrade TaskForge</h2>
      <p className="text-sm opacity-90 mt-1">Unlock AI-powered features and premium tools.</p>
      <Link
        href="/pricing"
        className="inline-block mt-4 text-sm bg-white/20 rounded-lg px-4 py-2 hover:bg-white/30 transition-colors"
      >
        View Plans
      </Link>
    </section>
  )
}
