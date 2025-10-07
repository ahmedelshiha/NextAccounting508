#!/usr/bin/env tsx

import { PrismaClient, UserRole } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

interface CliOptions {
  outputDir: string
  formats: Set<'json' | 'csv'>
}

interface RosterMembership {
  tenantId: string
  tenantName: string
  tenantSlug: string | null
  tenantStatus: string
  membershipRole: string
  isDefault: boolean
}

interface RosterRecord {
  userId: string
  email: string
  name: string | null
  globalRole: UserRole
  department: string | null
  position: string | null
  phone: string | null
  createdAt: string
  tenantMemberships: RosterMembership[]
}

interface TenantContactSummary {
  tenantId: string
  tenantName: string
  tenantSlug: string | null
  tenantStatus: string
  admins: Array<{
    userId: string
    name: string | null
    email: string
    globalRole: UserRole
    membershipRole: string
    isDefault: boolean
  }>
}

const prisma = new PrismaClient()

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const formats: Set<'json' | 'csv'> = new Set(['json', 'csv'])
  let outputDir = path.resolve(process.cwd(), 'exports')

  args.forEach(arg => {
    if (arg.startsWith('--output-dir=')) {
      outputDir = path.resolve(process.cwd(), arg.split('=')[1])
    } else if (arg.startsWith('--format=')) {
      formats.clear()
      const parts = arg
        .split('=')[1]
        .split(',')
        .map(token => token.trim().toLowerCase())
        .filter(Boolean)

      parts.forEach(token => {
        if (token === 'json' || token === 'csv') {
          formats.add(token)
        }
      })

      if (formats.size === 0) {
        formats.add('json')
      }
    }
  })

  return { outputDir, formats }
}

function formatTimestamp(date: Date): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mi = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')

  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

async function ensureDir(targetDir: string) {
  await fs.mkdir(targetDir, { recursive: true })
}

function buildCsv(records: RosterRecord[]): string {
  const header = [
    'user_id',
    'email',
    'name',
    'global_role',
    'department',
    'position',
    'phone',
    'tenant_id',
    'tenant_slug',
    'tenant_name',
    'tenant_status',
    'membership_role',
    'is_default'
  ]

  const rows: string[] = [header.join(',')]

  records.forEach(record => {
    if (record.tenantMemberships.length === 0) {
      rows.push([
        record.userId,
        record.email,
        record.name ?? '',
        record.globalRole,
        record.department ?? '',
        record.position ?? '',
        record.phone ?? '',
        '',
        '',
        '',
        '',
        '',
        ''
      ].map(value => escapeCsv(value)).join(','))
      return
    }

    record.tenantMemberships.forEach(membership => {
      rows.push([
        record.userId,
        record.email,
        record.name ?? '',
        record.globalRole,
        record.department ?? '',
        record.position ?? '',
        record.phone ?? '',
        membership.tenantId,
        membership.tenantSlug ?? '',
        membership.tenantName,
        membership.tenantStatus,
        membership.membershipRole,
        membership.isDefault ? 'true' : 'false'
      ].map(value => escapeCsv(value)).join(','))
    })
  })

  return rows.join('\n')
}

function escapeCsv(value: string | UserRole): string {
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

async function loadRoster(): Promise<{ records: RosterRecord[]; tenants: TenantContactSummary[] }> {
  const rawUsers = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      position: true,
      tenantMemberships: {
        select: {
          role: true,
          isDefault: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true
            }
          }
        }
      }
    },
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }]
  })

  const records: RosterRecord[] = rawUsers.map(user => {
    const memberships: RosterMembership[] = user.tenantMemberships
      .filter(membership => membership.tenant !== null)
      .map(membership => ({
        tenantId: membership.tenant!.id,
        tenantName: membership.tenant!.name,
        tenantSlug: membership.tenant!.slug,
        tenantStatus: membership.tenant!.status,
        membershipRole: membership.role,
        isDefault: membership.isDefault
      }))

    return {
      userId: user.id,
      email: user.email,
      name: user.name ?? null,
      globalRole: user.role,
      department: user.department ?? null,
      position: user.position ?? null,
      phone: null,
      createdAt: new Date().toISOString(),
      tenantMemberships: memberships
    }
  })

  const tenantMap = new Map<string, TenantContactSummary>()

  records.forEach(record => {
    record.tenantMemberships.forEach(membership => {
      const existing = tenantMap.get(membership.tenantId)
      const entry = existing ?? {
        tenantId: membership.tenantId,
        tenantName: membership.tenantName,
        tenantSlug: membership.tenantSlug,
        tenantStatus: membership.tenantStatus,
        admins: [] as TenantContactSummary['admins']
      }

      entry.admins.push({
        userId: record.userId,
        name: record.name,
        email: record.email,
        globalRole: record.globalRole,
        membershipRole: membership.membershipRole,
        isDefault: membership.isDefault
      })

      if (!existing) {
        tenantMap.set(membership.tenantId, entry)
      }
    })
  })

  const tenants = Array.from(tenantMap.values()).sort((a, b) => a.tenantName.localeCompare(b.tenantName))

  return { records, tenants }
}

async function writeOutputs(records: RosterRecord[], tenants: TenantContactSummary[], options: CliOptions) {
  await ensureDir(options.outputDir)

  const now = new Date()
  const timestamp = formatTimestamp(now)
  const jsonPayload = {
    generatedAt: now.toISOString(),
    adminsFound: records.length,
    tenantContacts: tenants.length,
    records,
    tenants
  }

  if (options.formats.has('json')) {
    const jsonPath = path.join(options.outputDir, `admin-roster-${timestamp}.json`)
    await fs.writeFile(jsonPath, JSON.stringify(jsonPayload, null, 2), 'utf8')
    console.log(`✓ JSON roster written to ${jsonPath}`)
  }

  if (options.formats.has('csv')) {
    const csvPath = path.join(options.outputDir, `admin-roster-${timestamp}.csv`)
    const csvContent = buildCsv(records)
    await fs.writeFile(csvPath, csvContent, 'utf8')
    console.log(`✓ CSV roster written to ${csvPath}`)
  }
}

async function main() {
  const options = parseArgs()
  const { records, tenants } = await loadRoster()

  await writeOutputs(records, tenants, options)

  console.log(`Summary: ${records.length} admin-level users across ${tenants.length} tenants exported.`)
}

main()
  .catch(error => {
    console.error('Failed to export admin roster:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
