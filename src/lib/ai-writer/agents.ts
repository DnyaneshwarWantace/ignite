export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "foundation" | "offer" | "copy" | "content";
  tags: string[];
  hasInstructions?: boolean;
  hasFunnelStage?: boolean;
  hasVSLSections?: boolean;
}

export const AGENTS: Agent[] = [
  { id: "persuasive-premise", name: "The Persuasive Premise", description: "Create your Persuasive Premise by discovering your customer's Beliefs and shifting them to favor the sale of our product or service.", icon: "Target", category: "foundation", tags: ["Marketing"] },
  { id: "high-value-client-compass", name: "High-Value Client Compass", description: 'Use the "Compass" to find better-paying clients who fit the 7D Profile: the 7 criteria of an ideal customer.', icon: "Compass", category: "foundation", tags: ["Client", "Marketing"] },
  { id: "ideal-client-profile", name: "Ideal Client Profile (ICP)", description: "Understand your ideal client better than they understand themselves.", icon: "Trophy", category: "foundation", tags: ["Client", "Marketing"] },
  { id: "buying-profiles", name: "Buying Profiles", description: "Understand your customer's Buying Profile. This way, you'll know the \"triggers\" that increase the chances of closing the sale.", icon: "User", category: "foundation", tags: ["New", "Client"] },
  { id: "methodology", name: "Methodology", description: "How to create the ideal methodology to teach better, stand out, and sell more.", icon: "Puzzle", category: "foundation", tags: ["Client"] },
  { id: "problem-promise", name: "Problem & Promise", description: "Define the Problem and the Value Proposition that you make to your client that justifies the value you ask in exchange.", icon: "Search", category: "foundation", tags: ["New", "Marketing"] },
  { id: "irresistible-offer", name: "Irresistible Offer", description: "How to create an offer so good that people would feel foolish saying no!", icon: "Gift", category: "offer", tags: ["Marketing", "Sales"] },
  { id: "unforgettable-offer-names", name: "Unforgettable Names for Offers", description: "How to create great names for your offer, product, or course.", icon: "Tag", category: "offer", tags: ["Marketing"] },
  { id: "unique-selling-proposition", name: "Unique Selling Proposition", description: "How to make it clear once and for all why you're different.", icon: "Zap", category: "offer", tags: ["Marketing"] },
  { id: "unique-primary-solution", name: "Unique Primary Solution", description: "Create a unique solution that stands out from all your competitors.", icon: "CheckCircle", category: "offer", tags: ["Copywriting"] },
  { id: "ad-funnel", name: "Ad Funnel", description: "Create a complete ad funnel that goes from the first contact to the final conversion.", icon: "Filter", category: "copy", tags: ["New", "Ads", "Copywriting"], hasInstructions: true },
  { id: "change-of-beliefs", name: "Change of Beliefs", description: "Create a persuasive ad to establish the Persuasive Premise in your prospect's mind and shift their beliefs.", icon: "ArrowLeftRight", category: "copy", tags: ["Ads"], hasInstructions: true },
  { id: "my-little-secret", name: "My Little Secret", description: "A surprising confession that leads to the desired solution.", icon: "MessageSquare", category: "copy", tags: ["Ads"], hasInstructions: true },
  { id: "objection-remover", name: "Objection Remover", description: "How to create high-conversion carousels with the goal of shifting the user's current beliefs and removing objections.", icon: "LayoutGrid", category: "copy", tags: ["Ads", "Content"], hasInstructions: true },
  { id: "the-problem-gateway", name: "The Problem Gateway", description: "Reveals how common solutions can make problems worse.", icon: "Home", category: "copy", tags: ["Ads"], hasInstructions: true },
  { id: "the-provocative-question", name: "The Provocative Question", description: "How to create highly persuasive Facebook ads focused on identifying and scaling the main surprising cause.", icon: "HelpCircle", category: "copy", tags: ["Ads"], hasInstructions: true },
  { id: "the-unexpected-solution", name: "The Unexpected Solution", description: "How to create highly persuasive ads to capture attention, challenge conventional thinking, and present your unique solution.", icon: "ArrowRight", category: "copy", tags: ["Ads"], hasInstructions: true },
  { id: "main-surprising-cause", name: "Main Surprising Cause", description: "Find the real cause behind your prospect's problems and sell more.", icon: "Lightbulb", category: "copy", tags: ["Copywriting"] },
  { id: "infinite-titles", name: "Infinite Titles", description: "Generate as many irresistible titles for your posts, ads, and videos as you want.", icon: "Infinity", category: "copy", tags: ["Copywriting"] },
  { id: "landing-pages", name: "Landing Pages", description: "Create high-converting landing pages using the 14 essential sections every page needs.", icon: "MousePointerClick", category: "copy", tags: ["New", "Marketing", "Copywriting"], hasInstructions: true },
  { id: "perpetual-conversion-video", name: "Perpetual Conversion Video", description: "Transform your product into a high-converting offer with expert Video Sales Letter scripts.", icon: "Video", category: "copy", hasVSLSections: true, tags: ["New", "Marketing", "Sales"] },
  { id: "email-editor", name: "E-mail Editor", description: "Edit your emails to correct errors, improve flow, and, of course, sell more.", icon: "Mail", category: "copy", tags: ["E-mails"], hasInstructions: true },
  { id: "spin-selling", name: "SPIN Selling", description: "Discover relevant questions to apply the SPIN Selling methodology in your sales.", icon: "Gauge", category: "copy", tags: ["Sales"], hasInstructions: true },
  { id: "twitter-x-content", name: "Twitter/X Content", description: "Create tweets or threads that engage, educate, and sell.", icon: "X", category: "content", hasFunnelStage: true, tags: ["Content"] },
  { id: "content-ideas-that-sell", name: "Content Ideas that Sell", description: "How to find content ideas that attract the right type of customer, the one who buys.", icon: "Lightbulb", category: "content", tags: ["Marketing", "Content"], hasInstructions: true },
  { id: "selling-stories", name: "Selling Stories", description: "I create persuasive story sequences that sell like crazy $$$.", icon: "TrendingUp", category: "content", tags: ["Instagram", "Content"] },
  { id: "short-content-scripts", name: "Short Content Scripts", description: "Create content scripts specialized in list formats (tips, steps, myths, mistakes, etc.).", icon: "FileText", category: "content", tags: ["Content"] },
  { id: "stories-that-connect", name: "Stories that Connect", description: "I adapt any content into a sequence of stories that truly connect.", icon: "Heart", category: "content", tags: ["Instagram", "Content"] },
  { id: "viral-hooks", name: "Viral Hooks", description: "How to create short hooks up to 6 seconds to ensure you capture the attention of as many people as possible.", icon: "Fish", category: "content", tags: ["Content", "Copywriting"], hasInstructions: true },
  { id: "viral-ideas", name: "Viral ideas", description: "Generate highly shareable ideas that can be used for content, ads, and more.", icon: "Share2", category: "content", tags: ["Content", "Copywriting"], hasInstructions: true },
  { id: "viral-scripts", name: "Viral Scripts", description: "Follow a proven structure based on some of the most viral videos in the world with attention-grabbing hooks.", icon: "Sparkles", category: "content", tags: ["Content"], hasInstructions: true },
  { id: "thumbnail-titles", name: "Thumbnail Titles", description: "Create text variations for your YouTube video thumbnail to increase your click-through rate.", icon: "Square", category: "content", tags: ["New", "YouTube"], hasInstructions: true },
  { id: "youtube-angles", name: "YouTube Angles", description: "Turn a dull idea into a video that's impossible to ignore.", icon: "Play", category: "content", tags: ["YouTube"], hasInstructions: true },
  { id: "youtube-description", name: "YouTube Description", description: "Create an SEO-optimized description based on the transcript of your video.", icon: "List", category: "content", tags: ["YouTube"], hasInstructions: true },
  { id: "youtube-thumbnails", name: "YouTube Thumbnails", description: "Suggestions for text, elements, and design for your YouTube thumbnails.", icon: "Image", category: "content", tags: ["New", "YouTube"], hasInstructions: true },
  { id: "youtube-titles", name: "Youtube titles", description: "Create optimized titles to perform well on YouTube.", icon: "ListVideo", category: "content", tags: ["YouTube"], hasInstructions: true },
];
