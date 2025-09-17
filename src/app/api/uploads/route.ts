import { NextResponse } from 'next/server'
import { fileTypeFromBuffer } from 'file-type'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
]

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
  const detectedMime = sniff?.mime || file.type || ''
  if (ALLOWED_TYPES.length && detectedMime && !ALLOWED_TYPES.includes(detectedMime)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
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
        const mod = (await import('@netlify/blobs')) as any
        const Blobs = mod.Blobs || mod.default?.Blobs || mod
        const store = new Blobs({ token })
        const safeName = typeof (file as any).name === 'string' ? String((file as any).name).replace(/[^a-zA-Z0-9._-]/g, '_') : 'upload.bin'
        const key = `${folder}/${Date.now()}-${(randomUUID?.() || Math.random().toString(36).slice(2))}-${safeName}`
        await store.set(key, buf, { contentType: detectedMime || (file as any).type || 'application/octet-stream' })
        const url = typeof store.getPublicUrl === 'function' ? store.getPublicUrl(key) : undefined
        return NextResponse.json({ success: true, data: { key, url, contentType: detectedMime, size: buf.length } })
      } catch (e) {
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
