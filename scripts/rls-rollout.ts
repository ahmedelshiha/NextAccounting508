import { Client } from 'pg'
import { normalizeDatabaseUrl, setupTenantRLS } from './setup-rls'

type Phase = 'prepare' | 'tighten' | 'enforce'

type PhaseConfig = {
  allowNullTenant: boolean
  forceRls: boolean
  description: string
}

const PHASE_SEQUENCE: Phase[] = ['prepare', 'tighten', 'enforce']

const PHASE_CONFIG: Record<Phase, PhaseConfig> = {
  prepare: {
    allowNullTenant: true,
    forceRls: false,
    description: 'Enable RLS policies while still permitting NULL tenant rows for legacy data.'
  },
  tighten: {
    allowNullTenant: false,
    forceRls: false,
    description: 'Disallow NULL tenant rows, ensuring every record is assigned before force enforcement.'
  },
  enforce: {
    allowNullTenant: false,
    forceRls: true,
    description: 'Force RLS so even table owners respect tenant isolation.'
  }
}

type AuditRow = {
  schema: string
  table: string
  nullCount: number
}

function readArgValue(flagName: string): string | null {
  const flag = `--${flagName}`
  const exactIndex = process.argv.indexOf(flag)
  if (exactIndex >= 0) {
    const value = process.argv[exactIndex + 1]
    if (value && !value.startsWith('--')) {
      return value.trim()
    }
  }

  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`))
  if (inline) {
    const [, value] = inline.split('=')
    if (value) return value.trim()
  }

  return null
}

function parsePhase(input: string | null): Phase {
  if (!input) return 'prepare'
  const normalized = input.toLowerCase() as Phase | 'auto'
  if (normalized === 'auto') return 'prepare'
  if ((PHASE_SEQUENCE as string[]).includes(normalized)) {
    return normalized as Phase
  }
  throw new Error(`Unknown phase "${input}". Use one of: prepare, tighten, enforce, auto.`)
}

function shouldRunSequential(input: string | null): boolean {
  return input?.toLowerCase() === 'auto' || process.argv.includes('--sequential')
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(`--${flag}`)
}

async function auditNullTenantRows(databaseUrl: string): Promise<AuditRow[]> {
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const { rows } = await client.query<{ table_schema: string; table_name: string }>(
      `SELECT table_schema, table_name
       FROM information_schema.columns
       WHERE column_name = 'tenantId'
         AND table_schema NOT IN ('pg_catalog','information_schema')
       ORDER BY table_schema, table_name`
    )

    const results: AuditRow[] = []
    for (const { table_schema, table_name } of rows) {
      const fq = `"${table_schema}"."${table_name}"`
      const { rows: countRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*)::bigint AS count FROM ${fq} WHERE "tenantId" IS NULL`
      )
      const count = Number(countRows[0]?.count ?? 0)
      results.push({ schema: table_schema, table: table_name, nullCount: count })
    }

    return results
  } finally {
    await client.end()
  }
}

function logAuditSummary(results: AuditRow[]): void {
  if (!results.length) {
    console.log('No tenant tables detected during audit.')
    return
  }
  const offenders = results.filter((row) => row.nullCount > 0)
  if (!offenders.length) {
    console.log('All tenant-scoped tables have tenantId populated. Ready to tighten policies.')
    return
  }

  console.log('Tables with NULL tenantId rows:')
  for (const row of offenders) {
    console.log(`  - ${row.schema}.${row.table}: ${row.nullCount}`)
  }
}

function phaseList(startPhase: Phase, sequential: boolean): Phase[] {
  if (!sequential) return [startPhase]
  const startIndex = PHASE_SEQUENCE.indexOf(startPhase)
  return PHASE_SEQUENCE.slice(startIndex >= 0 ? startIndex : 0)
}

async function executePhase(phase: Phase, databaseUrl: string, options: { dryRun: boolean; force: boolean; verify: boolean }): Promise<void> {
  const config = PHASE_CONFIG[phase]
  console.log(`\n=== Phase: ${phase.toUpperCase()} ===`)
  console.log(config.description)

  if (phase !== 'prepare') {
    const audit = await auditNullTenantRows(databaseUrl)
    const offenders = audit.filter((row) => row.nullCount > 0)
    if (offenders.length && !options.force) {
      logAuditSummary(audit)
      throw new Error('NULL tenantId rows remain. Resolve them or rerun with --force to continue.')
    }
    if (offenders.length && options.force) {
      console.warn('Continuing despite NULL tenantId rows because --force flag was provided.')
      logAuditSummary(audit)
    } else {
      console.log('Pre-check audit complete. No NULL tenantId rows detected.')
    }
  }

  if (options.dryRun) {
    console.log('[dry-run] Would call setupTenantRLS with:', config)
    return
  }

  await setupTenantRLS({
    databaseUrl,
    allowNullTenant: config.allowNullTenant,
    forceRls: config.forceRls,
    verbose: true
  })

  if (options.verify || phase !== 'prepare') {
    const postAudit = await auditNullTenantRows(databaseUrl)
    logAuditSummary(postAudit)
  }
}

async function main() {
  const phaseArg = readArgValue('phase')
  const dryRun = hasFlag('dry-run')
  const force = hasFlag('force')
  const verify = hasFlag('verify') || hasFlag('post-check')
  const sequential = shouldRunSequential(phaseArg)
  const startingPhase = parsePhase(phaseArg)

  const databaseUrl = normalizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
  if (!databaseUrl) {
    console.error('DATABASE_URL/NETLIFY_DATABASE_URL not set. Provide a connection string before running rollout.')
    process.exit(1)
  }

  const phases = phaseList(startingPhase, sequential)
  for (const phase of phases) {
    try {
      await executePhase(phase, databaseUrl, { dryRun, force, verify })
    } catch (err) {
      console.error(`Phase ${phase} failed:`, err)
      process.exit(1)
    }
  }

  console.log('\nRLS rollout sequence completed successfully.')
}

if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error('RLS rollout script failed:', err)
    process.exit(1)
  })
}
