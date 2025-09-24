import StandardPage from '@/components/dashboard/templates/StandardPage'
import AvailabilitySlotsManager from '@/components/admin/AvailabilitySlotsManager'

/**
 * Admin Availability Page
 * - Uses the standardized admin workspace container (StandardPage)
 * - Preserves the original content and functionality (AvailabilitySlotsManager)
 * - Keeps spacing aligned with the dashboard shell and a clear page title
 */
export default function AdminAvailabilityPage() {
  return (
    <StandardPage title="Availability" subtitle="Manage team availability slots and scheduling windows">
      <div className="max-w-6xl mx-auto">
        <AvailabilitySlotsManager />
      </div>
    </StandardPage>
  )
}
