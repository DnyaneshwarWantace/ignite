import { cn } from "../../lib/utils";
import { TextareaHTMLAttributes } from "react";

declare module "react" {
  interface JSX {
    IntrinsicElements: any;
  }
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  charCount?: number;
  maxCharCount?: number;
}

export default function Textarea({
  label,
  helperText,
  error,
  charCount,
  maxCharCount,
  className,
  ...props
}: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          className={cn(
            "w-full min-h-[120px] p-4 text-sm border rounded-lg resize-none",
            "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
            error ? "border-red-300" : "border-gray-300",
            className
          )}
          {...props}
        />
        {charCount !== undefined && maxCharCount && (
          <div className="absolute top-2 right-2">
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
              {charCount.toLocaleString()} / {maxCharCount.toLocaleString()}
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

