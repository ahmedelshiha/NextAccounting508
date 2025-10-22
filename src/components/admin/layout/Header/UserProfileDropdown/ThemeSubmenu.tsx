"use client"

import { useTheme } from "@/hooks/useTheme"
import { Sun, Moon, Monitor, Check } from "lucide-react"
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
      <div className="flex flex-col gap-2">
        {options.map(({ value, label, Icon }) => {
          const checked = (theme || "system") === value
          return (
            <button
              key={value}
              role="menuitemradio"
              aria-checked={checked}
              onClick={() => handleThemeChange(value)}
              title={`Switch to ${label} theme`}
              className={cn(
                "flex items-center justify-between w-full gap-3 px-3 py-2 rounded-md transition-all text-sm",
                checked
                  ? "bg-gradient-to-r from-blue-50 to-white text-blue-700 ring-1 ring-blue-200 shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("flex items-center justify-center h-8 w-8 rounded-md", checked ? "bg-blue-100" : "bg-gray-100")}>
                  <Icon className={cn("h-4 w-4", checked ? "text-blue-600" : "text-gray-600")} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-gray-400">{value === 'system' ? 'Follow system' : `${label} mode`}</span>
                </div>
              </div>

              <div className="flex items-center">
                {checked ? <Check className="h-4 w-4 text-blue-600" /> : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
