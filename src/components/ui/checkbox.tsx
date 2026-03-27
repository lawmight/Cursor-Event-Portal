import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? `checkbox-${generatedId}`;

    return (
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={inputId}
          ref={ref}
          className={cn(
            "mt-0.5 h-4 w-4 rounded-sm border-gray-300 dark:border-gray-600 text-cursor-purple focus:ring-cursor-purple focus:ring-offset-0 cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
