"use client"

import PageHeader from '@/components/dashboard/PageHeader'
import ServicesList from '@/components/dashboard/lists/ServicesList'

export default function ServicesListPage() {
  return (
    <div className="px-6 py-4">
      <PageHeader title="Services" subtitle="Activate, deactivate, and export services" />
      <ServicesList />
    </div>
  )
}
