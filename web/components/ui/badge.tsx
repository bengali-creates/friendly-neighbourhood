import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors rounded-[var(--radius-sm)] border",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--rim)]",
        critical: "bg-[var(--alert-fill)] text-[var(--alert)] border-[rgba(248,113,113,0.25)]",
        warning: "bg-[rgba(249,115,22,0.12)] text-[#FB923C] border-[rgba(249,115,22,0.25)]",
        info: "bg-[var(--watchful-fill)] text-[var(--watchful)] border-[rgba(196,181,253,0.25)]",
        success: "bg-[var(--clear-fill)] text-[var(--clear)] border-[rgba(110,231,183,0.25)]",
        outline: "bg-transparent text-[var(--ink-secondary)] border-[var(--rim)]",
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
