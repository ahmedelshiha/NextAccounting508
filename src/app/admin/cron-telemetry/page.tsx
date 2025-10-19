import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { formatISO } from 'date-fns'

// Server component to display recent cron reminder telemetry for admins.
// This component queries the healthLog audit entries directly (best-effort) and
// renders a compact dashboard with recent run summaries and aggregated tenant stats.
import { redirect } from 'next/navigation'

export default async function Page() {
  // Permanently redirect old route to the new Settings-based location
  redirect('/admin/settings/cron-telemetry')
}
