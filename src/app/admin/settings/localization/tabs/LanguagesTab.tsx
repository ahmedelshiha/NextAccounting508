'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { LanguageEditModal } from '../components/LanguageEditModal'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { TextField, SelectField, Toggle } from '@/components/admin/settings/FormField'
import { toast } from 'sonner'
import { Plus, Trash2, Download, Upload, Star, Edit2 } from 'lucide-react'
import { useCache, invalidateLanguageCaches } from '../hooks/useCache'
import { useFormMutation } from '../hooks/useFormMutation'
import type { LanguageRow } from '../types'

export const LanguagesTab: React.FC = () => {
  const {
    languages,
    setLanguages,
    saving,
    setSaving,
    error,
    setError,
  } = useLocalizationContext()

  const { cachedFetch, invalidateCache } = useCache()
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<LanguageRow | null>(null)

  useEffect(() => {
    loadLanguages()
  }, [])

  async function loadLanguages() {
    try {
      setLoading(true)
      const d = await cachedFetch<{ data: LanguageRow[] }>('/api/admin/languages', {
        ttlMs: 5 * 60 * 1000, // 5 minute cache
      })
      setLanguages(d.data || [])
    } catch (e: any) {
      console.error('Failed to load languages:', e)
      setError(e?.message || 'Failed to load languages')
    } finally {
      setLoading(false)
    }
  }

  const { saving: mutationSaving, mutate } = useFormMutation()

  async function saveLanguage(language: LanguageRow) {
    setError(null)
    const method = editingLanguage ? 'PUT' : 'POST'
    const url = editingLanguage ? `/api/admin/languages/${encodeURIComponent(editingLanguage.code)}` : '/api/admin/languages'

    const res = await mutate(url as string, method as any, language, { invalidate: ['api/admin/languages'] })
    if (!res.ok) {
      setError(res.error || (editingLanguage ? 'Failed to update language' : 'Failed to create language'))
      toast.error(res.error || (editingLanguage ? 'Failed to update language' : 'Failed to create language'))
      return
    }

    toast.success(editingLanguage ? 'Language updated successfully' : 'Language added successfully')
    setModalOpen(false)
    setEditingLanguage(null)
    await loadLanguages()
  }

  async function toggleLanguage(code: string) {
    setError(null)
    const res = await mutate(`/api/admin/languages/${encodeURIComponent(code)}/toggle`, 'PATCH', undefined, { invalidate: ['api/admin/languages'] })
    if (!res.ok) {
      const msg = res.error ?? 'Failed to toggle language'
      setError(msg)
      toast.error(msg)
      return
    }
    await loadLanguages()
    toast.success('Language status updated')
  }

  async function deleteLanguage(code: string) {
    if (!confirm(`Delete language ${code}? This cannot be undone.`)) return
    setError(null)
    const res = await mutate(`/api/admin/languages/${encodeURIComponent(code)}`, 'DELETE', undefined, { invalidate: ['api/admin/languages'] })
    if (!res.ok) {
      const msg = res.error ?? 'Failed to delete language'
      setError(msg)
      toast.error(msg)
      return
    }
    await loadLanguages()
    toast.success('Language deleted')
  }

  async function exportLanguages() {
    try {
      const data = JSON.stringify(languages, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `languages-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Languages exported successfully')
    } catch (e: any) {
      toast.error('Failed to export languages')
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as LanguageRow[]

      const res = await mutate('/api/admin/languages/import', 'POST', { languages: data }, { invalidate: ['api/admin/languages'] })
      if (!res.ok) {
        toast.error(res.error || 'Failed to import languages')
      } else {
        await loadLanguages()
        toast.success(`Imported ${data.length} languages`)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to import languages')
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading languages...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="flex gap-3 justify-end">
          <button
            onClick={exportLanguages}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
              disabled={saving}
            />
          </label>
          <button
            onClick={() => {
              setEditingLanguage(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Language
          </button>
        </div>
      </PermissionGate>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Language</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Enabled</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Featured</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map(lang => (
                <tr key={lang.code} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag || '🌐'}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                        <div className="text-xs text-gray-600">{lang.nativeName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm font-mono text-gray-600">{lang.code}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {lang.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                      <Toggle
                        label=""
                        value={lang.enabled}
                        onChange={() => toggleLanguage(lang.code)}
                      />
                    </PermissionGate>
                    <PermissionGate
                      permission={PERMISSIONS.LANGUAGES_MANAGE}
                      fallback={
                        <span className={`text-xs ${lang.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                          {lang.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      }
                    >
                      <span />
                    </PermissionGate>
                  </td>
                  <td className="px-4 py-3">
                    {lang.featured ? (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <Star className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingLanguage(lang)
                            setModalOpen(true)
                          }}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLanguage(lang.code)}
                          disabled={saving || lang.code === 'en'}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LanguageEditModal
        language={editingLanguage}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingLanguage(null)
        }}
        onSave={saveLanguage}
        saving={saving}
      />
    </div>
  )
}
