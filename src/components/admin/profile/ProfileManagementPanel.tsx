"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export interface ProfileManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "profile" | "security"
}

export default function ProfileManagementPanel({ isOpen, onClose, defaultTab = "profile" }: ProfileManagementPanelProps) {
  const [tab, setTab] = useState(defaultTab)

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
            <div className="space-y-2">
              {/* Fields will be rendered from constants in later steps */}
              <p className="text-sm text-gray-600">Update your profile details.</p>
            </div>
          </TabsContent>
          <TabsContent value="security">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Manage your security settings.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
