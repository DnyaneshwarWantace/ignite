"use client";

import { useState, useEffect } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface CharacterLimitTextareaProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  className?: string;
  limitByWords?: boolean; // New prop to limit by words instead of characters
}

export default function CharacterLimitTextarea({
  value,
  onChange,
  maxLength,
  placeholder,
  className,
  limitByWords = false,
}: CharacterLimitTextareaProps) {
  const [charCount, setCharCount] = useState(value.length);
  const [wordCount, setWordCount] = useState(0);

  // Count words (excluding gaps and line breaks)
  const countWords = (text: string): number => {
    if (!text || !text.trim()) return 0;
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces/line breaks with single space
      .trim()
      .split(' ')
      .filter(word => word.length > 0).length;
  };

  useEffect(() => {
    setCharCount(value.length);
    setWordCount(countWords(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newWordCount = countWords(newValue);

    // Check limit based on prop
    if (limitByWords) {
      // Limit by word count
      if (newWordCount <= maxLength) {
        onChange(newValue);
        setCharCount(newValue.length);
        setWordCount(newWordCount);
      }
    } else {
      // Limit by character count (default)
      if (newValue.length <= maxLength) {
        onChange(newValue);
        setCharCount(newValue.length);
        setWordCount(newWordCount);
      }
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "w-full min-h-[120px] p-4 pr-20 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
          className
        )}
        maxLength={limitByWords ? undefined : maxLength}
      />
      <div className="absolute top-2 right-2 flex items-center gap-3">
        <div className="flex flex-col items-end text-xs">
          <span className="font-semibold text-gray-700">
            {wordCount} {limitByWords && `/ ${maxLength.toLocaleString()}`} words
          </span>
          {!limitByWords && (
            <span className="text-gray-400">{charCount} / {maxLength.toLocaleString()} chars</span>
          )}
          {limitByWords && (
            <span className="text-gray-400">{charCount.toLocaleString()} chars</span>
          )}
        </div>
        <button
          type="button"
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          title="Voice input"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

