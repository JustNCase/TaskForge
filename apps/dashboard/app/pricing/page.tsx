'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import type { Plan } from '@/lib/plans'

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  )
}

export default function PricingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => setPlans(d.plans))
  }, [])

  async function handleSubscribe(planId: string) {
    if (!user) {
      router.push('/signup')
      return
    }

    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.assign(data.url)
      } else {
        console.error('Checkout error:', data.error)
        setLoadingPlan(null)
      }
    } catch (err) {
      console.error('Checkout request failed:', err)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Simple Pricing for Contractors
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Start free for 14 days. No credit card required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border-2 p-8 ${
              plan.highlighted
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-xl'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                Most Popular
              </span>
            )}

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {plan.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {plan.description}
            </p>

            <div className="mt-6 mb-8">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                ${(plan.price / 100).toFixed(0)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loadingPlan === plan.id}
              className={`w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
                plan.highlighted
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50'
              }`}
            >
              {loadingPlan === plan.id ? 'Redirecting...' : 'Start Free Trial'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          All plans include: Mobile app · Unlimited clients · Email support · 14-day free trial
        </p>
      </div>
    </div>
  )
}
