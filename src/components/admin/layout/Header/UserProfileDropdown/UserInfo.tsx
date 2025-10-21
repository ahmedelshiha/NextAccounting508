"use client"

export interface UserInfoProps {
  name: string
  email?: string
  role?: string
  organization?: string
  variant?: "compact" | "full"
  loading?: boolean
}

export default function UserInfo({ name, email, role, organization, variant = "compact", loading = false }: UserInfoProps) {
  if (loading) {
    return (
      <div className="min-w-0">
        <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
        {variant === 'full' && (
          <div className="space-y-1">
            <div className="h-3 w-40 bg-gray-100 rounded" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        )}
      </div>
    )
  }
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
