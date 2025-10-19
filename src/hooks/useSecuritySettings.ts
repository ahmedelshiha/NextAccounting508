"use client"

import { useCallback, useState } from "react"
import { apiFetch } from "@/lib/api"

export interface MfaEnrollResponse {
  ok: boolean
  secret?: string
  uri?: string
  backupCodes?: string[]
  error?: string
}

export interface MfaVerifyResponse {
  ok: boolean
  error?: string
}

export interface AuthenticatorSetupResponse {
  secret: string
  uri: string
  backupCodes: string[]
}

export function useSecuritySettings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mfaSetupData, setMfaSetupData] = useState<AuthenticatorSetupResponse | null>(null)

  const enrollMfa = useCallback(async (): Promise<AuthenticatorSetupResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/auth/mfa/enroll", { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to enroll MFA (${res.status})`)
      }
      const data = (await res.json()) as MfaEnrollResponse
      if (!data.ok || !data.secret || !data.uri) {
        throw new Error("Invalid MFA setup response")
      }
      const setupData: AuthenticatorSetupResponse = {
        secret: data.secret,
        uri: data.uri,
        backupCodes: data.backupCodes || [],
      }
      setMfaSetupData(setupData)
      return setupData
    } catch (e: any) {
      const err = String(e?.message || e)
      setError(err)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyMfa = useCallback(async (code: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Invalid code")
      }
      const data = (await res.json()) as MfaVerifyResponse
      if (data.ok) {
        setMfaSetupData(null)
        try {
          const { announce } = await import("@/lib/a11y")
          announce("Two-factor authentication enabled")
        } catch {}
      }
      return data.ok
    } catch (e: any) {
      const err = String(e?.message || e)
      setError(err)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const disableMfa = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/auth/mfa/disable", {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to disable MFA (${res.status})`)
      }
      try {
        const { announce } = await import("@/lib/a11y")
        announce("Two-factor authentication disabled")
      } catch {}
      return true
    } catch (e: any) {
      const err = String(e?.message || e)
      setError(err)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const sendVerificationEmail = useCallback(async (email: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/user/verification/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to send verification email")
      }
      try {
        const { announce } = await import("@/lib/a11y")
        announce("Verification email sent")
      } catch {}
      return true
    } catch (e: any) {
      const err = String(e?.message || e)
      setError(err)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyEmailToken = useCallback(async (token: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/user/verification/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Invalid or expired token")
      }
      try {
        const { announce } = await import("@/lib/a11y")
        announce("Email verified successfully")
      } catch {}
      return true
    } catch (e: any) {
      const err = String(e?.message || e)
      setError(err)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])
  const clearMfaSetup = useCallback(() => setMfaSetupData(null), [])

  return {
    loading,
    error,
    mfaSetupData,
    enrollMfa,
    verifyMfa,
    disableMfa,
    sendVerificationEmail,
    verifyEmailToken,
    clearError,
    clearMfaSetup,
  }
}
