import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cursor-purple to-cursor-purple-dark text-white",
        secondary:
          "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
        success:
          "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
        warning:
          "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
        destructive:
          "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        outline:
          "border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-transparent",
        now: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 animate-pulse-soft",
        next: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
