import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export default function Card({ children, hover = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200",
        hover && "hover:border-gray-300 hover:shadow-sm transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
