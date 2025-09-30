import { describe, it, expect, beforeEach } from 'vitest'
import { getJSON, setJSON, remove } from '@/lib/localStorage'

describe('localStorage helper', () => {
  beforeEach(() => {
    try { window.localStorage.clear() } catch {}
  })

  it('setJSON and getJSON should persist and retrieve objects', () => {
    const key = 'test:key'
    const value = { a: 1, b: 'two' }
    setJSON(key, value)
    const read = getJSON<typeof value>(key, null)
    expect(read).toEqual(value)
  })

  it('getJSON returns fallback when missing or invalid', () => {
    const key = 'missing:key'
    const fallback = { foo: 'bar' }
    const read = getJSON(key, fallback)
    expect(read).toEqual(fallback)

    // invalid JSON should return fallback and remove broken entry
    window.localStorage.setItem('bad:key', "{not: 'json'}")
    const read2 = getJSON('bad:key', fallback)
    expect(read2).toEqual(fallback)
    expect(window.localStorage.getItem('bad:key')).toBeNull()
  })

  it('remove should delete the key', () => {
    const key = 'to:remove'
    setJSON(key, { ok: true })
    remove(key)
    expect(window.localStorage.getItem(key)).toBeNull()
  })
})
