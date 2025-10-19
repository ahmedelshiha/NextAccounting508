"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type UserStatus = "online" | "away" | "busy"

const STORAGE_KEY = "user-status"

export function useUserStatus(options?: { autoAwayMs?: number }) {
  const { autoAwayMs = 5 * 60 * 1000 } = options || {}
  const [status, setStatus] = useState<UserStatus>(() => {
    if (typeof window === "undefined") return "online"
    try {
      const s = window.localStorage.getItem(STORAGE_KEY) as UserStatus | null
      return (s === "online" || s === "away" || s === "busy") ? s : "online"
    } catch {
      return "online"
    }
  })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, status) } catch {}
  }, [status])

  const markActive = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (status !== "busy") setStatus("online")
    timer.current = setTimeout(() => {
      if (status !== "busy") setStatus("away")
    }, autoAwayMs)
  }, [autoAwayMs, status])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onVis = () => markActive()
    const onMove = () => markActive()
    const onKey = () => markActive()
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("keydown", onKey)
    markActive()
    return () => {
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("keydown", onKey)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [markActive])

  const set = useCallback((s: UserStatus) => { setStatus(s); try { const lbl = s === 'away' ? 'Away' : s === 'busy' ? 'Busy' : 'Online'; (await import('@/lib/a11y')).announce(`Status set to ${lbl}`) } catch {} }, [])

  return { status, setStatus: set }
}
