'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { logout } from '@/lib/actions/auth'
import EconomyWidget from '@/components/EconomyWidget'
import LevelProgress from '@/components/LevelProgress'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [economy, setEconomy] = useState({ level: 1, xp: 0, coins: 0 })

  useEffect(() => {
    if (user) {
      fetch('/api/economy')
        .then(r => r.json())
        .then(setEconomy)
        .catch(() => {})
    }
  }, [user])

  async function handleLogout() {
    await logout()
  }

  if (isLoading) return <LoadingSkeleton rows={4} />

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>

      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-200">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.email?.split('@')[0]}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EconomyWidget xp={economy.xp} coins={economy.coins} level={economy.level} />
        <LevelProgress level={economy.level} xp={economy.xp} />
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/marketplace" className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
            <span className="text-2xl">🛍️</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">Marketplace</p>
          </Link>
          <Link href="/achievements" className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 text-center hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
            <span className="text-2xl">🏆</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">Achievements</p>
          </Link>
          <Link href="/pricing" className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            <span className="text-2xl">💎</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">Upgrade</p>
          </Link>
          <Link href="/tasks" className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
            <span className="text-2xl">📋</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">Tasks</p>
          </Link>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
