/**
 * Converts technical error messages to user-friendly messages
 */
export function getUserFriendlyError(error: any): string {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  const errorMessage = error.message || error.error || String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Field validation errors
  if (lowerMessage.includes("customer_name") || lowerMessage.includes("customer name")) {
    return "Please select a DNA profile to continue. The DNA profile contains the customer information needed to generate content.";
  }

  if (lowerMessage.includes("agent_name") || lowerMessage.includes("agent name")) {
    return "Please select an agent to generate content.";
  }

  if (lowerMessage.includes("dna") && lowerMessage.includes("required")) {
    return "Please select a DNA profile. This is required to generate personalized content.";
  }

  if (lowerMessage.includes("generalinput") || lowerMessage.includes("general input")) {
    return "Please provide some input or context for the agent to work with.";
  }

  // API key errors
  if (lowerMessage.includes("api key") || lowerMessage.includes("apikey")) {
    if (lowerMessage.includes("not configured") || lowerMessage.includes("not found")) {
      return "OpenAI API key is not configured. Please add your API key to the .env.local file and restart the server.";
    }
    if (lowerMessage.includes("invalid")) {
      return "Your OpenAI API key is invalid. Please check your API key in the .env.local file.";
    }
  }

  // Quota and rate limit errors
  if (lowerMessage.includes("quota") || lowerMessage.includes("insufficient")) {
    return "Your OpenAI account has insufficient credits. Please add credits to your OpenAI account at https://platform.openai.com/account/billing";
  }

  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many requests")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Network errors
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch") || lowerMessage.includes("connection")) {
    return "Connection error. Please check your internet connection and try again.";
  }

  // Database errors
  if (lowerMessage.includes("supabase") || lowerMessage.includes("database")) {
    if (lowerMessage.includes("relation") || lowerMessage.includes("does not exist")) {
      return "Database tables not found. Please set up your database tables in Supabase.";
    }
    return "Database error. Please check your database connection.";
  }

  // Content generation errors
  if (lowerMessage.includes("no content generated") || lowerMessage.includes("empty response")) {
    return "The AI didn't generate any content. Please try again with different input.";
  }

  // Generic validation errors
  if (lowerMessage.includes("required") && lowerMessage.includes("field")) {
    return "Please fill in all required fields.";
  }

  // If it's already a user-friendly message (doesn't contain technical terms), return as is
  if (
    !lowerMessage.includes("error:") &&
    !lowerMessage.includes("failed") &&
    !lowerMessage.includes("exception") &&
    !lowerMessage.includes("undefined") &&
    !lowerMessage.includes("null") &&
    errorMessage.length < 200 // Reasonable length for user messages
  ) {
    return errorMessage;
  }

  // Default fallback
  return "Something went wrong. Please try again. If the problem persists, check your settings and try again.";
}

/**
 * Extracts user-friendly error from API response
 */
export function extractErrorFromResponse(response: any): string {
  if (response?.error) {
    return getUserFriendlyError(response.error);
  }
  if (response?.message) {
    return getUserFriendlyError(response.message);
  }
  return getUserFriendlyError(response);
}
