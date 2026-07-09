'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const providers = [
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'google', label: 'Google', icon: '🔵' },
] as const

export default function OAuthButtons() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleOAuth(provider: string) {
    setLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {providers.map(p => (
        <button
          key={p.id}
          onClick={() => handleOAuth(p.id)}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <span>{p.icon}</span>
          {loading === p.id ? 'Redirecting...' : p.label}
        </button>
      ))}
    </div>
  )
}
