'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import ThemeToggle from './ThemeToggle'
import { logout } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export default function Nav() {
  const { user, isLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    fetch('/api/notifications').then(r => r.json()).then(setNotifications).catch(() => {})
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            TaskForge
          </Link>

          <button className="sm:hidden p-2 text-gray-600 dark:text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-6">
            {isLoading ? null : user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Dashboard</Link>
                <Link href="/tasks" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Tasks</Link>
                <Link href="/marketplace" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Marketplace</Link>
                <Link href="/achievements" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Achievements</Link>
                <Link href="/projects" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Projects</Link>
                <Link href="/profile" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Profile</Link>
                <Link href="/pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Pricing</Link>
                <Link href="/analytics" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Analytics</Link>
                <Link href="/settings" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Settings</Link>

                <ThemeToggle />

                <div className="relative" ref={notifRef}>
                  <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
                        <Link href="/notifications" className="text-xs text-blue-600 hover:text-blue-700" onClick={() => setNotifOpen(false)}>See all</Link>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No notifications yet</p>
                        ) : (
                          notifications.slice(0, 5).map(n => (
                            <div
                              key={n.id}
                              className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${n.read ? '' : 'bg-blue-50 dark:bg-blue-900/10'}`}
                              onClick={() => markRead(n.id)}
                            >
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => logout()} className="text-sm font-medium text-red-600 hover:text-red-700">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Pricing</Link>
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Sign In</Link>
                <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Get Started</Link>
              </>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2">
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link href="/tasks" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Tasks</Link>
                <Link href="/marketplace" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Marketplace</Link>
                <Link href="/achievements" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Achievements</Link>
                <Link href="/notifications" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Notifications {unread > 0 ? `(${unread})` : ''}</Link>
                <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Profile</Link>
                <Link href="/pricing" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Pricing</Link>
                <button onClick={() => { setMenuOpen(false); logout(); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Pricing</Link>
                <Link href="/login" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link href="/signup" className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
