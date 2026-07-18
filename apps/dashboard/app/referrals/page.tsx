'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Referral = {
  id: string
  code: string
  status: string
  reward_granted: boolean
  created_at: string
  completed_at: string | null
}

type ReferralStats = {
  completed: number
  pending: number
  total: number
}

const REWARD_PER_REFERRAL = 500

export default function ReferralsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({ completed: 0, pending: 0, total: 0 })
  const [timesUsed, setTimesUsed] = useState(0)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/referrals')
      .then(r => r.json())
      .then(d => {
        setCode(d.code || '')
        setReferrals(d.referrals || [])
        setStats(d.stats || { completed: 0, pending: 0, total: 0 })
        setTimesUsed(d.timesUsed || 0)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [user])

  async function handleRedeem() {
    if (!redeemCode.trim()) return
    setRedeeming(true)
    try {
      const res = await fetch('/api/referrals/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Referral applied! You earned $${(data.reward / 100).toFixed(2)}`)
        setRedeemCode('')
        const refreshed = await fetch('/api/referrals').then(r => r.json())
        setReferrals(refreshed.referrals || [])
        setStats(refreshed.stats || stats)
        setTimesUsed(refreshed.timesUsed || timesUsed)
      } else {
        alert(data.error || 'Failed to redeem code')
      }
    } catch {
      alert('Failed to redeem code')
    } finally {
      setRedeeming(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (authLoading || isLoading) return <LoadingSkeleton rows={6} />
  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Referrals</h1>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Invite friends, earn rewards</h2>
        <p className="text-purple-100 mb-4">
          Share your referral code. When someone signs up, you both earn {formatCents(REWARD_PER_REFERRAL)}!
        </p>
        <div className="flex items-center gap-3">
          <code className="bg-white/20 px-4 py-2 rounded-lg text-lg font-mono">{code}</code>
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Earned from Referrals</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCents(stats.completed * REWARD_PER_REFERRAL)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Have a code?</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={e => setRedeemCode(e.target.value)}
            placeholder="Enter referral code (e.g. TF-ABC12345)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming || !redeemCode.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {redeeming ? 'Redeeming...' : 'Redeem'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Referrals</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No referrals yet. Share your code to start earning!
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {referrals.map(ref => (
              <div key={ref.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Code: {ref.code}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(ref.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ref.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {ref.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
