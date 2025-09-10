"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  className,
  children,
  ...props
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  className?: string
  children?: React.ReactNode
} & React.ComponentProps<"div">) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue || "")
  const isControlled = controlled !== undefined
  const value = isControlled ? (controlled as string) : uncontrolled

  const setValue = React.useCallback(
    (v: string) => {
      if (!isControlled) setUncontrolled(v)
      onValueChange?.(v)
    },
    [isControlled, onValueChange]
  )

  React.useEffect(() => {
    if (!defaultValue && !controlled && React.Children.count(children) > 0) {
      // Try to infer first trigger as default
      const listEl = React.Children.toArray(children).find(
        (child): child is React.ReactElement =>
          React.isValidElement(child) && child.type === TabsList
      )

      if (listEl) {
        const firstTrigger = React.Children.toArray(listEl.props.children).find(
          (c): c is React.ReactElement<{ value: string }> =>
            React.isValidElement(c) && c.type === TabsTrigger && typeof c.props.value === "string"
        )

        if (firstTrigger) {
          setUncontrolled(firstTrigger.props.value)
        }
      }
    }
  }, [children, defaultValue, controlled])

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div data-slot="tabs" className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}
Tabs.displayName = "Tabs"

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
TabsList.displayName = "TabsList"

function TabsTrigger({
  className,
  value,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> & { value: string; disabled?: boolean }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs")
  const isActive = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => !disabled && ctx.setValue(value)}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
TabsTrigger.displayName = "TabsTrigger"

function TabsContent({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within Tabs")
  const isActive = ctx.value === value
  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={cn("mt-2 outline-none", !isActive && "hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
}
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
