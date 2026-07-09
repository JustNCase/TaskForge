'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { useToast } from '@/components/Toast'

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    task_completed: true, achievement_unlocked: true, project_invite: true, mention: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setDisplayName(d.displayName || ''))
      .catch(() => {})
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(d => setPrefs(prev => ({ ...prev, ...d })))
      .catch(() => {})
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) toast('Settings saved!', 'success')
    else toast(data.error || 'Failed to save', 'error')
  }

  async function togglePref(key: string, value: boolean) {
    setPrefs(prev => ({ ...prev, [key]: value }))
    await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })
  }

  async function exportData(format: 'csv' | 'json') {
    const res = await fetch(`/api/settings/export?format=${format}`)
    if (!res.ok) { toast('Export failed', 'error'); return }
    const blob = format === 'csv' ? await res.blob() : new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taskforge-tasks.${format}`
    a.click()
    URL.revokeObjectURL(url)
    toast(`Exported as ${format.toUpperCase()}`, 'success')
  }

  if (isLoading) return <LoadingSkeleton rows={3} />
  if (!user) { router.push('/login'); return null }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input type="email" value={user.email || ''} disabled className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
        {Object.entries(prefs).map(([key, val]) => (
          <label key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
            <button onClick={() => togglePref(key, !val)}
              className={`w-10 h-5 rounded-full transition-colors ${val ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Export</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Download all your tasks for backup or migration.</p>
        <div className="flex gap-2">
          <button onClick={() => exportData('json')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">Export JSON</button>
          <button onClick={() => exportData('csv')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">Export CSV</button>
        </div>
      </div>
    </div>
  )
}
