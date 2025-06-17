import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[2px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-gray-100 focus:ring-white/50 transform hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50",
        outline:
          "border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 focus:ring-white/30",
        secondary:
          "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 focus:ring-white/30",
        ghost: "text-white hover:bg-white/10 focus:ring-white/20",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "text-base px-4 py-2",
        sm: "text-sm px-3 py-2",
        lg: "text-lg px-6 py-3",
        icon: "h-10 w-10 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }