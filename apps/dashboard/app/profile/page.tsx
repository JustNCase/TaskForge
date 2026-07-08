'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { logout } from '@/lib/actions/auth'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  async function handleLogout() {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>

      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-200">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.email?.split('@')[0]}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Account Details</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="text-sm text-gray-900 dark:text-white">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">User ID</dt>
            <dd className="text-sm font-mono text-gray-900 dark:text-white">{user.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Email Verified</dt>
            <dd className="text-sm text-gray-900 dark:text-white">
              {user.email_confirmed_at ? 'Yes' : 'No'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
