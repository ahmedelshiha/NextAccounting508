'use client'

import React, { useEffect, useState } from 'react'
import { useLocalizationContext } from '../LocalizationProvider'
import { toast } from 'sonner'
import { Users, Send, Loader } from 'lucide-react'
import { useFormMutation } from '../hooks/useFormMutation'
import type { LanguageRow } from '../types'

interface User {
  id: string
  name: string
  email: string
}

interface BulkAssignResult {
  success: boolean
  updated: number
  failed: number
  errors: string[]
}

export const BulkUserLanguageAssignPanel: React.FC = () => {
  const { languages } = useLocalizationContext()
  const { mutate, saving } = useFormMutation()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [targetLanguage, setTargetLanguage] = useState<string>('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<BulkAssignResult | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoadingUsers(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const r = await fetch('/api/admin/users', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (r.ok) {
        const d = await r.json()
        setUsers(d.data || [])
      } else {
        toast.error('Failed to load users')
      }
    } catch (e: any) {
      const message = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Failed to load users'
      toast.error(message)
    } finally {
      setLoadingUsers(false)
    }
  }

  function toggleUserSelection(userId: string) {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  function toggleSelectAll() {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)))
    }
  }

  async function applyBulkAssignment() {
    if (selectedUserIds.size === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (!targetLanguage) {
      toast.error('Please select a target language')
      return
    }

    const res = await mutate(
      '/api/admin/users/bulk-language-assign',
      'POST',
      {
        userIds: Array.from(selectedUserIds),
        targetLanguage,
      },
      { invalidate: [] }
    )

    if (res.ok && res.data) {
      const bulkResult = res.data as BulkAssignResult
      setResults(bulkResult)
      setShowResults(true)

      if (bulkResult.success) {
        toast.success(`Successfully updated ${bulkResult.updated} user(s)`)
        setSelectedUserIds(new Set())
        setTargetLanguage('')
      } else {
        toast.warning(`Updated ${bulkResult.updated} user(s), ${bulkResult.failed} failed`)
      }
    } else {
      toast.error(res.error || 'Failed to assign languages')
    }
  }

  const selectedCount = selectedUserIds.size
  const selectedLanguage = languages.find(l => l.code === targetLanguage)

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Bulk Language Assignment</h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Select multiple users and assign them a preferred language in bulk.
      </p>

      {/* User Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">Select Users</label>
          {users.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              {selectedUserIds.size === users.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {loadingUsers ? (
          <div className="text-center py-8 text-gray-600">Loading users...</div>
        ) : users.length > 0 ? (
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {users.map(user => (
              <label
                key={user.id}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>No users available</p>
          </div>
        )}
      </div>

      {/* Language Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Target Language</label>
        <select
          value={targetLanguage}
          onChange={e => setTargetLanguage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Language --</option>
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary and Action */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Summary:</strong> {selectedCount} user(s) will be assigned to{' '}
          {selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.name}` : 'a language'}
        </p>
      </div>

      <button
        onClick={applyBulkAssignment}
        disabled={saving || selectedCount === 0 || !targetLanguage}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Apply to {selectedCount} {selectedCount === 1 ? 'User' : 'Users'}
          </>
        )}
      </button>

      {/* Results */}
      {showResults && results && (
        <div className={`mt-6 p-4 rounded-lg border ${results.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h4 className={`text-sm font-semibold ${results.success ? 'text-green-900' : 'text-yellow-900'} mb-3`}>
            {results.success ? '✓ Bulk Assignment Complete' : '⚠ Bulk Assignment Partial'}
          </h4>

          <div className="space-y-2 text-sm">
            <p className={results.success ? 'text-green-800' : 'text-yellow-800'}>
              <strong>Updated:</strong> {results.updated} user(s)
            </p>
            {results.failed > 0 && (
              <>
                <p className="text-yellow-800">
                  <strong>Failed:</strong> {results.failed} user(s)
                </p>
                {results.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-yellow-300">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">Errors:</p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {results.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                      {results.errors.length > 5 && (
                        <li>• ... and {results.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => setShowResults(false)}
            className="mt-4 text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
