export type PanelTab = "profile" | "security" | "preferences" | "communication" | "notifications"

export interface ProfileFieldDef {
  key: string
  label: string
  placeholder?: string
  verified?: boolean
  masked?: boolean
}
