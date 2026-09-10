'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: 'system', setTheme: () => {} })

export function useTheme() { return useContext(ThemeContext) }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const saved = window.localStorage.getItem('universitea-theme') as Theme | null
    if (saved) setThemeState(saved)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const effective = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme
    root.dataset.theme = effective
    root.style.colorScheme = effective
  }, [theme])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    window.localStorage.setItem('universitea-theme', next)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
