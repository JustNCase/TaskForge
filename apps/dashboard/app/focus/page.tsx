'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PomodoroTimer from '@/components/PomodoroTimer'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Task = {
  id: string
  title: string
  completed: boolean
  difficulty: number
}

export default function FocusPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/tasks?limit=100')
      .then(r => r.json())
      .then(json => setTasks((json.tasks || json).filter((t: Task) => !t.completed)))
      .catch(() => {})
  }, [user])

  if (isLoading) return <LoadingSkeleton rows={3} />
  if (!user) { router.push('/login'); return null }

  const activeTask = tasks.find(t => t.id === activeTaskId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Focus Mode</h1>

      <PomodoroTimer onComplete={() => {
        if (activeTaskId) {
          fetch(`/api/tasks/${activeTaskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true }),
          })
          setTasks(prev => prev.filter(t => t.id !== activeTaskId))
          setActiveTaskId(null)
        }
      }} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Focus Task</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No pending tasks. <Link href="/tasks" className="text-blue-600 hover:underline">Create one</Link></p>
        ) : (
          <div className="space-y-1">
            {tasks.map(t => (
              <button key={t.id} onClick={() => setActiveTaskId(t.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${activeTaskId === t.id ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'}`}>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</span>
                <span className="text-xs text-gray-400 ml-2">Diff: {t.difficulty}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
