'use client'

import React from 'react'

interface SidebarResizerProps {
  ariaValueNow?: number
  onKeyDown: (e: React.KeyboardEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onTouchStart: (e: React.TouchEvent) => void
}

export default function SidebarResizer({ ariaValueNow, onKeyDown, onMouseDown, onTouchStart }: SidebarResizerProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      aria-valuenow={ariaValueNow}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={`absolute top-0 right-0 h-full w-2 -mr-1 cursor-col-resize z-40`}
    >
      <div className={`h-full w-0.5 mx-auto bg-transparent hover:bg-gray-200`}></div>
    </div>
  )
}
