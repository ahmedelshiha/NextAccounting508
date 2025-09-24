"use client"

import StandardPage from '@/components/dashboard/templates/StandardPage'
import type { TabItem, FilterConfig } from '@/types/dashboard'

export default function StandardPagePreview() {
  const primaryTabs: TabItem[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'archived', label: 'Archived' },
  ]
  const secondaryTabs: TabItem[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'details', label: 'Details' },
  ]
  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      { value: 'all', label: 'All' },
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' }
    ], value: 'all' },
  ]

  return (
    <StandardPage
      title="Standard Template Preview"
      subtitle="Demonstrates header, tabs, filters, and content area"
      primaryAction={{ label: 'Create', onClick: () => alert('Create clicked') }}
      secondaryActions={[{ label: 'Export', onClick: () => alert('Export') }]}
      primaryTabs={primaryTabs}
      activePrimaryTab={'all'}
      onPrimaryTabChange={(k) => console.log('primary tab:', k)}
      secondaryTabs={secondaryTabs}
      activeSecondaryTab={'overview'}
      onSecondaryTabChange={(k) => console.log('secondary tab:', k)}
      filters={filters}
      onFilterChange={(k, v) => console.log('filter', k, v)}
      onSearch={(q) => console.log('search', q)}
      searchPlaceholder="Search items"
    >
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-700">This is the StandardPage content area. Place any components here (forms, lists, charts).</p>
      </div>
    </StandardPage>
  )
}
