import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { Suspense } from 'react'
import CronTelemetryContent from './CronTelemetryContent'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { Activity } from 'lucide-react'

export default async function Page() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined

  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <SettingsShell
        title="Cron Reminders Telemetry"
        description="Monitor and configure cron reminder jobs"
        icon={Activity}
        loading={true}
      >
        <div />
      </SettingsShell>
    }>
      <CronTelemetryContent />
    </Suspense>
  )
}
