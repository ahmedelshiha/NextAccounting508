"use client"

import * as React from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = React.useState<ToasterProps["theme"]>("light")

  React.useEffect(() => {
    const updateTheme = () => {
      try {
        const isDark = document.documentElement.classList.contains("dark")
        setTheme(isDark ? "dark" : "light")
      } catch {}
    }
    updateTheme()
    window.addEventListener("themechange", updateTheme as any)
    const mo = new MutationObserver(updateTheme)
    try { mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }) } catch {}
    return () => {
      window.removeEventListener("themechange", updateTheme as any)
      try { mo.disconnect() } catch {}
    }
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
