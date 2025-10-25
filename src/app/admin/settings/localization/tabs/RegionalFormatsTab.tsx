'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { toast } from 'sonner'
import { REGIONAL_FORMAT_PRESETS } from '../constants'
import { useCache, invalidateLanguageCaches } from '../hooks/useCache'
import { useFormMutation } from '../hooks/useFormMutation'
import { useFormValidation } from '../hooks/useFormValidation'

interface FormatState {
  [languageCode: string]: {
    dateFormat: string
    timeFormat: string
    currencyCode: string
    currencySymbol: string
    numberFormat: string
    decimalSeparator: string
    thousandsSeparator: string
  }
}

export const RegionalFormatsTab: React.FC = () => {
  const { languages, saving, setSaving } = useLocalizationContext()
  const { cachedFetch } = useCache()
  const [loading, setLoading] = useState(true)
  const [formats, setFormats] = useState<FormatState>({})
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [previewDate] = useState(new Date(2025, 9, 21))
  const [previewNumber] = useState(1234.56)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadFormats()
  }, [])

  useEffect(() => {
    if (!selectedLanguage && languages.filter(l => l.enabled).length > 0) {
      setSelectedLanguage(languages.filter(l => l.enabled)[0].code)
    }
  }, [languages, selectedLanguage])

  async function loadFormats() {
    try {
      setLoading(true)
      const d = await cachedFetch<{ data: any[] }>('/api/admin/regional-formats', {
        ttlMs: 5 * 60 * 1000, // 5 minute cache
      })
      if (d.data) {
        const formatMap: FormatState = {}
        d.data.forEach((format: any) => {
          formatMap[format.language] = {
            dateFormat: format.dateFormat,
            timeFormat: format.timeFormat,
            currencyCode: format.currencyCode,
            currencySymbol: format.currencySymbol,
            numberFormat: format.numberFormat,
            decimalSeparator: format.decimalSeparator,
            thousandsSeparator: format.thousandsSeparator,
          }
        })
        setFormats(formatMap)
      }
    } catch (e: any) {
      console.error('Failed to load regional formats:', e)
    } finally {
      setLoading(false)
    }
  }

  const { saving: mutationSaving, mutate } = useFormMutation()

  async function saveFormat(languageCode: string) {
    const format = formats[languageCode]
    const newErrors = validateFormats(format)

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix validation errors before saving')
      return
    }

    setSaving(true)
    try {
      const res = await mutate('/api/admin/regional-formats', 'PUT', { language: languageCode, ...format }, { invalidate: ['api/admin/regional-formats', 'api/admin/languages'] })
      if (!res.ok) {
        toast.error(res.error || 'Failed to save regional format')
        return
      }
      setErrors({})
      toast.success(`Regional format saved for ${languageCode}`)
      invalidateLanguageCaches()
      await loadFormats()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save regional format')
    } finally {
      setSaving(false)
    }
  }

  function applyTemplate(languageCode: string, templateKey: string) {
    const template = REGIONAL_FORMAT_PRESETS[templateKey]
    if (template) {
      setFormats(prev => ({
        ...prev,
        [languageCode]: {
          dateFormat: template.dateFormat,
          timeFormat: template.timeFormat,
          currencyCode: template.currencyCode,
          currencySymbol: template.currencySymbol,
          numberFormat: template.numberFormat,
          decimalSeparator: template.decimalSeparator,
          thousandsSeparator: template.thousandsSeparator,
        },
      }))
      setErrors({})
      toast.success(`Applied ${templateKey} template`)
    }
  }

  function copyFromLanguage(sourceLanguage: string, targetLanguage: string) {
    const sourceFormat = formats[sourceLanguage]
    if (sourceFormat) {
      setFormats(prev => ({
        ...prev,
        [targetLanguage]: { ...sourceFormat },
      }))
      setErrors({})
      toast.success(`Copied format from ${sourceLanguage} to ${targetLanguage}`)
    }
  }

  const { validateFormat } = useFormValidation()

  function validateFormats(format: any): Record<string, string> {
    return validateFormat(format)
  }

  function getPreviewText(languageCode: string): string {
    const format = formats[languageCode]
    if (!format) return 'Loading...'

    const dateParts = format.dateFormat
      .replace('YYYY', previewDate.getFullYear().toString())
      .replace('MM', String(previewDate.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(previewDate.getDate()).padStart(2, '0'))

    const currencySymbol = format.currencySymbol
    const separator = format.thousandsSeparator
    const decimal = format.decimalSeparator
    const formattedNumber = `${currencySymbol}1${separator}234${decimal}56`

    return `${dateParts} | ${formattedNumber}`
  }

  if (loading) {
    return <div className="text-gray-600 py-8 text-center">Loading formats...</div>
  }

  const enabledLanguages = languages.filter(l => l.enabled)
  const currentLanguage = enabledLanguages.find(l => l.code === selectedLanguage)

  if (!currentLanguage) {
    return <div className="text-gray-600 py-8 text-center">No enabled languages available</div>
  }

  const format = formats[selectedLanguage] || {
    dateFormat: '',
    timeFormat: '',
    currencyCode: '',
    currencySymbol: '',
    numberFormat: '',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  }

  return (
    <div className="space-y-6">
      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            💡 Select a language to configure regional formats and apply templates.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Language</label>
              <select
                value={selectedLanguage}
                onChange={e => {
                  setSelectedLanguage(e.target.value)
                  setErrors({})
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {enabledLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Copy From Another Language</label>
              <select
                defaultValue=""
                onChange={e => {
                  if (e.target.value) {
                    copyFromLanguage(e.target.value, selectedLanguage)
                    e.target.value = ''
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select a language to copy from...</option>
                {enabledLanguages.filter(l => l.code !== selectedLanguage).map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">{currentLanguage.flag || '🌐'}</span>
            {currentLanguage.name} ({currentLanguage.nativeName})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <input
                type="text"
                value={format.dateFormat}
                onChange={e => {
                  setFormats(prev => ({
                    ...prev,
                    [selectedLanguage]: { ...format, dateFormat: e.target.value },
                  }))
                  if (errors.dateFormat) setErrors(e => ({ ...e, dateFormat: '' }))
                }}
                placeholder="MM/DD/YYYY"
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.dateFormat ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.dateFormat && <p className="text-xs text-red-600 mt-1">{errors.dateFormat}</p>}
              <p className="text-xs text-gray-600 mt-1">e.g., MM/DD/YYYY, DD/MM/YYYY</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
              <input
                type="text"
                value={format.timeFormat}
                onChange={e => {
                  setFormats(prev => ({
                    ...prev,
                    [selectedLanguage]: { ...format, timeFormat: e.target.value },
                  }))
                  if (errors.timeFormat) setErrors(e => ({ ...e, timeFormat: '' }))
                }}
                placeholder="HH:MM"
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.timeFormat ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.timeFormat && <p className="text-xs text-red-600 mt-1">{errors.timeFormat}</p>}
              <p className="text-xs text-gray-600 mt-1">e.g., HH:MM, HH:MM AM</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
              <input
                type="text"
                value={format.currencyCode}
                onChange={e => {
                  setFormats(prev => ({
                    ...prev,
                    [selectedLanguage]: { ...format, currencyCode: e.target.value },
                  }))
                  if (errors.currencyCode) setErrors(e => ({ ...e, currencyCode: '' }))
                }}
                placeholder="USD"
                maxLength={3}
                className={`w-full px-3 py-2 border rounded-md text-sm uppercase ${errors.currencyCode ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.currencyCode && <p className="text-xs text-red-600 mt-1">{errors.currencyCode}</p>}
              <p className="text-xs text-gray-600 mt-1">ISO 4217 code</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={format.currencySymbol}
                onChange={e => {
                  setFormats(prev => ({
                    ...prev,
                    [selectedLanguage]: { ...format, currencySymbol: e.target.value },
                  }))
                  if (errors.currencySymbol) setErrors(e => ({ ...e, currencySymbol: '' }))
                }}
                placeholder="$"
                maxLength={5}
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.currencySymbol ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.currencySymbol && <p className="text-xs text-red-600 mt-1">{errors.currencySymbol}</p>}
              <p className="text-xs text-gray-600 mt-1">e.g., $, €, ₹, د.إ</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Separator</label>
              <input
                type="text"
                value={format.decimalSeparator}
                onChange={e => {
                  setFormats(prev => ({
                    ...prev,
                    [selectedLanguage]: { ...format, decimalSeparator: e.target.value },
                  }))
                }}
                placeholder="."
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">Usually . or ,</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thousands Separator</label>
              <input
                type="text"
                value={format.thousandsSeparator}
                onChange={e => {
                  setFormats(prev => ({
                    ...prev,
                    [selectedLanguage]: { ...format, thousandsSeparator: e.target.value },
                  }))
                }}
                placeholder=","
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">Usually , or .</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number Format</label>
              <input
                type="text"
                value={format.numberFormat}
                onChange={e => {
                  setFormats(prev => ({
                    ...prev,
                    [selectedLanguage]: { ...format, numberFormat: e.target.value },
                  }))
                  if (errors.numberFormat) setErrors(e => ({ ...e, numberFormat: '' }))
                }}
                placeholder="#,##0.00"
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.numberFormat ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.numberFormat && <p className="text-xs text-red-600 mt-1">{errors.numberFormat}</p>}
              <p className="text-xs text-gray-600 mt-1">Symbolic format</p>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-xs text-gray-600 mb-1">Preview:</p>
            <code className="text-sm text-gray-900">{getPreviewText(selectedLanguage)}</code>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(REGIONAL_FORMAT_PRESETS)
                .filter(key => key.startsWith(selectedLanguage))
                .map(key => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(selectedLanguage, key)}
                    className="px-3 py-1 text-xs rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {key}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveFormat(selectedLanguage)}
              disabled={saving}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Format'}
            </button>
          </div>
        </div>
      </PermissionGate>
    </div>
  )
}
