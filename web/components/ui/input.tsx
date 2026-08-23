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
          "flex h-10 w-full rounded-md border-2 border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-1 text-xs text-[var(--input-text)] shadow-[2px_2px_0_var(--shadow-color)] transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-[var(--subtext)] focus-visible:outline-none focus-visible:border-[var(--sv-magenta)] disabled:cursor-not-allowed disabled:opacity-50",
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
