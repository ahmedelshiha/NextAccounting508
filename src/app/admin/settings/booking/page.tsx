import PermissionGate from '@/components/PermissionGate'
import BookingSettingsPanel from '@/components/admin/BookingSettingsPanel'
import { PERMISSIONS } from '@/lib/permissions'

export default function AdminBookingSettingsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.BOOKING_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to Booking Settings.</div>}>
      <div className="p-6">
        <BookingSettingsPanel />
      </div>
    </PermissionGate>
  )
}
