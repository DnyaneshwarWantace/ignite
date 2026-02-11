import { clsx, type ClassValue } from "clsx";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { debounce } from "lodash";
const moment = require("moment");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number for display with at most 2 decimal places (e.g. 253.00, 82.35).
 * Use across the app so we never show long decimals like 253.00080000000001.
 */
export function formatDecimal(value: number, maxDecimals = 2): string {
  if (typeof value !== "number" || Number.isNaN(value)) return String(value);
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(maxDecimals)).toString();
}

/**
 * Format any value for display in UI (e.g. combination preview). Numbers/arrays of numbers
 * are shown with at most 2 decimal places.
 */
export function formatDisplayValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return formatDecimal(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "number" ? formatDecimal(v) : String(v)))
      .join(", ");
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    const v = (value as { value: unknown }).value;
    return typeof v === "string" ? v : formatDisplayValue(v);
  }
  return String(value);
}

export const useDebouncedFunction = (callback: any, delay: number) => {
  return useMemo(() => {
    return debounce(callback, delay);
  }, [callback, delay]);
};

export function timeDifferenceFromNow(inputDate: Date) {
  // Create a moment object from the input date
  const givenDate = moment(inputDate);

  // Check if the input is a valid date
  if (!givenDate.isValid()) {
    return "Invalid date";
  }

  // Get the current time
  const now = moment();

  // Calculate the difference in various units
  const diffInSeconds = now.diff(givenDate, "seconds");
  const diffInMinutes = now.diff(givenDate, "minutes");
  const diffInHours = now.diff(givenDate, "hours");
  const diffInDays = now.diff(givenDate, "days");
  const diffInWeeks = now.diff(givenDate, "weeks");
  const diffInMonths = now.diff(givenDate, "months");
  const diffInYears = now.diff(givenDate, "years");

  // Determine the appropriate unit to return
  if (diffInSeconds < 60) {
    return `${diffInSeconds}sec`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}min`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}months`;
  } else {
    return `${diffInYears}year${diffInYears > 1 ? "s" : ""}`;
  }
}

/**
 * Removes template variables from text without using placeholder text
 */
export function cleanTemplateVariables(text: string, fallback: string = ""): string {
  if (!text) return fallback;
  
  // First remove the "brand}}" prefix if it exists
  let cleanText = text.replace(/^brand\}\}\s*/, "");
  
  // Remove all template variables
  cleanText = cleanText.replace(/\{\{[^}]+\}\}/g, "");
  
  // Remove duplicate text that often appears after template variables
  cleanText = cleanText.replace(/(.+?)\s*\1+/g, "$1");
  
  // Clean up extra spaces and return fallback if empty
  cleanText = cleanText.trim().replace(/\s+/g, ' ');
  return cleanText || fallback;
}

/**
 * Cleans hook text by removing URLs, domain patterns, and template variables
 */
export function cleanHookText(text: string): string {
  if (!text) return "";
  
  let cleanText = text;
  
  // Remove URLs and domain-like patterns
  cleanText = cleanText.replace(/https?:\/\/[^\s]+/gi, ''); // Remove full URLs
  cleanText = cleanText.replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*/gi, ''); // Remove domain patterns
  cleanText = cleanText.replace(/ad\.doubleclick\.net/gi, ''); // Remove specific ad domains
  cleanText = cleanText.replace(/fb\.me/gi, ''); // Remove fb.me
  cleanText = cleanText.replace(/galaxy-creators\.jebi\.io/gi, ''); // Remove specific domains
  
  // Clean template variables
  cleanText = cleanText
    .replace(/\{\{[^}]+\}\}/g, '') // Remove template variables
    .replace(/_[a-zA-Z]+/g, '') // Remove underscore prefixed words like _forthehome
    .replace(/\b[A-Z]{2,}\.[A-Z]{2,}\.[A-Z]{2,}\b/gi, '') // Remove ALL_CAPS.DOMAIN.PATTERNS
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // If the text is too short or looks like a URL/domain, return empty
  if (cleanText.length < 5 || 
      cleanText.match(/^[A-Z\-\.]+$/i) || // All caps with dots/dashes
      cleanText.includes('.') && cleanText.split(' ').length === 1) { // Single word with dots
    return "";
  }
  
  return cleanText;
}

/**
 * Cleans ad description text by removing template variables and bracketed content
 */
export function cleanAdDescription(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/\{\{[^}]+\}\}/g, '') // Remove template variables
    .replace(/\[.*?\]/g, '') // Remove bracketed content
    .trim();
}
