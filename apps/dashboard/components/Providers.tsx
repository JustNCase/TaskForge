'use client'

import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import { ToastProvider } from './Toast'
import OnboardingTour from './OnboardingTour'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
          <OnboardingTour />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
