export type PanelTab = "profile" | "security" | "communication" | "notifications"

export interface ProfileFieldDef {
  key: string
  label: string
  placeholder?: string
  verified?: boolean
  masked?: boolean
}
