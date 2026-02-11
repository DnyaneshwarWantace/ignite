// Map agent names to agent IDs for linking from DNA sections
export const AGENT_NAME_TO_ID: Record<string, string> = {
  "High-Value Client Compass": "high-value-client-compass",
  "Ideal Client Profile (ICP)": "ideal-client-profile",
  "Buying Profiles": "buying-profiles",
  "The Persuasive Premise": "persuasive-premise",
  "The Persuasive Premise (1st Part)": "persuasive-premise",
  "Primary and Secondary Beliefs of Persuasive Premise (2nd and 3rd Parts)": "persuasive-premise",
  "Irresistible Offer": "irresistible-offer",
  "Unforgettable Offer Names": "unforgettable-offer-names",
  "Unique Selling Proposition": "unique-selling-proposition",
  "Problem & Promise": "problem-promise",
  "Main Surprising Cause": "main-surprising-cause",
  "Unique Primary Solution": "unique-primary-solution",
  "Ad Funnel": "ad-funnel",
  "Twitter/X Content": "twitter-x-content",
  "Perpetual Conversion Video": "perpetual-conversion-video",
  "Content Ideas that Sell": "content-ideas-that-sell",
  "Selling Stories": "selling-stories",
  "Short Content Scripts": "short-content-scripts",
  "Stories that Connect": "stories-that-connect",
  "Viral Hooks": "viral-hooks",
  "Viral ideas": "viral-ideas",
  "Viral Scripts": "viral-scripts",
  "Thumbnail Titles": "thumbnail-titles",
  "YouTube Angles": "youtube-angles",
  "YouTube Description": "youtube-description",
  "YouTube Thumbnails": "youtube-thumbnails",
  "Youtube titles": "youtube-titles",
  "E-mail Editor": "email-editor",
  "Infinite Titles": "infinite-titles",
  "Landing Pages": "landing-pages",
  "SPIN Selling": "spin-selling",
  "Methodology": "methodology",
};

export function getAgentIdFromName(agentName: string): string | null {
  return AGENT_NAME_TO_ID[agentName] || null;
}

export function getAgentUrl(agentName: string, targetSectionId?: string): string {
  const agentId = getAgentIdFromName(agentName);
  if (!agentId) return "/agents";
  
  const url = `/agents/${agentId}`;
  if (targetSectionId) {
    return `${url}?targetSection=${targetSectionId}`;
  }
  return url;
}

