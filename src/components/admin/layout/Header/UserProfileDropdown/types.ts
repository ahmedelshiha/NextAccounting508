import type { LucideIcon } from "lucide-react"
import type { Permission } from '@/lib/permissions'

export interface UserMenuLink {
  label: string
  href: string
  external?: boolean
  icon?: LucideIcon
  permission?: Permission | Permission[]
}

export type ThemeMode = "light" | "dark" | "system"

export type UserStatus = "online" | "away" | "busy"
