import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-white/20 bg-primary/25 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_4px_16px_rgba(0,0,0,0.2)] hover:bg-primary/35 hover:brightness-110 active:opacity-85",
        destructive:
          "border border-destructive/40 bg-destructive/25 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_4px_16px_rgba(0,0,0,0.2)] hover:border-destructive hover:bg-destructive/80 hover:text-white active:opacity-85",
        outline:
          "border border-white/15 bg-white/5 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:brightness-110 active:opacity-85",
        secondary:
          "border border-white/20 bg-white/15 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_14px_rgba(0,0,0,0.18)] hover:bg-white/20 hover:brightness-110 active:opacity-85",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:border-white/15 hover:bg-white/10 active:opacity-85",
        link: "text-primary underline-offset-4 hover:underline backdrop-blur-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
