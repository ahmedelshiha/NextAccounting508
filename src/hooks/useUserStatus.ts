"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { announce } from "@/lib/a11y"

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
    const onOnline = () => markActive()
    const onOffline = () => { if (status !== "busy") setStatus("away") }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("keydown", onKey)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    markActive()
    return () => {
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [markActive, status])

  const set = useCallback((s: UserStatus) => { setStatus(s); try { const lbl = s === 'away' ? 'Away' : s === 'busy' ? 'Busy' : 'Online'; announce(`Status set to ${lbl}`); const { toast } = require('sonner'); toast.success(`Status: ${lbl}`) } catch {} }, [])

  return { status, setStatus: set }
}
