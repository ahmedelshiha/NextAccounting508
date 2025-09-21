import AdminChatConsole from '@/components/admin/chat/AdminChatConsole'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export const metadata = { title: 'Admin Chat' }

export default function Page() {
  return (
    <PermissionGate permission={[PERMISSIONS.SERVICE_REQUESTS_READ_ALL, PERMISSIONS.SERVICE_REQUESTS_UPDATE]} fallback={<div className="p-6">You do not have access to chat.</div>}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Live Support Chat</h1>
        <AdminChatConsole />
      </div>
    </PermissionGate>
  )
}
