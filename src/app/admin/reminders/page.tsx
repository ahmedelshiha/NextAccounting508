import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import RunRemindersButton from '@/components/admin/RunRemindersButton'
import StandardPage from '@/components/dashboard/templates/StandardPage'

/**
 * Admin Reminders Page
 * - Wrapped in StandardPage to align with the unified admin shell
 * - Preserves existing Prisma query and RunRemindersButton behavior
 * - Adds accessible table markup while keeping original styling conventions
 */
export default async function AdminRemindersPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return (
      <StandardPage title="Reminders" subtitle="View and manage pending reminders">
        <div className="p-6"><h1 className="text-xl font-semibold">Unauthorized</h1></div>
      </StandardPage>
    )
  }

  const pending = await prisma.scheduledReminder.findMany({
    where: { sent: false },
    include: {
      serviceRequest: {
        select: {
          id: true,
          clientId: true,
          clientName: true,
          clientEmail: true,
          scheduledAt: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 200,
  }).catch(() => [])

  return (
    <StandardPage title="Reminders" subtitle="View and manage pending reminders">
      <div className="mb-4">
        <RunRemindersButton />
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="min-w-full text-left text-sm" aria-label="Pending reminders table">
          <caption className="sr-only">Pending reminders</caption>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2">Reminder ID</th>
              <th scope="col" className="px-4 py-2">Service</th>
              <th scope="col" className="px-4 py-2">Client</th>
              <th scope="col" className="px-4 py-2">Email</th>
              <th scope="col" className="px-4 py-2">Scheduled At</th>
              <th scope="col" className="px-4 py-2">Channel</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.id}</td>
                <td className="px-4 py-2">{r.serviceRequest?.service?.name || '-'}</td>
                <td className="px-4 py-2">{r.serviceRequest?.clientName || r.serviceRequest?.clientId}</td>
                <td className="px-4 py-2">{r.serviceRequest?.clientEmail || '-'}</td>
                <td className="px-4 py-2">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-2">{r.channel}</td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td className="px-4 py-3" colSpan={6}>No pending reminders.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </StandardPage>
  )
}
