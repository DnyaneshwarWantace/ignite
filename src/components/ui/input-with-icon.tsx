import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(({ className, icon, iconPosition = "left", ...props }, ref) => {
  return (
    <div className="relative">
      <Input
        className={cn(icon && iconPosition === "left" && "pl-10", icon && iconPosition === "right" && "pr-10", className)}
        ref={ref}
        {...props}
      />
      {icon && (
        <div className={cn("absolute top-0 bottom-0 flex items-center justify-center w-10", iconPosition === "left" ? "left-0" : "right-0")}>
          {icon}
        </div>
      )}
    </div>
  );
});

InputWithIcon.displayName = "InputWithIcon";
