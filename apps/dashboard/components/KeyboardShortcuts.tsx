'use client'

import { useState, useEffect } from 'react'

const shortcuts = [
  { key: 'n', desc: 'New task' },
  { key: 'f', desc: 'Focus mode' },
  { key: 'g', desc: 'Go to dashboard' },
  { key: 't', desc: 'Go to tasks' },
  { key: '?', desc: 'Show/hide shortcuts' },
]

export default function KeyboardShortcuts() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const key = e.key.toLowerCase()
      if (key === '?') { setShow(s => !s); return }
      if (key === 'n') { window.location.href = '/tasks?new=1'; return }
      if (key === 'f') { window.location.href = '/focus'; return }
      if (key === 'g') { window.location.href = '/dashboard'; return }
      if (key === 't') { window.location.href = '/tasks'; return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShow(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.key} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">{s.key === ' ' ? 'Space' : s.key}</kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">?</kbd> to toggle</p>
      </div>
    </div>
  )
}
