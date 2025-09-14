type EventPayload = { type: string, payload?: any }

const subscribers = new Set<(e: EventPayload) => void>()

export function subscribe(fn: (e: EventPayload) => void) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function broadcast(event: EventPayload) {
  try {
    subscribers.forEach(fn => {
      try { fn(event) } catch (e) { /* swallow per-subscriber errors */ }
    })
  } catch (e) { /* noop */ }
}
