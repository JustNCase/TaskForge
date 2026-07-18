'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import ThemeToggle from './ThemeToggle'
import { logout } from '@/lib/actions/auth'

export default function Nav() {
  const { user, isLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

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
                <Link href="/jobs" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Jobs</Link>
                <Link href="/clients" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Clients</Link>
                <Link href="/calendar" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Calendar</Link>
                <Link href="/estimates" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Estimates</Link>
                <Link href="/invoices" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Invoices</Link>
                <Link href="/teams" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Teams</Link>
                <Link href="/wallet" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Wallet</Link>
                <Link href="/profile" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">Profile</Link>

                <ThemeToggle />

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
                <Link href="/jobs" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Jobs</Link>
                <Link href="/clients" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Clients</Link>
                <Link href="/calendar" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Calendar</Link>
                <Link href="/estimates" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Estimates</Link>
                <Link href="/invoices" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Invoices</Link>
                <Link href="/teams" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Teams</Link>
                <Link href="/wallet" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Wallet</Link>
                <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => setMenuOpen(false)}>Profile</Link>
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
