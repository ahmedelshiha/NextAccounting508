import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  indicatorClassName?: string
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className, indicatorClassName, ...props }, ref) => {
    const percent = Number.isFinite(value) && max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className={cn("relative w-full overflow-hidden rounded-full bg-gray-200 h-2", className)}
        {...props}
      >
        <div
          className={cn("h-full bg-primary transition-all duration-300", indicatorClassName)}
          style={{ width: `${percent}%` }}
        />
      </div>
    )
  }
)

Progress.displayName = "Progress"

export default Progress
