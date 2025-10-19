import type { LucideIcon } from "lucide-react"

export interface UserMenuLink {
  label: string
  href: string
  external?: boolean
  icon?: LucideIcon
}

export type ThemeMode = "light" | "dark" | "system"

export type UserStatus = "online" | "away" | "busy"
