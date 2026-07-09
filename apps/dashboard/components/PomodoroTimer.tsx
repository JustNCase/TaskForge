'use client'

import { useState, useEffect, useRef } from 'react'

type PomodoroTimerProps = {
  onComplete?: () => void
}

export default function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const focusMinutes = 25
  const breakMinutes = 5

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'focus') {
              setMode('break')
              setSeconds(breakMinutes * 60)
              onComplete?.()
            } else {
              setMode('focus')
              setSeconds(focusMinutes * 60)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, onComplete])

  function toggle() {
    if (running) {
      clearInterval(intervalRef.current!)
      setRunning(false)
    } else {
      setRunning(true)
    }
  }

  function reset() {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setMode('focus')
    setSeconds(focusMinutes * 60)
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct = mode === 'focus'
    ? ((focusMinutes * 60 - seconds) / (focusMinutes * 60)) * 100
    : ((breakMinutes * 60 - seconds) / (breakMinutes * 60)) * 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
        {mode === 'focus' ? 'Focus Time' : 'Break'}
      </div>

      <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto mb-6">
        <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" className="dark:stroke-gray-600" strokeWidth="10" />
        <circle cx="100" cy="100" r="90" fill="none" stroke={mode === 'focus' ? '#3B82F6' : '#10B981'} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 90}`} strokeDashoffset={`${2 * Math.PI * 90 * (1 - pct / 100)}`}
          transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        <text x="100" y="105" textAnchor="middle" className={`text-4xl font-bold fill-current ${mode === 'focus' ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </text>
      </svg>

      <div className="flex justify-center gap-3">
        <button onClick={toggle} className={`px-6 py-2 rounded-lg text-white font-medium ${running ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">
          Reset
        </button>
      </div>
    </div>
  )
}
