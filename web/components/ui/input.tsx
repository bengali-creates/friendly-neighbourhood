import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius-sm)] border border-[var(--rim)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink-primary)] transition-all file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-[var(--ink-tertiary)] focus-visible:outline-none focus-visible:border-[var(--watchful)] focus-visible:ring-2 focus-visible:ring-[rgba(196,181,253,0.2)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
