'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Team = {
  id: string
  name: string
  description: string
  owner_id: string
}

type Member = {
  id: string
  email: string
  role: string
  status: string
  hourly_rate: number
  created_at: string
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [hourlyRate, setHourlyRate] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch(`/api/teams/${id}`).then(r => r.json()),
      fetch(`/api/teams/${id}/members`).then(r => r.json()),
    ]).then(([teamData, memberData]) => {
      setTeam(teamData.team)
      setMembers(memberData.members || [])
    }).catch(console.error).finally(() => setIsLoading(false))
  }, [user, id])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    try {
      const res = await fetch(`/api/teams/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role, hourly_rate: hourlyRate ? parseInt(hourlyRate) * 100 : 0 }),
      })
      if (res.ok) {
        const d = await res.json()
        setMembers(prev => [...prev, d.member])
        setShowInvite(false)
        setEmail('')
        setHourlyRate('')
      }
    } catch { /* ignore */ }
    setInviting(false)
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member?')) return
    try {
      await fetch(`/api/teams/${id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      })
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch { /* ignore */ }
  }

  if (authLoading || isLoading) return <LoadingSkeleton rows={6} />
  if (!user || !team) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teams" className="text-blue-600 hover:text-blue-700">← Teams</Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
          {team.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{team.description}</p>}
        </div>
        <button onClick={() => setShowInvite(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          Invite Member
        </button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate ($)</label>
              <input type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0.00" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={inviting} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {inviting ? 'Inviting...' : 'Send Invite'}
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Members ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No members yet. Invite someone to get started.</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{m.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {m.role} · {m.hourly_rate > 0 ? `$${(m.hourly_rate / 100).toFixed(2)}/hr` : 'No rate set'} · {m.status}
                  </p>
                </div>
                <button onClick={() => removeMember(m.id)} className="text-xs text-red-600 hover:text-red-700">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
