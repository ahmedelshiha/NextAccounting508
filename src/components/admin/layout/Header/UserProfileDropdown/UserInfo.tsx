"use client"

export interface UserInfoProps {
  name: string
  email?: string
  role?: string
  organization?: string
  variant?: "compact" | "full"
}

export default function UserInfo({ name, email, role, organization, variant = "compact" }: UserInfoProps) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
      {variant === "full" && (
        <div className="text-xs text-gray-500 truncate">
          {email && <div className="truncate">{email}</div>}
          <div className="truncate">{role || ""}{organization ? (role ? " · " : "") + organization : ""}</div>
        </div>
      )}
    </div>
  )
}
