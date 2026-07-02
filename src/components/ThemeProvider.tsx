'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { saveOrganizationSettings } from '@/app/settings/actions'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isLoading: true
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: string
}

export function ThemeProvider({ children, initialTheme = 'dark' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme as Theme)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('theme') as Theme
    if (stored && (stored === 'light' || stored === 'dark')) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      document.documentElement.setAttribute('data-theme', initialTheme)
    }
  }, [initialTheme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)

    // Save to DB in background — only if user is logged in (has a session)
    // Don't await so the toggle is instant regardless of network
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(res => {
        if (res.ok) {
          saveOrganizationSettings({ theme: newTheme }).catch(() => {})
        }
      })
      .catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLoading: !isMounted }}>
      {children}
    </ThemeContext.Provider>
  )
}