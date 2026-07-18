'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type MarketplaceItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
}

export default function MarketplacePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/marketplace')
      .then(r => r.json())
      .then(setItems)
      .catch(() => setError('Failed to load marketplace'))
  }, [])

  async function handleBuy(itemId: string) {
    setBuying(itemId)
    setError('')
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setItems(prev => prev.filter(i => i.id !== itemId))
      }
    } catch {
      setError('Purchase failed')
    } finally {
      setBuying(null)
    }
  }

  if (isLoading) return <LoadingSkeleton rows={6} />

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
      <p className="text-gray-600 dark:text-gray-400">Spend your coins on boosts, cosmetics, and utilities.</p>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {item.category}
              </span>
              <span className="text-lg font-bold text-yellow-600">{item.price} 🪙</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{item.description}</p>
            <button
              onClick={() => handleBuy(item.id)}
              disabled={buying === item.id}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {buying === item.id ? 'Purchasing...' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && !error && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">No items available.</p>
      )}
    </div>
  )
}
