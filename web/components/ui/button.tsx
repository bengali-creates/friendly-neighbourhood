import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-medium tracking-wide transition-all duration-150 rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--watchful)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--void)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--watchful)] text-[var(--void)] font-semibold shadow-sm hover:brightness-110 hover:shadow-[0_0_16px_rgba(196,181,253,0.25)]",
        secondary:
          "bg-[var(--surface)] text-[var(--ink-primary)] border border-[var(--rim)] hover:bg-[var(--depth)] hover:border-[var(--ink-secondary)]",
        magenta:
          "bg-[var(--alert-fill)] text-[var(--alert)] border border-[rgba(248,113,113,0.3)] hover:bg-[rgba(248,113,113,0.22)]",
        yellow:
          "bg-[rgba(249,115,22,0.12)] text-[#FB923C] border border-[rgba(249,115,22,0.3)] hover:bg-[rgba(249,115,22,0.2)]",
        cyan: 
          "bg-[var(--watchful-fill)] text-[var(--watchful)] border border-[rgba(196,181,253,0.3)] hover:bg-[rgba(196,181,253,0.22)]",
        ghost:
          "bg-transparent text-[var(--ink-secondary)] border border-transparent hover:text-[var(--ink-primary)] hover:bg-[var(--surface)]",
        outline:
          "bg-transparent text-[var(--ink-primary)] border border-[var(--rim)] hover:bg-[var(--surface)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-[11px]",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
