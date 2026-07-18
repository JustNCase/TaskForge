'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

type Job = {
  id: string
  title: string
  status: string
  scheduled_date: string
  amount: number
  clients: { name: string } | null
}

type Invoice = {
  id: string
  status: string
  total: number
}

type Estimate = {
  id: string
  status: string
  total: number
}

type Client = {
  id: string
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, invoicesRes, estimatesRes, clientsRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/invoices'),
          fetch('/api/estimates'),
          fetch('/api/clients'),
        ])
        const jobsData = await jobsRes.json()
        const invoicesData = await invoicesRes.json()
        const estimatesData = await estimatesRes.json()
        const clientsData = await clientsRes.json()
        setJobs(jobsData.jobs || [])
        setInvoices(invoicesData.invoices || [])
        setEstimates(estimatesData.estimates || [])
        setClients(clientsData.clients || [])
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) return <LoadingSkeleton rows={6} />

  const today = new Date().toISOString().split('T')[0]
  const todayJobs = jobs.filter(j => j.scheduled_date === today)
  const scheduledJobs = jobs.filter(j => j.status === 'scheduled')
  const activeJobs = jobs.filter(j => j.status === 'in_progress')
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
  const pendingEstimates = estimates.filter(e => e.status === 'sent' || e.status === 'draft')
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0)
  const outstanding = pendingInvoices.reduce((sum, i) => sum + (i.total || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/jobs" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            New Job
          </Link>
          <Link href="/estimates" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            New Estimate
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔨</span>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-blue-600">{activeJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue (Paid)</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
              <p className="text-2xl font-bold text-yellow-600">${outstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/clients" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Clients</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{clients.length} total</p>
            </div>
          </div>
        </Link>
        <Link href="/estimates" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📝</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Estimates</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pendingEstimates.length} pending</p>
            </div>
          </div>
        </Link>
        <Link href="/invoices" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-500 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💵</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Invoices</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pendingInvoices.length} awaiting payment</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Today&apos;s Schedule</h2>
        {todayJobs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No jobs scheduled for today. Enjoy your day off!</p>
        ) : (
          <div className="space-y-3">
            {todayJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${job.status === 'completed' ? 'bg-green-500' : job.status === 'in_progress' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{job.clients?.name || 'No client'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">${job.amount.toLocaleString()}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{job.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Jobs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Jobs</h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
        </div>
        {scheduledJobs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No upcoming jobs.</p>
        ) : (
          <div className="space-y-3">
            {scheduledJobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{job.clients?.name || 'No client'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900 dark:text-white">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'No date'}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">${job.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
