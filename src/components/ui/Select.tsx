import { type SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, id, ...props }, ref) => {
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
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full px-3 py-2 rounded-lg border text-sm transition-colors appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500",
            "border-gray-200 dark:border-gray-600",
            "bg-white dark:bg-gray-700",
            "text-gray-900 dark:text-white",
            "bg-no-repeat bg-right",
            "pr-8",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
