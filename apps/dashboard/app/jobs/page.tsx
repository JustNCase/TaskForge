'use client'

import { useState, useEffect } from 'react'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Client = { id: string; name: string }

type Job = {
  id: string
  title: string
  description: string
  status: string
  job_type: string
  scheduled_date: string
  scheduled_time: string
  estimated_hours: number
  address: string
  amount: number
  client_id: string
  clients: { name: string } | null
}

const JOB_TYPES = ['plumbing', 'electrical', 'hvac', 'roofing', 'painting', 'general', 'other']
const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled']

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', job_type: 'general',
    scheduled_date: '', scheduled_time: '', estimated_hours: '', address: '', amount: '',
  })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const [jobsRes, clientsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/clients'),
      ])
      const jobsData = await jobsRes.json()
      const clientsData = await clientsRes.json()
      setJobs(jobsData.jobs || [])
      setClients(clientsData.clients || [])
    } catch {} finally {
      setIsLoading(false)
    }
  }

  function openNew() {
    setEditingJob(null)
    setForm({ title: '', description: '', client_id: '', job_type: 'general', scheduled_date: '', scheduled_time: '', estimated_hours: '', address: '', amount: '' })
    setShowForm(true)
  }

  function openEdit(job: Job) {
    setEditingJob(job)
    setForm({
      title: job.title,
      description: job.description || '',
      client_id: job.client_id || '',
      job_type: job.job_type || 'general',
      scheduled_date: job.scheduled_date || '',
      scheduled_time: job.scheduled_time || '',
      estimated_hours: job.estimated_hours?.toString() || '',
      address: job.address || '',
      amount: job.amount?.toString() || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        amount: form.amount ? Number(form.amount) : 0,
        client_id: form.client_id || null,
      }

      if (editingJob) {
        await fetch('/api/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingJob.id, ...body }),
        })
      } else {
        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setShowForm(false)
      load()
    } catch {} finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job?')) return
    await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  if (isLoading) return <LoadingSkeleton rows={6} />

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jobs</h1>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + New Job
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingJob ? 'Edit Job' : 'New Job'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
                  <select value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input type="time" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Hours</label>
                  <input type="number" step="0.5" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No jobs found.</p>
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create your first job</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <span className={`w-3 h-3 rounded-full shrink-0 ${job.status === 'completed' ? 'bg-green-500' : job.status === 'in_progress' ? 'bg-yellow-500' : job.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{job.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{job.clients?.name || 'No client'} · {job.job_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-gray-900 dark:text-white">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'No date'}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">${job.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  {job.status === 'scheduled' && (
                    <button onClick={() => updateStatus(job.id, 'in_progress')} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">Start</button>
                  )}
                  {job.status === 'in_progress' && (
                    <button onClick={() => updateStatus(job.id, 'completed')} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Complete</button>
                  )}
                  <button onClick={() => openEdit(job)} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">Edit</button>
                  <button onClick={() => handleDelete(job.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
