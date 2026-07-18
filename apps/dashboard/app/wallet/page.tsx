'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Wallet = {
  id: string
  balance: number
  total_earned: number
  total_withdrawn: number
}

type Transaction = {
  id: string
  amount: number
  type: 'earn' | 'withdrawal' | 'refund' | 'bonus'
  description: string
  created_at: string
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function transactionColor(type: string): string {
  if (type === 'earn' || type === 'bonus' || type === 'refund') return 'text-green-600 dark:text-green-400'
  return 'text-red-600 dark:text-red-400'
}

function transactionIcon(type: string): string {
  if (type === 'earn') return '💰'
  if (type === 'bonus') return '🎁'
  if (type === 'refund') return '↩️'
  return '💸'
}

export default function WalletPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch('/api/wallet').then(r => r.json()),
      fetch('/api/wallet/transactions').then(r => r.json()),
    ]).then(([walletData, txData]) => {
      setWallet(walletData.wallet)
      setTransactions(txData.transactions || [])
    }).catch(console.error).finally(() => setIsLoading(false))
  }, [user])

  if (authLoading || isLoading) return <LoadingSkeleton rows={6} />
  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet</h1>
        <div className="flex gap-3">
          <Link href="/referrals" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            Referrals
          </Link>
          <Link href="/withdrawals" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            Withdraw
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCents(wallet?.balance || 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCents(wallet?.total_earned || 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawn</p>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{formatCents(wallet?.total_withdrawn || 0)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No transactions yet. Complete tasks or invite friends to earn rewards!
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{transactionIcon(tx.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${transactionColor(tx.type)}`}>
                  {tx.amount >= 0 ? '+' : ''}{formatCents(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
