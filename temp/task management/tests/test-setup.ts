import '@testing-library/jest-dom'

// Minimal global fetch mock to avoid network calls by components during tests
if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = async () => new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
