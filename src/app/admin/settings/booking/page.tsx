import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import BookingSettingsPanel from '@/components/admin/BookingSettingsPanel'
import { PERMISSIONS } from '@/lib/permissions'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'

export default function AdminBookingSettingsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.BOOKING_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to Booking Settings.</div>}>
      <SettingsShell
        title="Booking Settings"
        description="Manage booking rules and availability preferences"
        actions={(
          <div className="flex items-center gap-2">
            <FavoriteToggle settingKey="booking" route="/admin/settings/booking" label="Booking Configuration" />
          </div>
        )}
      >
        <div className="p-0">
          <BookingSettingsPanel showHeaderText={false} />
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}
