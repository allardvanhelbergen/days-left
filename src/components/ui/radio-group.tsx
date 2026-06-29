import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary/70 bg-background text-primary-foreground shadow-[inset_0_0_0_1px_hsl(var(--background)/0.55)] transition-[background-color,border-color,box-shadow,transform] [transition-duration:240ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:border-primary hover:shadow-[0_0_0_5px_hsl(var(--ring)/0.10),inset_0_0_0_1px_hsl(var(--background)/0.55)] focus:outline-none focus-visible:scale-110 focus-visible:shadow-[0_0_0_6px_hsl(var(--ring)/0.16),inset_0_0_0_1px_hsl(var(--background)/0.55)] data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_0_5px_hsl(var(--ring)/0.14),inset_0_0_0_1px_hsl(var(--primary-foreground)/0.28)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-[background-color,border-color,box-shadow]",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="size-2.5 fill-current transition-transform [transition-duration:240ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
