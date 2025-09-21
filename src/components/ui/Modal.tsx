"use client"
import React, { useEffect, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import FocusTrap from 'focus-trap-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const body = document.body
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    // focus management handled by focus-trap; ensure initial focus target exists
    const dialog = dialogRef.current
    const focusable = dialog?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
    if (focusable) focusable.focus()
    else dialog?.focus()

    return () => {
      body.style.overflow = prevOverflow
      if (previouslyFocused.current) {
        try { previouslyFocused.current.focus() } catch {}
      }
    }
  }, [open])

  if (!open) return null

  const sizeClass = size === 'sm' ? 'max-w-lg' : size === 'md' ? 'max-w-2xl' : size === 'lg' ? 'max-w-4xl' : 'w-full h-full'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden={!open}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className={`relative z-10 w-full ${sizeClass} mx-4`}>
        <FocusTrap active={open} focusTrapOptions={{ onDeactivate: onClose, clickOutsideDeactivates: true, escapeDeactivates: true }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            ref={dialogRef}
            tabIndex={-1}
          >
            <div className="bg-white rounded-lg shadow-lg overflow-auto max-h-[90vh]">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 id="modal-title" className="text-lg font-medium text-gray-900">{title}</h2>
                  <button aria-label="Close dialog" onClick={onClose} className="text-gray-500 hover:text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-4">{children}</div>
            </div>
          </div>
        </FocusTrap>
      </div>
    </div>, document.body)
}
