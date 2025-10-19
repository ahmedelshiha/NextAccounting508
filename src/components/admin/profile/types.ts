export type PanelTab = "profile" | "security"

export interface ProfileFieldDef {
  key: string
  label: string
  placeholder?: string
  verified?: boolean
  masked?: boolean
}
