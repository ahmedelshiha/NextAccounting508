"use client"

import { useTheme } from "@/hooks/useTheme"
import { Sun, Moon, Monitor } from "lucide-react"
import { announce } from "@/lib/a11y"
import { toast } from "sonner"

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const

export default function ThemeSubmenu() {
  const { theme, setTheme } = useTheme()

  return (
    <div role="group" aria-label="Theme" className="py-1 border-t border-gray-100">
      {options.map(({ value, label, Icon }) => {
        const checked = (theme || "system") === value
        return (
          <button
            key={value}
            role="menuitemradio"
            aria-checked={checked}
            onClick={() => { setTheme(value); try { announce(`Theme set to ${label}`) } catch {} }}
            className={
              "w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 " +
              (checked ? "text-gray-900" : "text-gray-700")
            }
          >
            <Icon className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
