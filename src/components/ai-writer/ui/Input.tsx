import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
  helperText?: string;
  error?: string;
  charCount?: number;
  maxCharCount?: number;
}

export default function Input({
  label,
  helperText,
  error,
  charCount,
  maxCharCount,
  className,
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            "w-full px-4 py-3 border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
            error ? "border-red-300" : "border-gray-300",
            className
          )}
          {...props}
        />
        {charCount !== undefined && maxCharCount && (
          <div className="absolute top-2 right-2">
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
              {charCount} / {maxCharCount}
            </span>
          </div>
        )}
      </div>
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-2">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
