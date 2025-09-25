'use client'

import React, { createContext, useContext, useState } from 'react'

const NotificationContext = createContext<any>(null)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<{ id: string; text: string; type?: string }[]>([])
  const push = (text: string, type = 'info') => {
    const id = String(Date.now())
    setMessages(prev => [...prev, { id, text, type }])
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 6000)
  }
  return (
    <NotificationContext.Provider value={{ messages, push }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {messages.map(m => (
          <div key={m.id} className={`px-4 py-2 rounded shadow ${m.type === 'error' ? 'bg-red-600 text-white' : 'bg-white border'}`}>
            {m.text}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
