const HEX_TABLE = Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, '0'))

async function webCryptoHash(value: string): Promise<string | null> {
  if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle === 'undefined') {
    return null
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', data)
  const view = new Uint8Array(buffer)
  let result = ''
  for (let i = 0; i < view.length; i += 1) {
    result += HEX_TABLE[view[i]]
  }
  return result
}

async function nodeCryptoHash(value: string): Promise<string | null> {
  try {
    const { createHash } = await import('node:crypto')
    return createHash('sha256').update(value).digest('hex')
  } catch {
    return null
  }
}

export async function computeIpHash(value: string): Promise<string> {
  const input = typeof value === 'string' && value.length > 0 ? value : 'anonymous'
  const webResult = await webCryptoHash(input)
  if (webResult) return webResult
  const nodeResult = await nodeCryptoHash(input)
  if (nodeResult) return nodeResult
  return input
}
