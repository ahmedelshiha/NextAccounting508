"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useUserProfile } from "@/hooks/useUserProfile"
import EditableField from "./EditableField"
import { PROFILE_FIELDS, SECURITY_FIELDS } from "./constants"

export interface ProfileManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "profile" | "security"
}

export default function ProfileManagementPanel({ isOpen, onClose, defaultTab = "profile" }: ProfileManagementPanelProps) {
  const [tab, setTab] = useState(defaultTab)
  const { profile, loading } = useUserProfile()

  useEffect(() => setTab(defaultTab), [defaultTab])

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage profile</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Sign in & security</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <div className="space-y-1">
              {loading && <div className="animate-pulse h-4 bg-gray-100 rounded" />}
              {!loading && PROFILE_FIELDS.map((f) => (
                <EditableField key={f.key} label={f.label} value={(profile as any)?.[f.key]} placeholder={f.placeholder} verified={f.verified} masked={f.masked} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="security">
            <div className="space-y-1">
              {loading && <div className="animate-pulse h-4 bg-gray-100 rounded" />}
              {!loading && SECURITY_FIELDS.map((f) => (
                <EditableField key={f.key} label={f.label} value={(profile as any)?.[f.key]} placeholder={f.placeholder} verified={f.verified} masked={f.masked} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
