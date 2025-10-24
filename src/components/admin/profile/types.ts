export type PanelTab = "profile" | "security" | "notifications"

export interface ProfileFieldDef {
  key: string
  label: string
  placeholder?: string
  verified?: boolean
  masked?: boolean
}
