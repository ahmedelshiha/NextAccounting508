import { Book, Key, ShieldQuestion, Settings, HelpCircle, Keyboard } from "lucide-react"
import type { UserMenuLink } from "./types"

import { Settings, ShieldQuestion, Book, Key, HelpCircle, Keyboard } from "lucide-react"

export const MENU_LINKS: UserMenuLink[] = [
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Security & MFA", href: "/admin/settings/security", icon: ShieldQuestion },
  { label: "Billing", href: "/admin/settings/financial", icon: Book },
  { label: "API Keys", href: "/admin/settings/integrations", icon: Key },
]

export const HELP_LINKS: UserMenuLink[] = [
  { label: "Help & Support", href: "/admin/notifications", icon: HelpCircle },
  { label: "Keyboard Shortcuts", href: "/admin/shortcuts", icon: Keyboard },
  { label: "Documentation", href: "https://docs.example.com", external: true, icon: Book },
]
