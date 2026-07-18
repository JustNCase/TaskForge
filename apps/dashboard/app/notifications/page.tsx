'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Notification = {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (user) {
      fetch('/api/notifications').then(r => r.json()).then(setNotifications).catch(() => {})
    }
  }, [user])

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (isLoading) return <LoadingSkeleton rows={4} />

  if (!user) {
    router.push('/login')
    return null
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unread} unread · {notifications.length} total
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">🔔</div>
          <p>No notifications yet</p>
          <p className="text-sm mt-1">Complete tasks and earn rewards to see notifications here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`rounded-lg p-4 border cursor-pointer transition-colors ${
                n.read
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
              }`}
              onClick={() => markRead(n.id)}
            >
              <div className="flex justify-between">
                <h3 className={`text-sm font-medium ${n.read ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-200'}`}>
                  {n.title}
                </h3>
                <span className="text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
