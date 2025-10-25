'use client'

import React, { useState } from 'react'
import { POPULAR_LANGUAGES } from '../constants'
import { TextField, SelectField } from '@/components/admin/settings/FormField'
import { useFormValidation } from '../hooks/useFormValidation'
import { X, ChevronDown } from 'lucide-react'
import type { LanguageRow } from '../types'

interface LanguageEditModalProps {
  language?: LanguageRow | null
  isOpen: boolean
  onClose: () => void
  onSave: (language: LanguageRow) => void
  saving?: boolean
}

export const LanguageEditModal: React.FC<LanguageEditModalProps> = ({
  language,
  isOpen,
  onClose,
  onSave,
  saving = false,
}) => {
  const [formData, setFormData] = useState<LanguageRow>(
    language || {
      code: '',
      name: '',
      nativeName: '',
      direction: 'ltr',
      flag: '🌐',
      bcp47Locale: '',
      enabled: true,
      featured: false,
    }
  )

  const [useCustom, setUseCustom] = useState(!language && !POPULAR_LANGUAGES.find(l => l.code === formData.code))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { validateLanguage } = useFormValidation()

  const validateForm = () => {
    const newErrors = validateLanguage(formData)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePopularLanguageSelect = (lang: LanguageRow) => {
    setFormData(lang)
    setUseCustom(false)
    setErrors({})
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        code: formData.code.toLowerCase(),
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {language ? 'Edit Language' : 'Add Language'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!language && (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Select Popular Language</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {POPULAR_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handlePopularLanguageSelect(lang)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        formData.code === lang.code && !useCustom
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lang.flag}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                          <div className="text-xs text-gray-600">{lang.nativeName}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustom}
                      onChange={e => setUseCustom(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Custom Language</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6" />
            </>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              {language ? 'Language Details' : 'Language Details (Custom)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TextField
                  label="Language Code"
                  value={formData.code}
                  onChange={v => {
                    setFormData(s => ({ ...s, code: v }))
                    if (errors.code) setErrors(e => ({ ...e, code: '' }))
                  }}
                  placeholder="e.g. fr"
                  error={errors.code}
                  disabled={!useCustom && !language && !!formData.code}
                />
                <p className="text-xs text-gray-600 mt-1">2-3 letter code (lowercase)</p>
              </div>

              <div>
                <TextField
                  label="English Name"
                  value={formData.name}
                  onChange={v => {
                    setFormData(s => ({ ...s, name: v }))
                    if (errors.name) setErrors(e => ({ ...e, name: '' }))
                  }}
                  placeholder="e.g. French"
                  error={errors.name}
                />
              </div>

              <div>
                <TextField
                  label="Native Name"
                  value={formData.nativeName}
                  onChange={v => {
                    setFormData(s => ({ ...s, nativeName: v }))
                    if (errors.nativeName) setErrors(e => ({ ...e, nativeName: '' }))
                  }}
                  placeholder="e.g. Français"
                  error={errors.nativeName}
                />
              </div>

              <div>
                <TextField
                  label="BCP47 Locale"
                  value={formData.bcp47Locale}
                  onChange={v => {
                    setFormData(s => ({ ...s, bcp47Locale: v }))
                    if (errors.bcp47Locale) setErrors(e => ({ ...e, bcp47Locale: '' }))
                  }}
                  placeholder="e.g. fr-FR"
                  error={errors.bcp47Locale}
                />
              </div>

              <div>
                <SelectField
                  label="Text Direction"
                  value={formData.direction}
                  onChange={v => setFormData(s => ({ ...s, direction: v as 'ltr' | 'rtl' }))}
                  options={[
                    { value: 'ltr', label: 'Left-to-Right' },
                    { value: 'rtl', label: 'Right-to-Left' },
                  ]}
                />
              </div>

              <div>
                <TextField
                  label="Flag Emoji"
                  value={formData.flag || ''}
                  onChange={v => setFormData(s => ({ ...s, flag: v }))}
                  placeholder="e.g. 🇫🇷"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : language ? 'Update' : 'Add Language'}
          </button>
        </div>
      </div>
    </div>
  )
}
