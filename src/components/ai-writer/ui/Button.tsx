import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-6 py-3 rounded-lg font-medium transition-all",
        variant === "primary" && "bg-gray-900 text-white hover:bg-gray-800",
        variant === "secondary" && "border border-gray-300 text-gray-700 hover:bg-gray-50",
        variant === "ghost" && "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
