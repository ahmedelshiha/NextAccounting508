"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useSecuritySettings } from "@/hooks/useSecuritySettings"
import EditableField from "./EditableField"
import { PROFILE_FIELDS } from "./constants"
import MfaSetupModal from "./MfaSetupModal"
import { Loader2, ShieldCheck, User as UserIcon } from "lucide-react"

export interface ProfileManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "profile" | "security"
  inline?: boolean
}

function ProfileTab({ loading, profile, onSave }: { loading: boolean; profile: any; onSave: (key: string, value: string) => Promise<void> }) {
  return (
    <TabsContent value="profile" className="mt-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2 text-gray-700">
            <UserIcon className="h-4 w-4" />
            <div className="text-sm">Basic information</div>
          </div>
          <div className="space-y-2">
            {PROFILE_FIELDS.map((f) => (
              <EditableField
                key={f.key}
                label={f.label}
                value={profile?.[f.key]}
                placeholder={f.placeholder}
                verified={f.verified}
                masked={f.masked}
                onSave={(val) => onSave(f.key, val)}
                description={f.key === "name" ? "Your full name as it appears in communications" : f.key === "email" ? "Your primary email address" : f.key === "organization" ? "Your organization name" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </TabsContent>
  )
}

import AccountActivity from './AccountActivity'
function SecurityTab({ loading, profile, onPasswordSave, onMfaSetup }: { loading: boolean; profile: any; onPasswordSave: (val: string) => Promise<void>; onMfaSetup: () => Promise<void> }) {
  return (
    <TabsContent value="security" className="mt-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2 text-gray-700">
            <ShieldCheck className="h-4 w-4" />
            <div className="text-sm">Sign in & security</div>
          </div>
          <div className="space-y-2">
            <EditableField
              label="User ID"
              value={profile?.id || ""}
              placeholder="User ID"
              disabled
              description="Unique identifier for your account"
            />
            <EditableField
              label="Password"
              value="••••••••"
              masked
              placeholder="Set a password"
              onSave={(val) => (val ? onPasswordSave(val) : Promise.resolve())}
              description="Change your login password"
            />
            <EditableField
              label="Two-factor authentication"
              value={profile?.twoFactorEnabled ? "Enabled" : "Not enabled"}
              placeholder="Not set up"
              onSave={(_val) => onMfaSetup()}
              description="Add an extra layer of security to your account"
            />
            <EditableField
              label="Email verification"
              value={profile?.emailVerified ? "Verified" : "Not verified"}
              placeholder="Pending verification"
              verified={profile?.emailVerified}
              description="Confirm ownership of your email address"
            />
            <EditableField
              label="Active sessions"
              value="1 active"
              disabled
              description="Devices where you're currently signed in"
            />
          </div>
          <AccountActivity />
        </>
      )}
    </TabsContent>
  )
}

export default function ProfileManagementPanel({ isOpen, onClose, defaultTab = "profile" }: ProfileManagementPanelProps) {
  const [tab, setTab] = useState(defaultTab)
  const { profile, loading, update } = useUserProfile()
  const { enrollMfa, mfaSetupData, clearMfaSetup } = useSecuritySettings()
  const [showMfaSetup, setShowMfaSetup] = useState(false)

  useEffect(() => setTab(defaultTab), [defaultTab])
  useEffect(() => {
    if (!isOpen) return
    try {
      const saved = window.localStorage.getItem('profile-panel-last-tab')
      if (!defaultTab && (saved === 'profile' || saved === 'security')) setTab(saved as any)
    } catch {}
  }, [isOpen, defaultTab])

  const handleProfileSave = async (key: string, value: string) => {
    await update({ [key]: value })
  }

  const handleMfaSetup = async () => {
    try {
      const data = await enrollMfa()
      if (data) {
        setShowMfaSetup(true)
      }
    } catch (e) {
      console.error("MFA setup failed:", e)
    }
  }

  const handleMfaSetupClose = () => {
    setShowMfaSetup(false)
    clearMfaSetup()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage profile</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as any); try { window.localStorage.setItem('profile-panel-last-tab', v) } catch {} }}>
            <div className="sticky top-0 bg-white z-10 pt-1">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Sign in & security</TabsTrigger>
              </TabsList>
            </div>

            <ProfileTab loading={loading} profile={profile} onSave={handleProfileSave} />
            <SecurityTab
              loading={loading}
              profile={profile}
              onPasswordSave={(val) => handleProfileSave('password', val)}
              onMfaSetup={handleMfaSetup}
            />
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* MFA Setup Modal */}
      {showMfaSetup && mfaSetupData && (
        <MfaSetupModal
          isOpen={showMfaSetup}
          onClose={handleMfaSetupClose}
          setupData={mfaSetupData}
        />
      )}
    </>
  )
}
