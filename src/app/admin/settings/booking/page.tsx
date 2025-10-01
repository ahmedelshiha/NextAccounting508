import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import BookingSettingsPanel from '@/components/admin/BookingSettingsPanel'
import { PERMISSIONS } from '@/lib/permissions'

export default function AdminBookingSettingsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.BOOKING_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to Booking Settings.</div>}>
      <SettingsShell title="Booking Settings" description="Manage booking rules and availability preferences">
        <div className="p-0">
          <BookingSettingsPanel />
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}
