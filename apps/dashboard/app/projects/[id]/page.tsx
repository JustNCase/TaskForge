'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Member = {
  id: string
  user_id: string
  role: string
  email?: string
}

type Task = {
  id: string
  title: string
  completed: boolean
  difficulty: number
  created_at: string
}

export default function ProjectDetailPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(d => { setProject(d.project); setMembers(d.members); setTasks(d.tasks); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user, id])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await fetch(`/api/projects/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      setInviteEmail('')
    } finally { setInviting(false) }
  }

  if (authLoading) return <LoadingSkeleton rows={3} />
  if (!user) { router.push('/login'); return null }

  if (loading) return <LoadingSkeleton rows={4} />
  if (!project) return <div className="text-center py-16 text-gray-500">Project not found</div>

  const isAdmin = members.some(m => m.user_id === user.id && (m.role === 'owner' || m.role === 'admin'))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/projects" className="hover:text-blue-600">Projects</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{project.name}</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
        {project.description && <p className="mt-2 text-gray-600 dark:text-gray-400">{project.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Members ({members.length})</h2>
          <div className="space-y-2 mb-4">
            {members.map(m => (
              <div key={m.id} className="flex justify-between text-sm p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span className="text-gray-900 dark:text-white">{m.email || m.user_id.slice(0, 8)}</span>
                <span className="text-gray-500 capitalize">{m.role}</span>
              </div>
            ))}
          </div>
          {isAdmin && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email to invite" type="email"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              <button type="submit" disabled={inviting || !inviteEmail.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                {inviting ? '...' : 'Invite'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned to this project.</p>
          ) : (
            <div className="space-y-1">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${t.completed ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <Link href={`/tasks/${t.id}`} className={`text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {t.title}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-400">Diff: {t.difficulty}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
