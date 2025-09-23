'use client'

import { useState } from 'react'
import { Search, Bell, Settings, User, ChevronDown, HelpCircle } from 'lucide-react'

export default function Topbar() {
  const [open, setOpen] = useState<'none' | 'notifications' | 'profile'>('none')
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg">
            <span className="font-medium">Accounting Firm</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Accountant tools</button>
        </div>
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="Search transactions, clients, bookings..." />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-500 hover:text-gray-700"><HelpCircle className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setOpen((v) => (v === 'notifications' ? 'none' : 'notifications'))} className="relative p-2 text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {open === 'notifications' && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 text-sm text-gray-700">
                <div className="px-4 pb-2 font-medium">Notifications</div>
                <div className="px-4 py-6 text-center text-gray-500">No new notifications</div>
              </div>
            )}
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700"><Settings className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setOpen((v) => (v === 'profile' ? 'none' : 'profile'))} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full grid place-items-center"><User className="w-4 h-4 text-white" /></div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {open === 'profile' && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@example.com</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Profile Settings</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
