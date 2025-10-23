import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { Suspense } from 'react'
import LocalizationContent from './LocalizationContent.new'
import { LocalizationProvider } from './LocalizationProvider'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { Globe } from 'lucide-react'

export default async function Page() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined

  if (!session?.user || !hasPermission(role, PERMISSIONS.LANGUAGES_VIEW)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
      </div>
    )
  }

  return (
    <LocalizationProvider>
      <Suspense fallback={
        <SettingsShell
          title="Localization & Languages"
          description="Manage languages, translations, and localization settings"
          icon={Globe}
          loading={true}
        >
          <div />
        </SettingsShell>
      }>
        <LocalizationContent />
      </Suspense>
    </LocalizationProvider>
  )
}
