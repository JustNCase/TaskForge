import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Checkout Canceled
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          No worries — you can subscribe anytime when you&apos;re ready.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/pricing"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            View Plans
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-100 dark:bg-gray-700 px-6 py-3 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
