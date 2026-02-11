"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function CharacterLimitTextarea({
  value,
  onChange,
  maxLength,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  className?: string;
}) {
  const [charCount, setCharCount] = useState(value.length);

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      setCharCount(newValue.length);
    }
  };

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("min-h-[120px] pr-20", className)}
        maxLength={maxLength}
      />
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        {charCount.toLocaleString()} / {maxLength.toLocaleString()} chars
      </div>
    </div>
  );
}
