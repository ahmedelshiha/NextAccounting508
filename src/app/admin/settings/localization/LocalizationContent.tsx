'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import SettingsShell, { SettingsSection, SettingsCard } from '@/components/admin/settings/SettingsShell'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import Tabs from '@/components/admin/settings/Tabs'
import { AlertCircle, Globe, Zap, BarChart3, Lightbulb } from 'lucide-react'
import { TextField, SelectField, Toggle } from '@/components/admin/settings/FormField'

const tabs = [
  { key: 'languages', label: 'Languages' },
  { key: 'translations', label: 'Translation Dashboard' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'discovery', label: 'Key Discovery' },
  { key: 'settings', label: 'Configuration' },
]

interface LanguageRow {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  flag?: string
  bcp47Locale: string
  enabled: boolean
}

interface TranslationStatus {
  timestamp: string
  summary: {
    totalKeys: number
    enCoveragePct: string
    arCoveragePct: string
    hiCoveragePct: string
  }
  coverage: Record<string, { translated: number; total: number; pct: number }>
  userDistribution: Record<string, number>
}

export default function LocalizationContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('languages')

  // Language management state
  const [languages, setLanguages] = useState<LanguageRow[]>([])
  const [newLang, setNewLang] = useState<LanguageRow>({
    code: '',
    name: '',
    nativeName: '',
    direction: 'ltr',
    flag: '🌐',
    bcp47Locale: '',
    enabled: true,
  })
  const [editing, setEditing] = useState<Record<string, Partial<LanguageRow>>>({})

  // Translation dashboard state
  const [status, setStatus] = useState<TranslationStatus | null>(null)
  const [missingKeys, setMissingKeys] = useState<any[]>([])
  const [recentKeys, setRecentKeys] = useState<any[]>([])

  // General state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && tabs.some(tab => tab.key === t)) setActiveTab(t)
  }, [searchParams])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadLanguages(), loadTranslationStatus()])
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadLanguages() {
    try {
      const r = await fetch('/api/admin/languages', { cache: 'no-store' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load languages')
      setLanguages(d.data || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load languages')
    }
  }

  async function loadTranslationStatus() {
    try {
      const r = await fetch('/api/admin/translations/status', { cache: 'no-store' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load translation status')
      setStatus(d)

      // Load missing keys
      const rMissing = await fetch('/api/admin/translations/missing?limit=10', { cache: 'no-store' })
      if (rMissing.ok) {
        const dMissing = await rMissing.json()
        setMissingKeys(dMissing.data || [])
      }

      // Load recent keys
      const rRecent = await fetch('/api/admin/translations/recent?days=7&limit=10', { cache: 'no-store' })
      if (rRecent.ok) {
        const dRecent = await rRecent.json()
        setRecentKeys(dRecent.data || [])
      }
    } catch (e: any) {
      console.error('Failed to load translation data:', e)
    }
  }

  async function createLanguage() {
    setSaving(true)
    setError(null)
    try {
      const body = { ...newLang, code: newLang.code.toLowerCase() }
      const r = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to create language')
      setNewLang({
        code: '',
        name: '',
        nativeName: '',
        direction: 'ltr',
        flag: '🌐',
        bcp47Locale: '',
        enabled: true,
      })
      await loadLanguages()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to create language')
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit(code: string) {
    const changes = editing[code]
    if (!changes) return
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to update language')
      setEditing(prev => {
        const next = { ...prev }
        delete next[code]
        return next
      })
      await loadLanguages()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to update language')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(code: string) {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}/toggle`, {
        method: 'PATCH',
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to toggle language')
      await loadLanguages()
    } catch (e: any) {
      setError(e?.message || 'Failed to toggle language')
    } finally {
      setSaving(false)
    }
  }

  async function remove(code: string) {
    if (!confirm(`Delete language ${code}? This cannot be undone.`)) return
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: 'DELETE',
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error((d as any)?.error || 'Failed to delete language')
      await loadLanguages()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete language')
    } finally {
      setSaving(false)
    }
  }

  const body = useMemo(() => {
    if (loading) return <div className="text-gray-600">Loading...</div>

    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Languages Tab */}
        {activeTab === 'languages' && (
          <>
            <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
              <div className="rounded-lg border bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Add New Language</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <TextField
                    label="Code"
                    value={newLang.code}
                    onChange={v => setNewLang(s => ({ ...s, code: v }))}
                    placeholder="e.g. fr"
                  />
                  <TextField
                    label="Name"
                    value={newLang.name}
                    onChange={v => setNewLang(s => ({ ...s, name: v }))}
                    placeholder="French"
                  />
                  <TextField
                    label="Native Name"
                    value={newLang.nativeName}
                    onChange={v => setNewLang(s => ({ ...s, nativeName: v }))}
                    placeholder="Français"
                  />
                  <SelectField
                    label="Direction"
                    value={newLang.direction}
                    onChange={v => setNewLang(s => ({ ...s, direction: v as 'ltr' | 'rtl' }))}
                    options={[
                      { value: 'ltr', label: 'LTR' },
                      { value: 'rtl', label: 'RTL' },
                    ]}
                  />
                  <TextField
                    label="BCP47"
                    value={newLang.bcp47Locale}
                    onChange={v => setNewLang(s => ({ ...s, bcp47Locale: v }))}
                    placeholder="fr-FR"
                  />
                  <div className="flex items-end">
                    <button
                      onClick={createLanguage}
                      disabled={
                        saving ||
                        !newLang.code ||
                        !newLang.name ||
                        !newLang.nativeName ||
                        !newLang.bcp47Locale
                      }
                      className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
                    >
                      {saving ? 'Adding...' : 'Add Language'}
                    </button>
                  </div>
                </div>
              </div>
            </PermissionGate>

            <div className="rounded-lg border bg-white overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-600">
                <div className="col-span-2">Code</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Native</div>
                <div className="col-span-2">BCP47</div>
                <div className="col-span-1">Dir</div>
                <div className="col-span-1">Enabled</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div>
                {languages.map(l => {
                  const edit = editing[l.code] || {}
                  const isEditing = !!editing[l.code]
                  return (
                    <div key={l.code} className="grid grid-cols-12 gap-2 px-4 py-2 border-b items-center last:border-b-0 hover:bg-gray-50">
                      <div className="col-span-2 text-sm font-mono">{l.code}</div>
                      <div className="col-span-2">
                        {isEditing ? (
                          <TextField
                            label=""
                            labelHidden
                            value={edit.name ?? l.name}
                            onChange={v => setEditing(p => ({ ...p, [l.code]: { ...edit, name: v } }))}
                          />
                        ) : (
                          <div className="text-sm">{l.name}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {isEditing ? (
                          <TextField
                            label=""
                            labelHidden
                            value={edit.nativeName ?? l.nativeName}
                            onChange={v => setEditing(p => ({ ...p, [l.code]: { ...edit, nativeName: v } }))}
                          />
                        ) : (
                          <div className="text-sm">{l.nativeName}</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {isEditing ? (
                          <TextField
                            label=""
                            labelHidden
                            value={edit.bcp47Locale ?? l.bcp47Locale}
                            onChange={v => setEditing(p => ({ ...p, [l.code]: { ...edit, bcp47Locale: v } }))}
                          />
                        ) : (
                          <div className="text-sm">{l.bcp47Locale}</div>
                        )}
                      </div>
                      <div className="col-span-1">
                        {isEditing ? (
                          <SelectField
                            label=""
                            labelHidden
                            value={edit.direction ?? l.direction}
                            onChange={v =>
                              setEditing(p => ({
                                ...p,
                                [l.code]: { ...edit, direction: v as 'ltr' | 'rtl' },
                              }))
                            }
                            options={[
                              { value: 'ltr', label: 'LTR' },
                              { value: 'rtl', label: 'RTL' },
                            ]}
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {l.direction.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="col-span-1">
                        <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                          <Toggle label="" value={l.enabled} onChange={() => toggle(l.code)} />
                        </PermissionGate>
                        <PermissionGate
                          permission={PERMISSIONS.LANGUAGES_MANAGE}
                          fallback={
                            <span
                              className={`text-xs ${l.enabled ? 'text-green-600' : 'text-gray-500'}`}
                            >
                              {l.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          }
                        >
                          <span />
                        </PermissionGate>
                      </div>
                      <div className="col-span-2 text-right space-x-2">
                        <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                          {!isEditing ? (
                            <button
                              onClick={() => setEditing(p => ({ ...p, [l.code]: {} }))}
                              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 inline-block"
                            >
                              Edit
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => saveEdit(l.code)}
                                disabled={saving}
                                className="px-3 py-1.5 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 inline-block"
                              >
                                Save
                              </button>
                              <button
                                onClick={() =>
                                  setEditing(p => {
                                    const n = { ...p }
                                    delete n[l.code]
                                    return n
                                  })
                                }
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 inline-block"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => remove(l.code)}
                            disabled={saving || l.code === 'en'}
                            className="px-3 py-1.5 border border-red-300 rounded-md text-sm text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 inline-block"
                          >
                            Delete
                          </button>
                        </PermissionGate>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Translation Dashboard Tab */}
        {activeTab === 'translations' && status && (
          <>
            <SettingsSection title="Translation Coverage" description="Current translation status by language">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Keys</p>
                    <p className="text-3xl font-bold">{status.summary.totalKeys}</p>
                  </div>
                </SettingsCard>
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">English</p>
                    <p className="text-3xl font-bold">{status.summary.enCoveragePct}</p>
                  </div>
                </SettingsCard>
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">العربية</p>
                    <p className="text-3xl font-bold">{status.summary.arCoveragePct}</p>
                  </div>
                </SettingsCard>
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">हिन्दी</p>
                    <p className="text-3xl font-bold">{status.summary.hiCoveragePct}</p>
                  </div>
                </SettingsCard>
              </div>
            </SettingsSection>

            {missingKeys.length > 0 && (
              <SettingsSection title="Missing Translations" description="Keys that need translation">
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Key</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">English</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Arabic</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Hindi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missingKeys.map((key, idx) => (
                          <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs">{key.key}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                ✓
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {key.arTranslated ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                  Missing
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {key.hiTranslated ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                  Missing
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SettingsSection>
            )}

            {recentKeys.length > 0 && (
              <SettingsSection title="Recently Added Keys" description="Keys added in the last 7 days">
                <div className="rounded-lg border bg-white p-4">
                  <ul className="space-y-2">
                    {recentKeys.map((key, idx) => (
                      <li key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <span className="font-mono text-sm">{key.key}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(key.addedAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SettingsSection>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <SettingsSection title="Translation Analytics" description="View trends and metrics">
            <div className="rounded-lg border bg-white p-6 text-center text-gray-600">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Translation analytics chart will be displayed here</p>
              <p className="text-sm text-gray-500 mt-2">Historical trends and coverage metrics over time</p>
            </div>
          </SettingsSection>
        )}

        {/* Key Discovery Tab */}
        {activeTab === 'discovery' && (
          <SettingsSection title="Translation Key Discovery" description="Scan code for translation keys">
            <div className="space-y-4">
              <div className="rounded-lg border bg-blue-50 p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Run Key Discovery Audit</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Scan your codebase for all <code className="bg-blue-100 px-1 rounded">t(&apos;key&apos;)</code> calls and identify:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-2">
                  <li>Keys in code but missing from translation files</li>
                  <li>Orphaned keys in translation files not used in code</li>
                  <li>Missing translations for Arabic and Hindi</li>
                </ul>
                <div className="mt-4">
                  <button className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700">
                    Run Discovery Audit
                  </button>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Manual Command</h4>
                <p className="text-sm text-gray-600 mb-2">Run this command in your terminal:</p>
                <code className="block bg-gray-100 px-3 py-2 rounded text-xs font-mono text-gray-800">
                  npm run discover:keys
                </code>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Configuration Tab */}
        {activeTab === 'settings' && (
          <>
            <SettingsSection title="Localization Settings" description="Configure localization behavior">
              <div className="space-y-4">
                <div className="rounded-lg border bg-white p-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Enable RTL Support</p>
                      <p className="text-sm text-gray-500">Automatically apply RTL styles for Arabic</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                  </label>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Persist Language Choice</p>
                      <p className="text-sm text-gray-500">Save user&apos;s language preference to localStorage</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                  </label>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Auto-Detect Browser Language</p>
                      <p className="text-sm text-gray-500">Use browser language on first visit</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
                  </label>
                </div>
              </div>
            </SettingsSection>

            <SettingsCard className="bg-amber-50 border-amber-200">
              <div className="flex gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-900">Translation Best Practices</p>
                  <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                    <li>Keep translation keys short and descriptive</li>
                    <li>Use namespacing (e.g., <code className="bg-amber-100 px-1 rounded">nav.home</code>) for organization</li>
                    <li>Test RTL layouts thoroughly for Arabic translations</li>
                    <li>Review gender-aware translations for languages that require them</li>
                    <li>Run key discovery regularly to find missing translations</li>
                  </ul>
                </div>
              </div>
            </SettingsCard>
          </>
        )}
      </div>
    )
  }, [
    activeTab,
    loading,
    languages,
    newLang,
    editing,
    status,
    missingKeys,
    recentKeys,
    saving,
    error,
  ])

  return (
    <SettingsShell
      title="Localization & Languages"
      description="Manage languages, translations, and localization settings for your organization"
      icon={Globe}
      showBackButton={true}
      saving={saving}
      saved={saved}
      actions={
        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
            {activeTab === 'discovery' && (
              <button
                onClick={() => {
                  /* Handle discovery */
                }}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Run Audit
              </button>
            )}
          </PermissionGate>
          <FavoriteToggle
            settingKey="localization"
            route="/admin/settings/localization"
            label="Localization"
          />
        </div>
      }
      tabs={tabs}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      loading={loading}
    >
      {body}
    </SettingsShell>
  )
}
