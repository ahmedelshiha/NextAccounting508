import { useEffect, useMemo } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

export type ThemeMode = 'light' | 'dark' | 'system'

export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme() as unknown as {
    theme?: ThemeMode
    setTheme: (t: ThemeMode) => void
    systemTheme?: 'light' | 'dark'
    resolvedTheme?: 'light' | 'dark'
  }

  const effectiveTheme = useMemo<'light' | 'dark'>(
    () => (resolvedTheme || systemTheme || (theme === 'light' || theme === 'dark' ? theme : 'light')) as 'light' | 'dark',
    [resolvedTheme, systemTheme, theme]
  )

  useEffect(() => {
    try {
      const ev = new CustomEvent('themechange', { detail: { theme, effectiveTheme } })
      window.dispatchEvent(ev)
    } catch {}
  }, [theme, effectiveTheme])

  return { theme: (theme ?? 'system') as ThemeMode, setTheme, effectiveTheme }
}
