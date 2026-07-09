'use client'

import { useState, useEffect } from 'react'

const steps = [
  { title: 'Welcome to TaskForge!', body: 'Create tasks, earn XP and coins, and unlock achievements as you go.' },
  { title: 'Create Your First Task', body: 'Use the quick-add form or the Tasks page to get started.' },
  { title: 'Earn Rewards', body: 'Complete tasks to earn XP and coins. Level up and spend coins in the Marketplace.' },
  { title: 'AI-Powered', body: 'Use AI Breakdown on the Pro plan to generate subtasks automatically.' },
]

export default function OnboardingTour() {
  const [dismissed, setDismissed] = useState(true)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('tf_onboarding')
    if (!seen) setDismissed(false)
  }, [])

  function handleDismiss() {
    localStorage.setItem('tf_onboarding', '1')
    setDismissed(true)
  }

  function next() {
    if (step < steps.length - 1) setStep(s => s + 1)
    else handleDismiss()
  }

  if (dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 w-2 rounded-full ${i === step ? 'bg-blue-600 w-4' : 'bg-gray-300 dark:bg-gray-600'}`} />
            ))}
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{steps[step].title}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{steps[step].body}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={handleDismiss} className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:underline">Skip</button>
          <button onClick={next} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
