"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import { ChevronDown, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Avatar from "./UserProfileDropdown/Avatar"
import UserInfo from "./UserProfileDropdown/UserInfo"
import ThemeSubmenu from "./UserProfileDropdown/ThemeSubmenu"
import type { UserMenuLink } from "./UserProfileDropdown/types"
import { MENU_LINKS, HELP_LINKS } from "./UserProfileDropdown/constants"
import { useUserStatus } from "@/hooks/useUserStatus"

export interface UserProfileDropdownProps {
  className?: string
  showStatus?: boolean
  onSignOut?: () => Promise<void> | void
  customLinks?: UserMenuLink[]
}

function StatusSelector() {
  const { status, setStatus } = useUserStatus()
  const opts = [
    { v: "online" as const, label: "Online", dot: "bg-green-500" },
    { v: "away" as const, label: "Away", dot: "bg-amber-400" },
    { v: "busy" as const, label: "Busy", dot: "bg-red-500" },
  ]
  return (
    <div role="group" aria-label="Status" className="py-1 border-t border-gray-100">
      {opts.map(o => (
        <button
          key={o.v}
          role="menuitemradio"
          aria-checked={status === o.v}
          onClick={() => setStatus(o.v)}
          className={"w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 " + (status === o.v ? "text-gray-900" : "text-gray-700")}
        >
          <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${o.dot}`} />
          <span className="flex-1 text-left">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function UserProfileDropdown({
  className,
  showStatus = true,
  onSignOut,
  customLinks,
}: UserProfileDropdownProps) {
  const { data: session } = useSession()
  const name = session?.user?.name || "User"
  const email = session?.user?.email || undefined
  const image = (session?.user as any)?.image as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  const organization = (session?.user as any)?.organization as string | undefined

  const links = useMemo<UserMenuLink[]>(() => {
    return customLinks && customLinks.length ? customLinks : MENU_LINKS
  }, [customLinks])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("flex items-center gap-2 px-3", className)}
          aria-label="Open user menu"
        >
          <div className="relative h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-4 w-4 text-gray-600" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">{role || ""}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <Avatar name={name} src={image} size="md" showStatus={showStatus} />
            <UserInfo name={name} email={email} role={role} organization={organization} variant="full" />
          </div>
        </div>
        <ThemeSubmenu />
        {/* Status selector */}
        {showStatus ? <StatusSelector /> : null}
        <div className="py-1">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {l.icon ? <l.icon className="mr-2 h-4 w-4" /> : null}
              <span>{l.label}</span>
            </a>
          ))}
        </div>
        <div className="py-1 border-t border-gray-100">
          {HELP_LINKS.map((l) => (
            <a key={l.href} href={l.href} target={l.external ? "_blank" : undefined} rel={l.external ? "noreferrer" : undefined} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {l.icon ? <l.icon className="mr-2 h-4 w-4" /> : null}
              <span>{l.label}</span>
            </a>
          ))}
        </div>
        <div className="py-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => { if (!onSignOut) return; const ok = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out?') : true; if (ok) onSignOut(); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
