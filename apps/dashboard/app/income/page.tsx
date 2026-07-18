'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  difficulty: number
  created_at: string
}

export default function IncomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch('/api/tasks?category=income&limit=100')
      .then(r => r.json())
      .then(json => { setTasks(json.tasks || json); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [user])

  async function completeTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t))
    }
  }

  if (authLoading) return <LoadingSkeleton rows={3} />

  if (!user) { router.push('/login'); return null }

  const completed = tasks.filter(t => t.completed).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Income Tasks</h1>
        <Link href="/tasks" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
          New Task
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg"><span className="text-2xl">💰</span></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg"><span className="text-2xl">✅</span></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg"><span className="text-2xl">⏳</span></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length - completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Income Tasks</h2>
        {isLoading ? <LoadingSkeleton rows={1} /> : tasks.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">No income tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                  </p>
                  {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                </div>
                {!task.completed && (
                  <button onClick={() => completeTask(task.id)} className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
