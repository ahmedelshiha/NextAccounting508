import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Task Management Dev',
  description: 'Development mount for task management workspace'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen font-sans text-gray-900">
        {children}
      </body>
    </html>
  )
}
