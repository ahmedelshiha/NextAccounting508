import PermissionGate from '@/components/PermissionGate'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import BookingSettingsPanel from '@/components/admin/BookingSettingsPanel'
import { PERMISSIONS } from '@/lib/permissions'

export default function AdminBookingSettingsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.BOOKING_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to Booking Settings.</div>}>
      <StandardPage title="Booking Settings" subtitle="Manage booking rules and availability preferences">
        <div className="p-0">
          <BookingSettingsPanel />
        </div>
      </StandardPage>
    </PermissionGate>
  )
}
