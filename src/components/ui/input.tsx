import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-[background-color,border-color,box-shadow,color,transform] [transition-duration:260ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:-translate-y-px hover:scale-[1.005] hover:border-ring/80 hover:bg-card/65 hover:shadow-[0_12px_28px_hsl(var(--ring)/0.12),0_0_0_1px_hsl(var(--ring)/0.10)] focus-visible:border-ring focus-visible:bg-card/90 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_18px_34px_hsl(var(--ring)/0.16),0_0_0_5px_hsl(var(--ring)/0.14),inset_0_0_0_1px_hsl(var(--ring)/0.24)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[0_12px_30px_hsl(var(--destructive)/0.12),0_0_0_4px_hsl(var(--destructive)/0.14)] motion-reduce:transform-none motion-reduce:transition-[background-color,border-color,box-shadow,color] md:text-sm",
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
