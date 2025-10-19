"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSecuritySettings } from "@/hooks/useSecuritySettings"
import { Copy, Check, Loader2 } from "lucide-react"

export interface MfaSetupModalProps {
  isOpen: boolean
  onClose: () => void
  setupData: {
    secret: string
    uri: string
    backupCodes: string[]
  }
}

export default function MfaSetupModal({ isOpen, onClose, setupData }: MfaSetupModalProps) {
  const { verifyMfa, loading, error } = useSecuritySettings()
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr")
  const [code, setCode] = useState("")
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setVerifyError("Please enter a 6-digit code")
      return
    }
    try {
      const success = await verifyMfa(code)
      if (success) {
        setStep("backup")
      }
    } catch (e: any) {
      setVerifyError(String(e?.message || "Invalid code"))
    }
  }

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(setupData.backupCodes.join("\n"))
    setCopiedBackupCodes(true)
    setTimeout(() => setCopiedBackupCodes(false), 2000)
  }

  const handleComplete = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set up two-factor authentication</DialogTitle>
          <DialogDescription>Secure your account with an additional authentication step</DialogDescription>
        </DialogHeader>

        {step === "qr" && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-center min-h-64">
              <img src={setupData.uri} alt="QR Code" className="h-48 w-48" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                  Can&apos;t scan? Enter this code instead
                </summary>
                <code className="block mt-2 p-2 bg-gray-100 rounded text-xs break-all">
                  {setupData.secret}
                </code>
              </details>
            </div>
            <Button onClick={() => setStep("verify")} className="w-full">
              I&apos;ve scanned the code
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app to verify setup
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                setVerifyError(null)
              }}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("qr")} disabled={loading} className="flex-1">
                Back
              </Button>
              <Button onClick={handleVerify} disabled={loading || code.length !== 6} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify
              </Button>
            </div>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">Save your backup codes</h3>
              <p className="text-sm text-amber-800 mb-3">
                Save these codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
              </p>
              <div className="bg-white rounded p-3 font-mono text-xs space-y-1 mb-3 max-h-40 overflow-auto">
                {setupData.backupCodes.map((code, i) => (
                  <div key={i} className="text-gray-700">
                    {code}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBackupCodes}
                className="w-full"
              >
                {copiedBackupCodes ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy all codes
                  </>
                )}
              </Button>
            </div>
            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
