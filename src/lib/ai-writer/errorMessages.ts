export function getUserFriendlyError(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const errorMessage = error.message || error.error || String(error);
  const lowerMessage = errorMessage.toLowerCase();
  if (lowerMessage.includes("customer_name") || lowerMessage.includes("customer name")) return "Please select a DNA profile to continue. The DNA profile contains the customer information needed to generate content.";
  if (lowerMessage.includes("agent_name") || lowerMessage.includes("agent name")) return "Please select an agent to generate content.";
  if (lowerMessage.includes("dna") && lowerMessage.includes("required")) return "Please select a DNA profile. This is required to generate personalized content.";
  if (lowerMessage.includes("generalinput") || lowerMessage.includes("general input")) return "Please provide some input or context for the agent to work with.";
  if (lowerMessage.includes("api key") || lowerMessage.includes("apikey")) {
    if (lowerMessage.includes("not configured") || lowerMessage.includes("not found")) return "No AI key configured. Add one in Settings → AI Model, or set OPENAI_API_KEY env.";
    if (lowerMessage.includes("invalid")) return "Your AI key is invalid. Please check Settings → AI Model.";
  }
  if (lowerMessage.includes("quota") || lowerMessage.includes("insufficient")) return "Your AI account has insufficient credits. Please add credits or check your plan.";
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many requests")) return "Too many requests. Please wait a moment and try again.";
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch") || lowerMessage.includes("connection")) return "Connection error. Please check your internet connection and try again.";
  if (lowerMessage.includes("supabase") || lowerMessage.includes("database")) return "Database error. Please try again.";
  if (lowerMessage.includes("no content generated") || lowerMessage.includes("empty response")) return "The AI didn't generate any content. Please try again with different input.";
  if (lowerMessage.includes("required") && lowerMessage.includes("field")) return "Please fill in all required fields.";
  if (!lowerMessage.includes("error:") && !lowerMessage.includes("failed") && !lowerMessage.includes("exception") && errorMessage.length < 200) return errorMessage;
  return "Something went wrong. Please try again. If the problem persists, check your settings.";
}

export function extractErrorFromResponse(response: any): string {
  if (response?.error) return getUserFriendlyError(response.error);
  if (response?.message) return getUserFriendlyError(response.message);
  return getUserFriendlyError(response);
}
