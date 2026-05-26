import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary/60 text-secondary-foreground",
        primary:
          "border-primary/30 bg-primary/15 text-primary [&_svg]:text-primary",
        success:
          "border-success/30 bg-success/15 text-success [&_svg]:text-success",
        warning:
          "border-warning/30 bg-warning/15 text-warning [&_svg]:text-warning",
        danger:
          "border-destructive/30 bg-destructive/15 text-destructive [&_svg]:text-destructive",
        info: "border-info/30 bg-info/15 text-info [&_svg]:text-info",
        outline: "border-border bg-transparent text-muted-foreground",
        ghost: "border-transparent bg-transparent text-muted-foreground",
      },
      size: {
        default: "h-5",
        sm: "h-4 text-[10px] px-1.5",
        lg: "h-6 text-sm px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
