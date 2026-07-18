'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Team = {
  id: string
  name: string
  description: string
  created_at: string
  team_members?: { id: string; status: string; role: string }[]
}

export default function TeamsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [owned, setOwned] = useState<Team[]>([])
  const [memberOf, setMemberOf] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/teams')
      .then(r => r.json())
      .then(d => { setOwned(d.owned || []); setMemberOf(d.memberOf || []) })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [user])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description }),
      })
      if (res.ok) {
        const d = await res.json()
        setOwned(prev => [...prev, { ...d.team, team_members: [] }])
        setShowForm(false)
        setName('')
        setDescription('')
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  if (authLoading || isLoading) return <LoadingSkeleton rows={6} />
  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teams</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Create Team
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancel
            </button>
          </div>
        </form>
      )}

      {owned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {owned.map(team => (
              <Link key={team.id} href={`/teams/${team.id}`} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                {team.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{team.description}</p>}
                <p className="text-xs text-gray-400 mt-3">{team.team_members?.length || 0} members</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {memberOf.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Member Of</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberOf.map(team => (
              <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                {team.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{team.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {owned.length === 0 && memberOf.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No teams yet</p>
          <p className="text-sm">Create a team to collaborate with employees.</p>
        </div>
      )}
    </div>
  )
}
