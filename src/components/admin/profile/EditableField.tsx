"use client"

import VerificationBadge from "./VerificationBadge"
import { ChevronRight } from "lucide-react"

export interface EditableFieldProps {
  label: string
  value?: string
  placeholder?: string
  verified?: boolean
  masked?: boolean
  onClick?: () => void
}

export default function EditableField({ label, value, placeholder, verified, masked, onClick }: EditableFieldProps) {
  const display = value ? (masked ? "••••••••" : value) : placeholder || ""
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded">
      <div className="min-w-0">
        <div className="text-sm text-gray-700">{label}</div>
        <div className="text-sm text-gray-900 truncate">{display}</div>
      </div>
      <div className="flex items-center gap-2">
        {verified ? <VerificationBadge /> : null}
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </button>
  )
}
