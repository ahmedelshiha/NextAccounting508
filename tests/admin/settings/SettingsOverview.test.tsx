import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SettingsOverview from '@/components/admin/settings/SettingsOverview'

// Mock services
vi.mock('@/services/settings.service', () => ({
  runDiagnostics: vi.fn(),
  exportSettings: vi.fn(),
  importSettings: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

import { runDiagnostics, exportSettings, importSettings } from '@/services/settings.service'

describe('SettingsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders primary sections', () => {
    render(<SettingsOverview />)

    expect(screen.getByText('System Health')).toBeInTheDocument()
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Recent Changes')).toBeInTheDocument()
    expect(screen.getByText('Pinned Settings')).toBeInTheDocument()
  })

  it('runs diagnostics when button clicked', async () => {
    ;(runDiagnostics as any).mockResolvedValue({ ok: true })
    render(<SettingsOverview />)

    const btn = screen.getByRole('button', { name: /Run Diagnostics/i })
    fireEvent.click(btn)

    // runDiagnostics should have been called
    expect(runDiagnostics).toHaveBeenCalled()
  })

  it('calls exportSettings when export button clicked', async () => {
    ;(exportSettings as any).mockResolvedValue(new Blob([JSON.stringify({})], { type: 'application/json' }))
    render(<SettingsOverview />)

    const exportBtn = screen.getByRole('button', { name: /Export/i })
    fireEvent.click(exportBtn)

    expect(exportSettings).toHaveBeenCalled()
  })

  it('creates file input when import clicked', () => {
    render(<SettingsOverview />)

    const createElSpy = vi.spyOn(document, 'createElement')
    const importBtn = screen.getByRole('button', { name: /Import/i })
    fireEvent.click(importBtn)

    expect(createElSpy).toHaveBeenCalledWith('input')
  })
})
