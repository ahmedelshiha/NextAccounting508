'use client'
import React, { useState, useEffect } from 'react'

export default function Tabs({ tabs, active, onChange }:{ tabs: { key:string; label:string }[]; active?:string; onChange?: (k:string)=>void }){
  const [current, setCurrent] = useState<string>(active ?? (tabs[0]?.key ?? ''))
  useEffect(()=>{ if (active && active !== current) setCurrent(active) }, [active])
  const handle = (k:string)=>{ setCurrent(k); onChange?.(k) }

  return (
    <div>
      <div role="tablist" aria-label="Settings tabs" className="flex gap-2 mb-4">
        {tabs.map(t=> (
          <button key={t.key} role="tab" aria-selected={current===t.key} onClick={()=>handle(t.key)} className={`px-3 py-2 rounded-md text-sm ${current===t.key? 'bg-blue-600 text-white':'text-gray-700 bg-gray-50 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
