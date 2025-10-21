"use client"

import { useTheme } from "@/hooks/useTheme"
import { Sun, Moon, Monitor } from "lucide-react"
import { announce } from "@/lib/a11y"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const

export default function ThemeSubmenu() {
  const { theme, setTheme } = useTheme()

  const handleThemeChange = (value: typeof options[number]["value"]) => {
    setTheme(value)
    try {
      const label = options.find(o => o.value === value)?.label || value
      announce(`Theme set to ${label}`)
      toast.success(`Theme: ${label}`)
    } catch {}
  }

  return (
    <div role="group" aria-label="Theme" className="px-3 py-2 border-t border-gray-100">
      <div className="flex gap-2 items-center justify-start">
        {options.map(({ value, label, Icon }) => {
          const checked = (theme || "system") === value
          return (
            <button
              key={value}
              role="menuitemradio"
              aria-checked={checked}
              onClick={() => handleThemeChange(value)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors",
                checked
                  ? "bg-gray-200 text-gray-900 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-150"
              )}
              title={`Switch to ${label} theme`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
