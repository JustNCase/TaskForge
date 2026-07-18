'use client'

import { useState, useEffect } from 'react'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Client = { id: string; name: string }
type Job = { id: string; title: string }

type EstimateItem = {
  id?: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

type Estimate = {
  id: string
  estimate_number: string
  title: string
  description: string
  status: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  valid_until: string
  created_at: string
  client_id: string
  clients: { name: string } | null
  estimate_items: EstimateItem[]
}

const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired']

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', job_id: '', tax_rate: '', valid_until: '', notes: '',
  })
  const [items, setItems] = useState<EstimateItem[]>([{ description: '', quantity: 1, unit_price: 0, amount: 0 }])
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [estRes, cliRes, jobRes] = await Promise.all([
        fetch('/api/estimates'), fetch('/api/clients'), fetch('/api/jobs'),
      ])
      const estData = await estRes.json()
      const cliData = await cliRes.json()
      const jobData = await jobRes.json()
      setEstimates(estData.estimates || [])
      setClients(cliData.clients || [])
      setJobs(jobData.jobs || [])
    } catch {} finally { setIsLoading(false) }
  }

  function openNew() {
    setEditingEstimate(null)
    setForm({ title: '', description: '', client_id: '', job_id: '', tax_rate: '', valid_until: '', notes: '' })
    setItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }])
    setShowForm(true)
  }

  function openEdit(est: Estimate) {
    setEditingEstimate(est)
    setForm({
      title: est.title, description: est.description || '', client_id: est.client_id || '',
      job_id: '', tax_rate: est.tax_rate?.toString() || '', valid_until: est.valid_until || '', notes: '',
    })
    setItems(est.estimate_items?.length ? est.estimate_items : [{ description: '', quantity: 1, unit_price: 0, amount: 0 }])
    setShowForm(true)
  }

  function updateItem(index: number, field: string, value: any) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price
    }
    setItems(updated)
  }

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxRate = form.tax_rate ? Number(form.tax_rate) : 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        client_id: form.client_id || null,
        job_id: form.job_id || null,
        tax_rate: taxRate,
        subtotal, tax_amount: taxAmount, total,
        items: items.filter(i => i.description.trim()),
      }
      if (editingEstimate) {
        await fetch('/api/estimates', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEstimate.id, ...body }),
        })
      } else {
        await fetch('/api/estimates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setShowForm(false)
      load()
    } catch {} finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this estimate?')) return
    await fetch(`/api/estimates?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/estimates', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  if (isLoading) return <LoadingSkeleton rows={6} />

  const filtered = filter === 'all' ? estimates : estimates.filter(e => e.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Estimates</h1>
        <button onClick={openNew} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          + New Estimate
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingEstimate ? 'Edit Estimate' : 'New Estimate'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Line Items</label>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      <input type="number" step="0.01" placeholder="Price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))}
                        className="w-24 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      <span className="py-2 text-sm text-gray-700 dark:text-gray-300 w-20 text-right">${item.amount.toFixed(2)}</span>
                      <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:text-red-700">×</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ Add line</button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
                  <input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>${taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No estimates found.</p>
          <button onClick={openNew} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Create your first estimate</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(est => (
            <div key={est.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-gray-900 dark:text-white">{est.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${est.status === 'accepted' ? 'bg-green-100 text-green-700' : est.status === 'sent' ? 'bg-blue-100 text-blue-700' : est.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {est.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{est.clients?.name || 'No client'} · {est.estimate_number}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <p className="font-bold text-gray-900 dark:text-white">${est.total.toLocaleString()}</p>
                <div className="flex gap-1">
                  {est.status === 'draft' && <button onClick={() => updateStatus(est.id, 'sent')} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Send</button>}
                  {est.status === 'sent' && <button onClick={() => updateStatus(est.id, 'accepted')} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Accept</button>}
                  <button onClick={() => openEdit(est)} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">Edit</button>
                  <button onClick={() => handleDelete(est.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
