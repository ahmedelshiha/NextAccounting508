'use client'

import React, { createContext, useContext, useState } from 'react'

const ViewContext = createContext<any>(null)

export const ViewProvider = ({ children }: { children: React.ReactNode }) => {
  const [viewMode, setViewMode] = useState<'list'|'board'|'calendar'|'table'|'gantt'>('list')
  return <ViewContext.Provider value={{ viewMode, setViewMode }}>{children}</ViewContext.Provider>
}

export const useViewContext = () => useContext(ViewContext)
