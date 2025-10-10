'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import Tabs from './Tabs'
import SettingsSearch from '@/components/admin/settings/SettingsSearch'

interface SettingsTabItem { key: string; label: string }

interface SettingsShellProps {
  children: ReactNode

  // Header
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  backHref?: string
  showBackButton?: boolean

  // Actions (rendered in header)
  actions?: ReactNode

  // State indicators
  loading?: boolean
  saving?: boolean
  saved?: boolean
  hasChanges?: boolean

  // Alerts
  errors?: string[]
  warnings?: string[]
  info?: string

  // Layout
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | 'full'
  sidebar?: ReactNode // Optional sidebar for navigation within settings

  // Tabs
  tabs?: SettingsTabItem[]
  activeTab?: string
  onChangeTab?: (key: string) => void
}

export function SettingsShell({
  children,
  title,
  description,
  icon: Icon,
  backHref = '/admin/settings',
  showBackButton = true,
  actions,
  loading = false,
  saving = false,
  saved = false,
  hasChanges = false,
  errors,
  warnings,
  info,
  maxWidth = '2xl',
  sidebar,
  tabs,
  activeTab,
  onChangeTab,
}: SettingsShellProps) {
  const pathname = usePathname()
  
  const maxWidthClass = {
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  }[maxWidth]
  
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-4', maxWidthClass)}>
          <div className="flex items-center justify-between">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="flex-shrink-0"
                >
                  <Link href={backHref}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Link>
                </Button>
              )}
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                  <h1 className="text-xl font-semibold truncate">{title}</h1>
                  
                  {/* Status Indicators */}
                  {saving && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                      Saving...
                    </span>
                  )}
                  {saved && !hasChanges && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                  {hasChanges && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span className="h-2 w-2 bg-amber-500 rounded-full" />
                      Unsaved changes
                    </span>
                  )}
                </div>
                
                {description && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Right: Search + Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <SettingsSearch />
              {actions}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-8', maxWidthClass)}>
        {/* Alerts */}
        <div className="space-y-4 mb-6">
          {errors && errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">
                  {errors.length === 1 ? 'Error' : `${errors.length} Errors`}
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {warnings && warnings.length > 0 && (
            <Alert className="border-amber-500/50 text-amber-900 dark:text-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription>
                <div className="font-medium mb-1">
                  {warnings.length === 1 ? 'Warning' : `${warnings.length} Warnings`}
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {info && (
            <Alert className="border-blue-500/50 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                {info}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Tabs (optional) */}
        {tabs && tabs.length > 0 && (
          <div className="mb-6">
            <Tabs tabs={tabs} active={activeTab} onChange={onChangeTab} />
          </div>
        )}

        {/* Main Content with Optional Sidebar */}
        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-3">
              <div className="sticky top-24">
                {sidebar}
              </div>
            </aside>
            <main className="lg:col-span-9">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        ) : (
          <main>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              children
            )}
          </main>
        )}
      </div>
    </div>
  )
}

/**
 * Optional: Settings Section Component for grouping related fields
 */
interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  id?: string
}

export function SettingsSection({
  title,
  description,
  children,
  id,
}: SettingsSectionProps) {
  return (
    <section id={id} className="space-y-6">
      <div className="border-b pb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  )
}

/**
 * Optional: Settings Card for visual grouping
 */
interface SettingsCardProps {
  children: ReactNode
  className?: string
}

export function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <div className={cn(
      'rounded-lg border bg-card p-6 shadow-sm',
      className
    )}>
      {children}
    </div>
  )
}

export default SettingsShell
