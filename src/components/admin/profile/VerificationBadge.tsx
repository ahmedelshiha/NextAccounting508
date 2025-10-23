"use client"

export interface VerificationBadgeProps {
  size?: "sm" | "md"
}

export default function VerificationBadge({ size = "sm" }: VerificationBadgeProps) {
  return (
    <span className={
      (size === "md" ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]") +
      " inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200"
    }>
      Verified
    </span>
  )
}
