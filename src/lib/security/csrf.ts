export function isSameOrigin(request: Request) {
  try {
    const reqUrl = new URL(request.url)
    const origin = request.headers.get('origin')
    if (!origin) return true
    const o = new URL(origin)
    return o.protocol === reqUrl.protocol && o.host === reqUrl.host
  } catch {
    return false
  }
}
