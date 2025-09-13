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

// Mock NextResponse.json to be test-friendly
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({ json: async () => data, ok: !init?.status || init.status < 400, status: init?.status || 200 })
    }
  }
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