import { Book, Key, ShieldQuestion, Settings, HelpCircle, Keyboard } from "lucide-react"
import { PERMISSIONS, type Permission } from "@/lib/permissions"
import type { UserMenuLink } from "./types"

export const MENU_LINKS: UserMenuLink[] = [
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Security & MFA", href: "/admin/settings/security", icon: ShieldQuestion },
  { label: "Billing", href: "/admin/settings/financial", icon: Book, permission: PERMISSIONS.FINANCIAL_SETTINGS_VIEW },
  { label: "API Keys", href: "/admin/settings/integrations", icon: Key, permission: PERMISSIONS.INTEGRATION_HUB_VIEW },
]

export const HELP_LINKS: UserMenuLink[] = [
  { label: "Help & Support", href: "/admin/notifications", icon: HelpCircle },
  { label: "Keyboard Shortcuts", href: "/admin/shortcuts", icon: Keyboard },
  { label: "Documentation", href: "https://docs.example.com", external: true, icon: Book },
]
