import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <nav className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xl font-bold text-gray-900 dark:text-white">TaskForge</span>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</Link>
          <Link href="/jobs" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Jobs</Link>
          <Link href="/clients" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Clients</Link>
          <Link href="/estimates" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Estimates</Link>
          <Link href="/invoices" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Invoices</Link>
        </div>
      </nav>
      {children}
    </section>
  );
}
