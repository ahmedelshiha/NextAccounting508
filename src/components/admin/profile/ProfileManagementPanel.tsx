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
  onClose?: () => void
  defaultTab?: "profile" | "security" | "notifications" | "booking" | "localization"
  inline?: boolean
  fullPage?: boolean
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
import NotificationsTab from './NotificationsTab'
import BookingNotificationsTab from './BookingNotificationsTab'
import LocalizationTab from './LocalizationTab'
import { useSession } from 'next-auth/react'

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

export default function ProfileManagementPanel({ isOpen, onClose, defaultTab = "profile", inline = false, fullPage = false }: ProfileManagementPanelProps) {
  const [tab, setTab] = useState(defaultTab)
  const { profile, loading, update } = useUserProfile()
  const { enrollMfa, mfaSetupData, clearMfaSetup } = useSecuritySettings()
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined

  useEffect(() => setTab(defaultTab), [defaultTab])
  useEffect(() => {
    if (!isOpen && !fullPage) return
    try {
      const saved = window.localStorage.getItem('profile-panel-last-tab')
      const validTabs = ['profile', 'security', 'booking', 'localization', 'notifications']
      if (!defaultTab && saved && validTabs.includes(saved)) setTab(saved as any)
    } catch {}
  }, [isOpen, defaultTab, fullPage])

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

  const TabsBlock = (
    <Tabs value={tab} onValueChange={(v) => { setTab(v as any); try { window.localStorage.setItem('profile-panel-last-tab', v) } catch {} }}>
      <div className="sticky top-0 bg-white z-10 pt-1">
        <TabsList className="w-full h-auto flex-wrap justify-start">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Sign in & security</TabsTrigger>
          <TabsTrigger value="booking">Booking Notifications</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
        </TabsList>
      </div>

      <ProfileTab loading={loading} profile={profile} onSave={handleProfileSave} />
      <SecurityTab
        loading={loading}
        profile={profile}
        onPasswordSave={(val) => handleProfileSave('password', val)}
        onMfaSetup={handleMfaSetup}
      />
      <TabsContent value="booking" className="mt-4">
        <BookingNotificationsTab loading={loading} />
      </TabsContent>
      <TabsContent value="localization" className="mt-4">
        <LocalizationTab loading={loading} />
      </TabsContent>
    </Tabs>
  )

  if (fullPage) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold truncate">Manage profile</h1>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    Update your personal information and security settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              {TabsBlock}
            </div>
          </div>
        </div>

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

  return (
    <>
      {inline ? (
        <div className="max-w-3xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold">Manage profile</h1>
                <p className="text-sm text-gray-500">Update your personal information and security settings</p>
              </div>
            </div>
            {TabsBlock}
          </div>
        </div>
      ) : (
        <>
          <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose?.() }}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage profile</DialogTitle>
              </DialogHeader>
              {TabsBlock}
            </DialogContent>
          </Dialog>
        </>
      )}

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
