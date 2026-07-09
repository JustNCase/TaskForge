'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { useToast } from '@/components/Toast'

type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  difficulty: number
  category: string
  tags: string[]
  created_at: string
  sort_order: number
}

export default function TasksPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [difficulty, setDifficulty] = useState(1)
  const [breakdown, setBreakdown] = useState<string[]>([])
  const [breakingDown, setBreakingDown] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [achievementMsg, setAchievementMsg] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const confettiFired = useRef(false)
  const lastTaskId = useRef<string | null>(null)

  useEffect(() => {
    fetch('/api/subscription').then(r => r.json()).then(d => {
      const sub = d.subscription
      setIsPro(sub?.status === 'active' && (sub.plan_id === 'pro' || sub.plan_id === 'business'))
    }).catch(() => {})
  }, [user])

  const limit = 20

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filter !== 'all') params.set('status', filter)
      if (search.trim()) params.set('search', search.trim())
      if (tagFilter.trim()) params.set('tags', tagFilter.trim())
      const res = await fetch(`/api/tasks?${params}`)
      const json = await res.json()
      setTasks(json.tasks || json)
      setTotal(json.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, filter, search, tagFilter])

  useEffect(() => {
    if (!user) return
    fetchTasks()
  }, [user, fetchTasks])

  useEffect(() => {
    if (achievementMsg && !confettiFired.current) {
      confettiFired.current = true
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }
    if (!achievementMsg) confettiFired.current = false
  }, [achievementMsg])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description, category, difficulty }),
      })
      if (res.ok) {
        const created = await res.json()
        lastTaskId.current = created.id
        if (breakdown.length > 0) {
          for (const st of breakdown) {
            await fetch(`/api/tasks/${created.id}/subtasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: st }),
            })
          }
        }
        setTitle('')
        setDescription('')
        setCategory('general')
        setDifficulty(1)
        setBreakdown([])
        setShowForm(false)
        setPage(1)
        await fetchTasks()
      } else {
        const err = await res.json()
        toast(err.error || 'Failed to create task', 'error')
      }
    } catch {
      toast('Failed to create task', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBreakdown() {
    if (!title.trim()) return
    setBreakingDown(true)
    try {
      const res = await fetch('/api/tasks/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description, category }),
      })
      const json = await res.json()
      if (json.subtasks) setBreakdown(json.subtasks)
    } catch {
      toast('AI breakdown failed. Try creating manually.', 'error')
    } finally {
      setBreakingDown(false)
    }
  }

  async function completeTask(id: string) {
    const oldTasks = [...tasks]
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t))
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      if (!res.ok) {
        setTasks(oldTasks)
        const err = await res.json()
        toast(err.error || 'Failed to complete task', 'error')
      } else {
        const data = await res.json()
        if (data.achievementsUnlocked?.length > 0) {
          toast(`🎉 ${data.achievementsUnlocked.map((a: any) => a.title).join(', ')}`, 'success')
          setAchievementMsg(data.achievementsUnlocked.map((a: any) => a.title).join(', '))
        }
      }
    } catch {
      setTasks(oldTasks)
    }
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    const oldTasks = [...tasks]
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setTasks(oldTasks)
        toast('Failed to delete task', 'error')
      }
    } catch {
      setTasks(oldTasks)
    }
  }

  async function handleReorder(draggedId: string, targetId: string) {
    if (draggedId === targetId) return
    const taskIds = tasks.filter(t => !t.completed).map(t => t.id)
    const fromIdx = taskIds.indexOf(draggedId)
    const toIdx = taskIds.indexOf(targetId)
    taskIds.splice(fromIdx, 1)
    taskIds.splice(toIdx, 0, draggedId)
    setTasks(prev => {
      const updated = [...prev]
      const dragged = updated.find(t => t.id === draggedId)
      const target = updated.find(t => t.id === targetId)
      if (dragged && target) {
        const rest = updated.filter(t => t.id !== draggedId)
        const targetIdx = rest.findIndex(t => t.id === targetId)
        rest.splice(targetIdx, 0, dragged)
        return rest
      }
      return prev
    })
    await fetch('/api/tasks/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds }),
    }).catch(() => fetchTasks())
  }

  function handleDragStart(id: string) {
    setDragId(id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(targetId: string) {
    if (dragId) handleReorder(dragId, targetId)
    setDragId(null)
  }

  const totalPages = Math.ceil(total / limit)

  if (authLoading) return <LoadingSkeleton rows={4} />
  if (!user) { router.push('/login'); return null }

  const completed = tasks.filter(t => t.completed).length
  const pending = tasks.length - completed
  const avgDifficulty = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + t.difficulty, 0) / tasks.length * 10) / 10 : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create Task</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="income">Income</option>
                  <option value="repair">Repair</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Difficulty (1-10)</label>
                <input type="number" min={1} max={10} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create'}
              </button>
              {isPro ? (
                <button type="button" onClick={handleBreakdown} disabled={breakingDown || !title.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {breakingDown ? 'Thinking...' : '🤖 AI Breakdown'}
                </button>
              ) : (
                <Link href="/pricing" className="inline-flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm cursor-not-allowed">
                  🤖 AI Breakdown <span className="ml-1 text-xs">(Pro)</span>
                </Link>
              )}
            </div>

            {breakdown.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">Suggested subtasks:</p>
                <ol className="list-decimal list-inside space-y-1">
                  {breakdown.map((s, i) => (
                    <li key={i} className="text-sm text-purple-800 dark:text-purple-300">{s}</li>
                  ))}
                </ol>
              </div>
            )}
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-blue-600">{pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Difficulty</p>
          <p className="text-2xl font-bold text-purple-600">{avgDifficulty}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'completed'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search tasks..." className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <input value={tagFilter} onChange={e => { setTagFilter(e.target.value); setPage(1) }} placeholder="Filter by tag..." className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? <LoadingSkeleton rows={3} /> : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p>No tasks found</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Create your first task</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {tasks.map(task => (
              <div key={task.id} draggable={!task.completed}
                onDragStart={() => handleDragStart(task.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(task.id)}
                className={`flex items-center justify-between p-4 transition-colors ${dragId === task.id ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button onClick={() => !task.completed && completeTask(task.id)}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-500 hover:border-green-500'}`}>
                    {task.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <div className="min-w-0">
                    <Link href={`/tasks/${task.id}`} className={`text-sm font-medium truncate block hover:text-blue-600 dark:hover:text-blue-400 ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</Link>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{task.category}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">Difficulty: {task.difficulty}</span>
                    </div>
                    {task.tags?.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {task.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-xs text-purple-500 dark:text-purple-400">#{t}</span>
                        ))}
                        {task.tags.length > 3 && <span className="text-xs text-gray-400">+{task.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs text-gray-400">{new Date(task.created_at).toLocaleDateString()}</span>
                  <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-30 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-30 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
