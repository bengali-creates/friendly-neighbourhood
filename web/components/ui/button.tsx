import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all duration-150 border-2 border-black focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#000000]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--sv-paper)] text-black shadow-[3px_3px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000000]",
        magenta:
          "bg-[var(--sv-magenta)] text-white shadow-[3px_3px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000000]",
        yellow:
          "bg-[var(--sv-yellow)] text-black shadow-[3px_3px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000000]",
        cyan: "bg-[var(--sv-cyan)] text-black shadow-[3px_3px_0_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000000]",
        ghost:
          "bg-transparent text-[var(--fg)] border-[var(--card-border)] shadow-none hover:bg-black/10 dark:hover:bg-white/10",
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
