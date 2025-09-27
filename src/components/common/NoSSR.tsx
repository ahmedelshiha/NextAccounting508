'use client'

import { useState, useEffect, ReactNode } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * NoSSR Component - Complete Server-Side Rendering Suppression
 * 
 * This component ensures that its children are NEVER rendered on the server,
 * completely eliminating any possibility of hydration mismatches.
 * 
 * Use this for components that:
 * - Access browser APIs (window, localStorage, etc.)
 * - Have dynamic content that varies between server and client
 * - Cause hydration mismatches for any reason
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}