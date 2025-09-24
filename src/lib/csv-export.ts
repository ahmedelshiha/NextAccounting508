// Utilities to generate CSV safely and stream large responses without blocking the event loop

export function toCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return '"' + s.replace(/"/g, '""') + '"'
}

export function streamCsv(args: { header: string[]; writeRows: (write: (line: string) => void) => Promise<void> }): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (line: string) => controller.enqueue(encoder.encode(line + '\n'))
      write(args.header.map(toCsvCell).join(','))
      await args.writeRows(write)
      try { controller.close() } catch {}
    },
    cancel() {},
  })
}

// Small debounce helper suitable for client-side usage when triggering exports
// It returns a wrapper that ensures rapid repeated calls coalesce into a single invocation
export function debouncePromise<T extends any[]>(fn: (...args: T) => Promise<void> | void, delay = 400) {
  let timer: any = null
  return (...args: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { void fn(...args) }, delay)
  }
}
