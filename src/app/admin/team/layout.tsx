import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Team Management | Admin',
  description: 'Manage staff members, availability, and assignments',
}

export default function TeamSegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
