import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-[2px_2px_0_#000000] rounded-sm",
  {
    variants: {
      variant: {
        default: "bg-[var(--sv-paper)] text-black",
        critical: "bg-[var(--sv-magenta)] text-white",
        warning: "bg-[var(--sv-yellow)] text-black",
        info: "bg-[var(--sv-cyan)] text-black",
        success: "bg-emerald-500 text-black",
        outline: "bg-transparent text-white border-white/40 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
