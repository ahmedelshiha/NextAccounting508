import { NextResponse } from 'next/server'
import { fileTypeFromBuffer } from 'file-type'
import { logAuditSafe } from '@/lib/observability-helpers'
import { getTenantFromRequest, isMultiTenancyEnabled } from '@/lib/tenant'
import { scanBuffer } from '@/lib/clamav'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
]

const AV_POLICY = String(process.env.UPLOADS_AV_POLICY || 'lenient').toLowerCase() as 'lenient' | 'strict'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const folder = String(form.get('folder') || 'uploads')

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const sniff = await fileTypeFromBuffer(buf).catch(() => null as any)
  const detectedMime = sniff?.mime || (file as any).type || ''

  // Stricter extension policy
  const ALLOWED_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'] as const
  const name = typeof (file as any).name === 'string' ? String((file as any).name) : ''
  const extFromName = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  const extFromSniff = (sniff as any)?.ext ? String((sniff as any).ext).toLowerCase() : ''
  const ext = extFromSniff || extFromName

  if ((ALLOWED_TYPES.length && detectedMime && !ALLOWED_TYPES.includes(detectedMime)) || (ext && !ALLOWED_EXTS.includes(ext as any))) {
    try { await logAuditSafe({ action: 'upload:reject', details: { reason: 'unsupported_type', detectedMime, ext, size: buf.length } }) } catch {}
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  // Optional antivirus scan before storing (policy-controlled)
let avScanResult: any = null
let avScanError: any = null
if (process.env.UPLOADS_AV_SCAN_URL) {
  try {
    avScanResult = await scanBuffer(buf)
    if (!avScanResult?.clean) {
      try { await logAuditSafe({ action: AV_POLICY === 'strict' ? 'upload:infected_reject' : 'upload:infected', details: { policy: AV_POLICY, detected: avScanResult?.details || avScanResult } }) } catch {}
      if (AV_POLICY === 'strict') {
        return NextResponse.json({ error: 'File failed antivirus scan', details: avScanResult?.details || avScanResult }, { status: 422 })
      }
      // lenient: continue to store but mark as infected; admin quarantine/actions handle further steps
    }
  } catch (e) {
    avScanError = e
    try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'uploads' }, extra: { step: 'av_scan', policy: AV_POLICY } }) } catch {}
    console.warn('AV scan failed', e)
    try { await logAuditSafe({ action: AV_POLICY === 'strict' ? 'upload:av_error_reject' : 'upload:av_error', details: { error: String(e), policy: AV_POLICY } }) } catch {}
    if (AV_POLICY === 'strict') {
      return NextResponse.json({ error: 'Antivirus scan unavailable, try again later' }, { status: 503 })
    }
    // lenient: proceed with upload and persist avStatus: 'error'
  }
}

  const provider = process.env.UPLOADS_PROVIDER || ''

  // NOTE: No storage SDKs are installed in this environment. When deploying,
  // configure UPLOADS_PROVIDER and related env vars, and extend the switch below.
  switch (provider.toLowerCase()) {
    case 'netlify': {
      const token = process.env.NETLIFY_BLOBS_TOKEN
      if (!token) {
        return NextResponse.json({
          error: 'Missing NETLIFY_BLOBS_TOKEN',
          hint: 'Set NETLIFY_BLOBS_TOKEN and UPLOADS_PROVIDER=netlify in your deploy environment',
        }, { status: 501 })
      }
      try {
        const { randomUUID } = await import('node:crypto')
        let mod: any = null
        if (process.env.NODE_ENV === 'test') {
          mod = await import('@netlify/blobs')
        } else {
          const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
          mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
        }
        if (!mod) {
          return NextResponse.json({
            error: 'Netlify Blobs SDK not available',
            hint: 'Install @netlify/blobs or enable the Netlify Blobs runtime, then redeploy',
          }, { status: 501 })
        }
        const Blobs = (mod as any).Blobs || (mod as any).default?.Blobs || mod
        const store = new Blobs({ token })
        const safeName = typeof (file as any).name === 'string' ? String((file as any).name).replace(/[^a-zA-Z0-9._-]/g, '_') : 'upload.bin'
        const key = `${folder}/${Date.now()}-${(randomUUID?.() || Math.random().toString(36).slice(2))}-${safeName}`
        await store.set(key, buf, { contentType: detectedMime || (file as any).type || 'application/octet-stream' })
        const url = typeof store.getPublicUrl === 'function' ? store.getPublicUrl(key) : undefined
        try { await logAuditSafe({ action: 'upload:create', details: { key, contentType: detectedMime, size: buf.length, provider: 'netlify' } }) } catch {}
        // Persist Attachment record in DB (best-effort)
        try {
          const { default: prisma } = await import('@/lib/prisma')
          const tenantId = getTenantFromRequest(request)

          const avData = (avScanResult || avScanError) ? (() => {
            if (avScanResult) {
              return {
                avStatus: avScanResult.clean ? 'clean' : 'infected',
                avDetails: avScanResult.details || avScanResult,
                avScanAt: new Date(),
                avThreatName: avScanResult.details?.threat_name || avScanResult.details?.threatName || avScanResult.threat_name || avScanResult.threatName || null,
                avScanTime: typeof avScanResult.details?.scan_time === 'number' ? avScanResult.details.scan_time : (typeof avScanResult.scan_time === 'number' ? avScanResult.scan_time : null)
              }
            }
            // avScanError path: persist error state for later rescan
            return {
              avStatus: 'error',
              avDetails: { error: String(avScanError) },
              avScanAt: new Date()
            }
          })() : {}

          await prisma.attachment.create({
            data: {
              key,
              url: url || undefined,
              name: safeName,
              size: buf.length,
              contentType: detectedMime || undefined,
              provider: 'netlify',
              ...(isMultiTenancyEnabled() && tenantId ? { tenantId } : {}),
              ...avData
            }
          })
        } catch (e) {
          try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'uploads' }, extra: { step: 'persist-attachment' } }) } catch {}
        }
        return NextResponse.json({ success: true, data: { key, url, contentType: detectedMime, size: buf.length } })
      } catch (e) {
        try { const { captureError } = await import('@/lib/observability'); await captureError(e, { tags: { route: 'uploads' }, extra: { provider: 'netlify' } }) } catch {}
        console.error('Netlify Blobs upload failed', e)
        return NextResponse.json({ error: 'Upload failed', details: 'Provider error' }, { status: 502 })
      }
    }
    case 'supabase': {
      // Example (requires @supabase/supabase-js at deploy-time):
      // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!)
      // const key = `${folder}/${Date.now()}-${crypto.randomUUID()}`
      // const { data, error } = await supabase.storage.from(process.env.SUPABASE_BUCKET!).upload(key, file, { contentType: file.type })
      // if (error) throw error
      // const { data: pub } = supabase.storage.from(process.env.SUPABASE_BUCKET!).getPublicUrl(key)
      return NextResponse.json({
        error: 'Storage provider not configured in this environment',
        hint: 'Set UPLOADS_PROVIDER=supabase and required credentials on deploy',
      }, { status: 501 })
    }
    default: {
      return NextResponse.json({
        error: 'No storage provider configured',
        hint: 'Set UPLOADS_PROVIDER to netlify or supabase and provide credentials',
      }, { status: 501 })
    }
  }
}
