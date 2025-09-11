type Meta = Record<string, unknown>

function emit(level: 'info' | 'warn' | 'error', msg: string, meta?: Meta) {
  const line = JSON.stringify({
    level,
    msg,
    ts: new Date().toISOString(),
    ...(meta || {}),
  })
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](line)
}

export function logInfo(msg: string, meta?: Meta) { emit('info', msg, meta) }
export function logWarn(msg: string, meta?: Meta) { emit('warn', msg, meta) }
export function logError(msg: string, meta?: Meta) { emit('error', msg, meta) }
