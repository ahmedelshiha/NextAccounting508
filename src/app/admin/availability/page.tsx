import AvailabilitySlotsManager from '@/components/admin/AvailabilitySlotsManager'

export default function AdminAvailabilityPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Availability Slots</h1>
      <AvailabilitySlotsManager />
    </div>
  )
}
