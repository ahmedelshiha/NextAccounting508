'use client'

import { useState, useEffect } from 'react'

export default function SimpleAdminDashboard() {
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date().toLocaleString())
  }, [])

  if (!isClient) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Simple Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Minimal admin dashboard for testing - Current time: {currentTime}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bookings</h3>
              <p className="text-3xl font-bold text-blue-600">127</p>
              <p className="text-sm text-gray-600">Total bookings</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              📅
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Clients</h3>
              <p className="text-3xl font-bold text-green-600">245</p>
              <p className="text-sm text-gray-600">Active clients</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              👥
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
              <p className="text-3xl font-bold text-purple-600">$24,500</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              💰
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-800 font-medium">Database</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              ✅ Healthy
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-800 font-medium">API Services</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              ✅ Healthy
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        This is a simplified admin dashboard for testing. If you can see this, 
        the basic admin layout and SSR suppression is working correctly.
      </div>
    </div>
  )
}