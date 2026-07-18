'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  difficulty: number
  category: string
  tags: string[]
  created_at: string
}

type Subtask = {
  id: string
  task_id: string
  title: string
  description: string
  completed: boolean
  created_at: string
}

export default function TaskDetailPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [difficulty, setDifficulty] = useState(1)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newSubtask, setNewSubtask] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, subtasksRes] = await Promise.all([
          fetch(`/api/tasks/${id}`),
          fetch(`/api/tasks/${id}/subtasks`),
        ])
        const taskData = await taskRes.json()
        const subtasksData = await subtasksRes.json()
        setTask(taskData)
        setSubtasks(subtasksData)
        setTitle(taskData.title)
        setDescription(taskData.description || '')
        setCategory(taskData.category)
        setDifficulty(taskData.difficulty)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!t || (task?.tags || []).includes(t)) { setTagInput(''); return }
    const newTags = [...(task?.tags || []), t]
    setTask(prev => prev ? { ...prev, tags: newTags } : prev)
    setTagInput('')
    saveTags(newTags)
  }

  function removeTag(tag: string) {
    const newTags = (task?.tags || []).filter(t => t !== tag)
    setTask(prev => prev ? { ...prev, tags: newTags } : prev)
    saveTags(newTags)
  }

  async function saveTags(tags: string[]) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description, category, difficulty, tags: task?.tags || [] }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTask(updated)
        setEditing(false)
      }
    } catch {} finally {
      setSaving(false)
    }
  }

  async function addSubtask() {
    if (!newSubtask.trim()) return
    setAddingSubtask(true)
    try {
      const res = await fetch(`/api/tasks/${id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask.trim() }),
      })
      if (res.ok) {
        const created = await res.json()
        setSubtasks(prev => [...prev, created])
        setNewSubtask('')
      }
    } catch {} finally {
      setAddingSubtask(false)
    }
  }

  async function toggleSubtask(subtask: Subtask) {
    setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s))
    try {
      await fetch(`/api/tasks/${id}/subtasks/${subtask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed }),
      })
    } catch {
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, completed: subtask.completed } : s))
    }
  }

  async function deleteSubtask(subtaskId: string) {
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId))
    try {
      await fetch(`/api/tasks/${id}/subtasks/${subtaskId}`, { method: 'DELETE' })
    } catch {
      load()
    }
  }

  async function load() {
    const [taskRes, subtasksRes] = await Promise.all([
      fetch(`/api/tasks/${id}`),
      fetch(`/api/tasks/${id}/subtasks`),
    ])
    setTask(await taskRes.json())
    setSubtasks(await subtasksRes.json())
  }

  if (authLoading) return <LoadingSkeleton rows={4} />
  if (!user) { router.push('/login'); return null }

  if (loading) return <LoadingSkeleton rows={4} />
  if (!task) return <div className="text-center py-16 text-gray-500 dark:text-gray-400">Task not found</div>

  const doneSubtasks = subtasks.filter(s => s.completed).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/tasks" className="hover:text-blue-600">Tasks</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white truncate">{task.title}</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
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
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Difficulty (1-10)</label>
                <input type="number" min={1} max={10} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => { setEditing(false); setTitle(task.title); setDescription(task.description); setCategory(task.category); setDifficulty(task.difficulty) }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className={`text-2xl font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {task.title}
                </h1>
                {task.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{task.description}</p>
                )}
              </div>
              <button onClick={() => setEditing(true)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <div className="flex gap-3 mt-4 text-sm">
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize">{task.category}</span>
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Difficulty: {task.difficulty}</span>
              {task.completed && <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Completed</span>}
            </div>
            {(task.tags?.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {task.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..." className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs max-w-[200px]" />
              <button onClick={addTag} disabled={!tagInput.trim()} className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50">+</button>
            </div>
            <p className="mt-4 text-xs text-gray-400">Created {new Date(task.created_at).toLocaleString()}</p>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subtasks</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{doneSubtasks}/{subtasks.length}</span>
        </div>

        <div className="flex gap-2 mb-4">
          <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
            placeholder="Add a subtask..." className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
          <button onClick={addSubtask} disabled={addingSubtask || !newSubtask.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            {addingSubtask ? 'Adding...' : 'Add'}
          </button>
        </div>

        {subtasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No subtasks yet</p>
        ) : (
          <div className="space-y-1">
            {subtasks.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                <button onClick={() => toggleSubtask(s)}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${s.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-500 hover:border-green-500'}`}>
                  {s.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
                <span className={`flex-1 text-sm ${s.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {s.title}
                </span>
                <button onClick={() => deleteSubtask(s.id)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
