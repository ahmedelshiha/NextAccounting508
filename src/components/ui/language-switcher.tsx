'use client'

import { useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/lib/i18n'
import { locales, localeConfig, Locale } from '@/lib/i18n'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact'
  className?: string
}

export function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslations()
  const [isOpen, setIsOpen] = useState(false)

  const currentLocaleConfig = localeConfig[locale]

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`h-8 px-2 ${className}`}>
            <Globe className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">
              {currentLocaleConfig.nativeName}
            </span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`flex items-center justify-between ${
                loc === locale ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <span className="flex items-center">
                <span className="mr-2">{localeConfig[loc].flag}</span>
                <span>{localeConfig[loc].nativeName}</span>
              </span>
              {loc === locale && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {locales.map((loc, index) => (
        <div key={loc} className="flex items-center">
          <button
            onClick={() => handleLocaleChange(loc)}
            className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
              loc === locale
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            {localeConfig[loc].nativeName}
          </button>
          {index < locales.length - 1 && (
            <span className="text-gray-300 mx-1">|</span>
          )}
        </div>
      ))}
    </div>
  )
}

