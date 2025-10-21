import * as React from 'react'
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, checked, onCheckedChange, ...props }, ref) => {
  return (
    <label className={cn('inline-flex items-center gap-2', className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onCheckedChange?.(e.target.checked)
          if (props.onChange) props.onChange(e as any)
        }}
        className="h-4 w-4 shrink-0 rounded-sm border border-primary bg-white text-current focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {/* Visually hidden indicator for compatibility with existing styles that expect an Indicator element */}
      <span aria-hidden className="sr-only">
        {checked ? 'checked' : 'not checked'}
      </span>
    </label>
  )
})
Checkbox.displayName = 'Checkbox'

export { Checkbox }
