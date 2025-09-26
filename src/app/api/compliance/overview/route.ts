import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      filingsDue: [
        { title: 'Quarterly Estimated Tax', dueDate: '2025-10-15', status: 'pending' },
        { title: 'Annual Report Filing', dueDate: '2025-11-01', status: 'pending' },
        { title: 'Sales Tax Return', dueDate: '2025-09-30', status: 'overdue' },
      ],
      kyc: [
        { entity: 'Acme LLC', status: 'verified' },
        { entity: 'Globex Inc', status: 'pending' },
        { entity: 'Umbrella Co', status: 'expired' },
      ],
      alerts: [
        { id: 'a1', message: 'Sales tax return overdue for Q3', severity: 'critical' },
        { id: 'a2', message: 'KYC verification pending for Globex Inc', severity: 'warning' },
      ]
    }
  })
}
