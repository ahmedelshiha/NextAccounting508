"use client"

import PageHeader from '@/components/dashboard/PageHeader'
import ClientsList from '@/components/dashboard/lists/ClientsList'

export default function ClientsListPage() {
  return (
    <div className="px-6 py-4">
      <PageHeader title="Client List" subtitle="Manage client roles, status, and profiles" />
      <ClientsList />
    </div>
  )
}
