import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,box-shadow,color,transform] [transition-duration:240ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_18px_34px_hsl(var(--ring)/0.18),0_0_0_5px_hsl(var(--ring)/0.14)] active:translate-y-0 active:scale-[0.99] active:shadow-[0_6px_16px_hsl(var(--ring)/0.14)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-[background-color,border-color,box-shadow,color] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_22px_hsl(var(--ring)/0.16)] hover:bg-primary/95 hover:shadow-[0_18px_34px_hsl(var(--ring)/0.22),0_0_0_1px_hsl(var(--primary)/0.18)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_10px_22px_hsl(var(--destructive)/0.14)] hover:bg-destructive/95 hover:shadow-[0_18px_34px_hsl(var(--destructive)/0.18),0_0_0_1px_hsl(var(--destructive)/0.18)]",
        outline:
          "border border-input bg-background shadow-sm hover:border-ring/70 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_14px_28px_hsl(var(--ring)/0.12)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:shadow-[0_14px_28px_hsl(var(--ring)/0.12)]",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-[0_12px_24px_hsl(var(--ring)/0.10)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
