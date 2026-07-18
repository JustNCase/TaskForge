import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero */}
      <section className="text-center pt-16 md:pt-24">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white max-w-3xl mx-auto leading-tight">
          Stop Juggling
          <span className="text-blue-600"> Spreadsheets</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          TaskForge is the all-in-one app built for contractors. Schedule jobs, manage clients,
          send estimates, and get paid — all from your phone.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-lg font-semibold border border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Pain Points */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Built for People Who Build Things
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🔨</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Job Scheduling</h3>
            <p className="text-gray-600 dark:text-gray-400">Drag-and-drop calendar. See your whole week at a glance. Never double-book again.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Client Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Every client, every job, every invoice — in one place. No more sticky notes.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Estimates & Invoicing</h3>
            <p className="text-gray-600 dark:text-gray-400">Send professional estimates in minutes. Convert to jobs. Get paid faster.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Mobile First</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Works on your phone, tablet, and desktop. Use it on the job site.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Quick Estimates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create and send estimates in under 2 minutes. Templates included.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">See how much you earned this week, month, and year. Track by job type.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <span className="text-2xl">🔔</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Smart Reminders</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Never miss a follow-up or payment. Automatic reminders for you and clients.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="text-center max-w-3xl mx-auto">
        <p className="text-lg text-gray-600 dark:text-gray-400 italic">
          &ldquo;I used to manage everything in my head and a notebook. TaskForge saved me 5 hours a week and I stopped losing invoices.&rdquo;
        </p>
        <p className="mt-4 font-semibold text-gray-900 dark:text-white">— Mike R., Electrician</p>
      </section>

      {/* CTA */}
      <section className="text-center bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to run your business like a pro?</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
          Join thousands of contractors who switched from spreadsheets to TaskForge. Free for 14 days.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 bg-white text-blue-700 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          Start Free Trial
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>TaskForge — Built for contractors, by contractors</p>
      </footer>
    </div>
  );
}
