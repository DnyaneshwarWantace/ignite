/**
 * Utility functions for cleaning template variables from text
 */

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