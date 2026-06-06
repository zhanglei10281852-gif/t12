import { type InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full px-3 py-2 rounded-lg border text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500",
            error
              ? "border-red-300 focus:ring-red-500/50 focus:border-red-500"
              : "border-gray-200 dark:border-gray-600",
            "bg-white dark:bg-gray-700",
            "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
