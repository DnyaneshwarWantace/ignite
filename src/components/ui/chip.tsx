import React from "react";
import { X } from "lucide-react"; // Optional: for a close icon
import { cn } from "@/lib/utils";

type ChipProps = {
  label: string;
  onRemove?: () => void;
  removable?: boolean;
  variant?: "default" | "success" | "error" | "warning" | "info";
  className?: string;
  iconClassName?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

const variantStyles = {
  default: "bg-gray-200 text-gray-800",
  success: "bg-green-200 text-green-800",
  error: "bg-red-200 text-red-800",
  warning: "bg-yellow-200 text-yellow-800",
  info: "bg-blue-200 text-blue-800",
};

export const Chip: React.FC<ChipProps> = ({
  label,
  onRemove,
  removable = false,
  variant = "default",
  className = "",
  icon,
  iconPosition,
  iconClassName,
}) => {
  return (
    <div
      className={cn(
        "inline-flex relative items-center px-3 py-1 rounded-full text-sm",
        variantStyles[variant],
        icon && iconPosition === "left" && "pl-8",
        icon && iconPosition === "right" && "pr-8",
        className
      )}
    >
      {label}

      {removable && (
        <button onClick={onRemove} className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Remove">
          <X className="w-4 h-4" />
        </button>
      )}
      {icon && (
        <div
          className={cn(
            "absolute top-0 bottom-0 flex items-center justify-center w-10 ",
            iconPosition === "left" ? "left-0" : "right-0",
            iconClassName
          )}
        >
          {icon}
        </div>
      )}
    </div>
  );
};
