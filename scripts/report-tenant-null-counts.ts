import { Client } from 'pg'

interface TargetTable {
  table: string
  column: string
  expected: 'present' | 'missing'
  description: string
}

interface TableReport {
  table: string
  column: string
  columnStatus: 'present' | 'missing'
  expected: 'present' | 'missing'
  totalRows?: bigint
  nullRows?: bigint
  nullPercentage?: number
  note?: string
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`
}

const targets: TargetTable[] = [
  { table: 'services', column: 'tenantId', expected: 'present', description: 'Service catalog entries' },
  { table: 'ServiceRequest', column: 'tenantId', expected: 'present', description: 'Client service requests' },
  { table: 'Booking', column: 'tenantId', expected: 'present', description: 'Bookings (Phase 2 column added, pending backfill)' },
  { table: 'WorkOrder', column: 'tenantId', expected: 'present', description: 'Operational work orders' },
  { table: 'invoices', column: 'tenantId', expected: 'present', description: 'Invoices' },
  { table: 'expenses', column: 'tenantId', expected: 'present', description: 'Expenses' },
  { table: 'attachments', column: 'tenantId', expected: 'present', description: 'Uploaded attachments' },
  { table: 'ScheduledReminder', column: 'tenantId', expected: 'present', description: 'Scheduled reminders' },
  { table: 'chat_messages', column: 'tenantId', expected: 'present', description: 'Chat transcripts' },
  { table: 'booking_settings', column: 'tenantId', expected: 'present', description: 'Tenant booking configuration' },
  { table: 'IdempotencyKey', column: 'tenantId', expected: 'present', description: 'Idempotency keys' }
]

async function run(): Promise<void> {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    console.error('NETLIFY_DATABASE_URL or DATABASE_URL must be set')
    process.exit(2)
  }

  const schema = (process.env.POSTGRES_SCHEMA || 'public').replace(/"/g, '')
  const client = new Client({ connectionString })

  await client.connect()

  try {
    const reports: TableReport[] = []

    for (const target of targets) {
      const infoRes = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
         ) AS exists`,
        [schema, target.table, target.column]
      )

      const columnPresent = infoRes.rows[0]?.exists === true
      const report: TableReport = {
        table: target.table,
        column: target.column,
        columnStatus: columnPresent ? 'present' : 'missing',
        expected: target.expected
      }

      if (columnPresent) {
        const tableIdent = `${quoteIdentifier(schema)}.${quoteIdentifier(target.table)}`
        const columnIdent = quoteIdentifier(target.column)

        const totalRes = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM ${tableIdent}`
        )
        const nullRes = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM ${tableIdent} WHERE ${columnIdent} IS NULL`
        )

        const total = BigInt(totalRes.rows[0]?.count ?? '0')
        const nulls = BigInt(nullRes.rows[0]?.count ?? '0')

        report.totalRows = total
        report.nullRows = nulls
        report.nullPercentage = total === BigInt(0) ? 0 : Number((nulls * BigInt(10000)) / total) / 100

        if (nulls > BigInt(0)) {
          report.note = `${nulls} rows require backfill`
        }
      } else {
        report.note = 'Column missing'
      }

      reports.push(report)
    }

    printReport(reports)

    const unexpectedMissing = reports.filter((r) => r.expected === 'present' && r.columnStatus === 'missing')
    if (unexpectedMissing.length) {
      console.error('\nUnexpected missing columns detected:')
      for (const miss of unexpectedMissing) {
        console.error(`- ${miss.table}.${miss.column}`)
      }
      process.exit(1)
    }
  } finally {
    await client.end().catch(() => {})
  }
}

function printReport(reports: TableReport[]): void {
  const header = ['Table', 'Column', 'Status', 'Expected', 'Total', 'NULL', 'NULL %', 'Notes']
  const rows = reports.map((r) => [
    r.table,
    r.column,
    r.columnStatus,
    r.expected,
    typeof r.totalRows === 'bigint' ? r.totalRows.toString() : '—',
    typeof r.nullRows === 'bigint' ? r.nullRows.toString() : '—',
    typeof r.nullPercentage === 'number' ? `${r.nullPercentage.toFixed(2)}%` : '—',
    r.note ?? ''
  ])

  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)))

  const formatRow = (row: string[]) =>
    row
      .map((cell, index) => cell.padEnd(widths[index]))
      .join('  ')

  console.log(formatRow(header))
  console.log(widths.map((w) => '-'.repeat(w)).join('  '))
  for (const row of rows) {
    console.log(formatRow(row))
  }
}

run().catch((error) => {
  console.error('Error generating tenantId NULL report:', error)
  process.exit(1)
})
