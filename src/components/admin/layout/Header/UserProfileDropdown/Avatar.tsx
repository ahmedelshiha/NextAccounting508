"use client"

import { cn } from "@/lib/utils"

export interface AvatarProps {
  name: string
  src?: string
  size?: "sm" | "md" | "lg"
  showStatus?: boolean
  status?: "online" | "away" | "busy"
}

const sizeMap = {
  sm: "h-6 w-6 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ""
  const last = parts[1]?.[0] || ""
  return (first + last).toUpperCase() || name.slice(0, 2).toUpperCase()
}

export default function Avatar({ name, src, size = "md", showStatus, status = "online" }: AvatarProps) {
  return (
    <div className={cn("relative rounded-full bg-gray-200 overflow-hidden flex items-center justify-center select-none", sizeMap[size])} aria-label={name} role="img">
      {src ? (
         
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-medium text-gray-700">{getInitials(name)}</span>
      )}
      {showStatus && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white",
            status === "online" && "bg-green-500",
            status === "away" && "bg-amber-400",
            status === "busy" && "bg-red-500",
          )}
        />
      )}
    </div>
  )
}
