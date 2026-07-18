'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Event = {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  all_day: boolean
  color: string
  job_id: string | null
  jobs?: { title: string; status: string; clients?: { name: string } | null } | null
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function CalendarPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    fetch(`/api/schedule?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [user, year, month])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !startTime || !endTime) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description, start_time: startTime, end_time: endTime, color }),
      })
      if (res.ok) {
        const d = await res.json()
        setEvents(prev => [...prev, d.event].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()))
        setShowForm(false)
        setTitle('')
        setDescription('')
        setStartTime('')
        setEndTime('')
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  async function deleteEvent(id: string) {
    try {
      await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
      setEvents(prev => prev.filter(ev => ev.id !== id))
    } catch { /* ignore */ }
  }

  if (authLoading || isLoading) return <LoadingSkeleton rows={6} />
  if (!user) return null

  const eventsByDate: Record<string, Event[]> = {}
  events.forEach(ev => {
    const dateKey = formatDate(new Date(ev.start_time))
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = []
    eventsByDate[dateKey].push(ev)
  })

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          New Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
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

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">←</button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">→</button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white dark:bg-gray-800 min-h-[80px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = formatDate(new Date(year, month, day))
            const dayEvents = eventsByDate[dateKey] || []
            const isSelected = selectedDate === dateKey
            const isToday = dateKey === formatDate(new Date())

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateKey)}
                className={`bg-white dark:bg-gray-800 min-h-[80px] p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-xs font-medium p-1 ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day}
                </div>
                <div className="space-y-0.5 mt-1">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className="text-xs px-1 py-0.5 rounded truncate text-white" style={{ backgroundColor: ev.color }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Events on {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No events on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg" style={{ borderLeft: `4px solid ${ev.color}` }}>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ev.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(ev.start_time).toLocaleTimeString()} – {new Date(ev.end_time).toLocaleTimeString()}
                    </p>
                    {ev.jobs && <p className="text-xs text-blue-500">Linked: {ev.jobs.title}</p>}
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} className="text-xs text-red-600 hover:text-red-700">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
