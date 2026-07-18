import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription Active!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Thank you for subscribing. Your premium features are now available.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
