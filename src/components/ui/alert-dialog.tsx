"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function AlertDialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

function AlertDialogContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <DialogContent className={className}>
      {children}
    </DialogContent>
  )
}

function AlertDialogHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <DialogHeader className={className}>{children}</DialogHeader>
  )
}

function AlertDialogFooter({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <DialogFooter className={className}>{children}</DialogFooter>
  )
}

function AlertDialogTitle({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <DialogTitle className={className}>{children}</DialogTitle>
}

function AlertDialogDescription({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <DialogDescription className={className}>{children}</DialogDescription>
}

function AlertDialogCancel({ children, onClick, disabled }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  )
}

function AlertDialogAction({ children, onClick, disabled, className }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
}
