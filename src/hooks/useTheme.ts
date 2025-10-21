import { useEffect, useMemo, useCallback } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { toast } from 'sonner'

export type ThemeMode = 'light' | 'dark' | 'system'

export function useTheme() {
  const { theme, setTheme: setNextTheme, systemTheme, resolvedTheme } = useNextTheme() as unknown as {
    theme?: ThemeMode
    setTheme: (t: ThemeMode) => void
    systemTheme?: 'light' | 'dark'
    resolvedTheme?: 'light' | 'dark'
  }

  const effectiveTheme = useMemo<'light' | 'dark'>(
    () => (resolvedTheme || systemTheme || (theme === 'light' || theme === 'dark' ? theme : 'light')) as 'light' | 'dark',
    [resolvedTheme, systemTheme, theme]
  )

  const setTheme = useCallback((newTheme: ThemeMode) => {
    try {
      setNextTheme(newTheme)
      // next-themes handles localStorage persistence automatically
    } catch (error) {
      console.error('Failed to set theme:', error)
    }
  }, [setNextTheme])

  useEffect(() => {
    try {
      const ev = new CustomEvent('themechange', { detail: { theme, effectiveTheme } })
      window.dispatchEvent(ev)
    } catch {}
  }, [theme, effectiveTheme])

  return { theme: (theme ?? 'system') as ThemeMode, setTheme, effectiveTheme, systemTheme }
}
