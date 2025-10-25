'use client'

import React from 'react'

const SkeletonPulse = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
)

export const LanguagesTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex gap-3 justify-end">
      <SkeletonPulse className="h-10 w-32" />
      <SkeletonPulse className="h-10 w-32" />
      <SkeletonPulse className="h-10 w-32" />
    </div>
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3"><SkeletonPulse className="h-4 w-24" /></th>
              <th className="px-4 py-3"><SkeletonPulse className="h-4 w-16" /></th>
              <th className="px-4 py-3"><SkeletonPulse className="h-4 w-20" /></th>
              <th className="px-4 py-3"><SkeletonPulse className="h-4 w-16" /></th>
              <th className="px-4 py-3"><SkeletonPulse className="h-4 w-16" /></th>
              <th className="px-4 py-3"><SkeletonPulse className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map(i => (
              <tr key={i} className="border-b last:border-b-0">
                <td className="px-4 py-3"><SkeletonPulse className="h-12 w-48" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-8 w-16" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-8 w-20" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-8 w-12" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-8 w-8" /></td>
                <td className="px-4 py-3 text-right"><SkeletonPulse className="h-8 w-32 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

export const OrganizationTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-white p-6">
      <SkeletonPulse className="h-7 w-48 mb-4" />
      <SkeletonPulse className="h-4 w-full mb-6" />
      <div className="space-y-4">
        <div>
          <SkeletonPulse className="h-4 w-32 mb-2" />
          <SkeletonPulse className="h-10 w-full" />
        </div>
        <div>
          <SkeletonPulse className="h-4 w-32 mb-2" />
          <SkeletonPulse className="h-10 w-full" />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t">
        <SkeletonPulse className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          <SkeletonPulse className="h-8 w-full" />
          <SkeletonPulse className="h-8 w-full" />
          <SkeletonPulse className="h-8 w-full" />
        </div>
      </div>
      <div className="mt-6">
        <SkeletonPulse className="h-10 w-32" />
      </div>
    </div>
  </div>
)

export const RegionalFormatsTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-blue-50 p-4">
      <SkeletonPulse className="h-4 w-full" />
    </div>
    <div className="rounded-lg border bg-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <SkeletonPulse className="h-4 w-24 mb-2" />
          <SkeletonPulse className="h-10 w-full" />
        </div>
        <div>
          <SkeletonPulse className="h-4 w-32 mb-2" />
          <SkeletonPulse className="h-10 w-full" />
        </div>
      </div>
      <SkeletonPulse className="h-6 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <SkeletonPulse className="h-4 w-24 mb-2" />
            <SkeletonPulse className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const IntegrationTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-white p-6">
      <SkeletonPulse className="h-7 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <SkeletonPulse className="h-4 w-20 mb-2" />
          <SkeletonPulse className="h-10 w-full" />
        </div>
        <div>
          <SkeletonPulse className="h-4 w-20 mb-2" />
          <SkeletonPulse className="h-10 w-full" />
        </div>
      </div>
      <div className="flex gap-3">
        <SkeletonPulse className="h-10 w-32" />
        <SkeletonPulse className="h-10 w-32" />
      </div>
    </div>
    <div className="rounded-lg border bg-blue-50 p-6">
      <SkeletonPulse className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        <SkeletonPulse className="h-8 w-full" />
        <SkeletonPulse className="h-8 w-full" />
        <SkeletonPulse className="h-8 w-full" />
      </div>
    </div>
    <div className="rounded-lg border bg-white p-6">
      <SkeletonPulse className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonPulse className="h-24 w-full" />
        <SkeletonPulse className="h-24 w-full" />
      </div>
    </div>
  </div>
)

export const TranslationsTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-white p-6">
      <SkeletonPulse className="h-7 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonPulse className="h-32 w-full" />
        <SkeletonPulse className="h-32 w-full" />
      </div>
    </div>
  </div>
)

export const AnalyticsTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-white p-6">
      <SkeletonPulse className="h-7 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <SkeletonPulse key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  </div>
)

export const UserPreferencesTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-white p-6">
      <SkeletonPulse className="h-7 w-48 mb-4" />
      <SkeletonPulse className="h-48 w-full" />
    </div>
  </div>
)

export const DiscoveryTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="flex gap-4">
        <SkeletonPulse className="h-8 w-8 flex-shrink-0" />
        <div className="flex-1">
          <SkeletonPulse className="h-6 w-48 mb-2" />
          <SkeletonPulse className="h-4 w-full mb-4" />
          <div className="space-y-2 mb-4">
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-64" />
          </div>
          <SkeletonPulse className="h-10 w-48" />
        </div>
      </div>
    </div>
  </div>
)
