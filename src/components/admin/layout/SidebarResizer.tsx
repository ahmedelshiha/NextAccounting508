'use client'

import React, { useState } from 'react'

interface SidebarResizerProps {
  ariaValueNow?: number
  onKeyDown: (e: React.KeyboardEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onTouchStart: (e: React.TouchEvent) => void
}

export default function SidebarResizer({ ariaValueNow, onKeyDown, onMouseDown, onTouchStart }: SidebarResizerProps) {
  const [isActive, setIsActive] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsActive(true)
    onMouseDown(e)
  }

  const handleMouseUp = () => {
    setIsActive(false)
  }

  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      aria-valuenow={ariaValueNow}
      aria-label="Resize sidebar"
      onKeyDown={onKeyDown}
      onMouseDown={handleMouseDown}
      onTouchStart={onTouchStart}
      className={`absolute top-0 right-0 h-full w-2 -mr-1 cursor-col-resize z-40 group transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      <div className={`h-full w-1 mx-auto transition-colors duration-200 ${isActive ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-gray-400'}`}></div>
    </div>
  )
}
