import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-cursor-purple text-white shadow-lg shadow-cursor-purple/20",
        secondary:
          "bg-white/5 border border-white/10 text-gray-400",
        success:
          "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500",
        warning:
          "bg-amber-500/10 border border-amber-500/20 text-amber-500",
        destructive:
          "bg-red-500/10 border border-red-500/20 text-red-500",
        outline:
          "border border-white/10 text-gray-500 bg-transparent hover:text-white hover:border-white/20",
        now: "bg-cursor-purple/20 border border-cursor-purple/30 text-cursor-purple animate-pulse-soft",
        next: "bg-blue-500/10 border border-blue-500/20 text-blue-500",
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
