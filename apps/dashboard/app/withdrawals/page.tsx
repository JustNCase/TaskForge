'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Wallet = {
  balance: number
}

type Withdrawal = {
  id: string
  amount: number
  method: string
  status: string
  created_at: string
  processed_at: string | null
}

const MIN_WITHDRAWAL = 1000

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }
}

export default function WithdrawalsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank_transfer')
  const [accountDetails, setAccountDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch('/api/wallet').then(r => r.json()),
      fetch('/api/withdrawals').then(r => r.json()),
    ]).then(([walletData, wData]) => {
      setWallet(walletData.wallet)
      setWithdrawals(wData.withdrawals || [])
    }).catch(console.error).finally(() => setIsLoading(false))
  }, [user])

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const amountCents = Math.round(parseFloat(amount) * 100)
    if (isNaN(amountCents) || amountCents < MIN_WITHDRAWAL) {
      alert(`Minimum withdrawal is ${formatCents(MIN_WITHDRAWAL)}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountCents,
          method,
          account_details: accountDetails ? JSON.parse(accountDetails) : {},
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowForm(false)
        setAmount('')
        setAccountDetails('')
        const refreshed = await fetch('/api/wallet').then(r => r.json())
        setWallet(refreshed.wallet)
        const refreshedW = await fetch('/api/withdrawals').then(r => r.json())
        setWithdrawals(refreshedW.withdrawals || [])
      } else {
        alert(data.error || 'Failed to submit withdrawal')
      }
    } catch {
      alert('Failed to submit withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || isLoading) return <LoadingSkeleton rows={6} />
  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Withdrawals</h1>
        <Link href="/wallet" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Back to Wallet
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCents(wallet?.balance || 0)}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={!wallet || wallet.balance < MIN_WITHDRAWAL}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Withdrawal
          </button>
        </div>
        {wallet && wallet.balance < MIN_WITHDRAWAL && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Minimum withdrawal is {formatCents(MIN_WITHDRAWAL)}. You need {formatCents(MIN_WITHDRAWAL - wallet.balance)} more.
          </p>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Withdrawal Request</h2>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="10"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Details (JSON)</label>
              <textarea
                value={accountDetails}
                onChange={e => setAccountDetails(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                rows={3}
                placeholder='{"email": "you@paypal.com"}'
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Withdrawal History</h2>
        </div>
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No withdrawals yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {withdrawals.map(w => (
              <div key={w.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCents(w.amount)} — {w.method.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(w.status)}`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
