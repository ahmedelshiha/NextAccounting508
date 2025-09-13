import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Minimal global fetch mock to avoid network calls by components during tests
if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = async () => new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

// Mock EventSource used by TaskProvider
// @ts-ignore
if (typeof globalThis.EventSource === 'undefined') {
  // @ts-ignore
  globalThis.EventSource = class {
    onmessage: ((this: EventSource, ev: MessageEvent) => any) | null = null
    onerror: ((this: EventSource, ev: Event) => any) | null = null
    close() {}
    constructor(public url: string) {}
  } as any
}

// Mock NextResponse to be test-friendly
vi.mock('next/server', () => {
  class NextResponse {
    body: any
    status: number
    headers: Map<string, string>
    ok: boolean
    constructor(body?: any, init?: { status?: number, headers?: Record<string, string> }) {
      this.body = body
      this.status = init?.status ?? 200
      this.headers = new Map<string, string>()
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) this.headers.set(k, String(v))
      }
      this.ok = this.status < 400
    }
    static json(data: any, init?: { status?: number, headers?: Record<string, string> }) {
      return new NextResponse(JSON.stringify(data), init)
    }
    async json() {
      try { return typeof this.body === 'string' ? JSON.parse(this.body) : this.body } catch { return this.body }
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  }
  return { NextResponse }
})

// Stub UI components used in these tests to avoid pulling full design system
vi.mock('@/components/ui/card', () => {
  const Card = (props: any) => <div role="region" {...props} />
  const CardContent = (props: any) => <div role="group" {...props} />
  const CardHeader = (props: any) => <div role="heading" {...props} />
  const CardTitle = (props: any) => <div role="heading" {...props} />
  return { Card, CardContent, CardHeader, CardTitle }
}, { virtual: true })

vi.mock('@/components/ui/button', () => {
  const Button = (props: any) => <button {...props} />
  return { Button }
}, { virtual: true })

vi.mock('@/components/ui/input', () => {
  const Input = (props: any) => <input {...props} />
  return { Input }
}, { virtual: true })

vi.mock('@/components/ui/badge', () => {
  const Badge = (props: any) => <span {...props} />
  return { Badge }
}, { virtual: true })

vi.mock('@/components/ui/dialog', () => {
  const Dialog = (props: any) => <div {...props} />
  const DialogContent = (props: any) => <div {...props} />
  const DialogHeader = (props: any) => <div {...props} />
  const DialogTitle = (props: any) => <div {...props} />
  const DialogDescription = (props: any) => <div {...props} />
  const DialogFooter = (props: any) => <div {...props} />
  return { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
}, { virtual: true })