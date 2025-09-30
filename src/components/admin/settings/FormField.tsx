'use client'
import React from 'react'

export function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }){
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2" />
    </div>
  )
}

export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }){
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={(e)=>onChange(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }){
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      </div>
      <div>
        <button type="button" onClick={() => onChange(!value)} className={`w-10 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`} aria-pressed={value}>
          <span className={`block w-4 h-4 bg-white rounded-full transform transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  )
}

export function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }){
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="number" value={String(value)} onChange={(e)=>onChange(Number(e.target.value))} min={min} max={max} className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2" />
    </div>
  )
}
