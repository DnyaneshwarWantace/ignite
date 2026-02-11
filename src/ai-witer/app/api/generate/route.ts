import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ============================================================================
// MODULAR PROMPT SYSTEM v3.0
// Load prompts from JSON for easy modification
// ============================================================================

// Load prompts from JSON file
const promptsPath = path.join(process.cwd(), "lib", "prompts.json");
const promptsData = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));

const CORE_BASE_PROMPT = promptsData.CORE_BASE_PROMPT;
const FRAMEWORK_LIBRARY = promptsData.FRAMEWORK_LIBRARY;
const MNEMONIC_FRAMEWORKS = promptsData.MNEMONIC_FRAMEWORKS;
const AGENT_PROMPTS = promptsData.AGENT_PROMPTS;

// Legacy constant for backward compatibility (uses CORE_BASE_PROMPT)
const ELITE_SYSTEM_PROMPT = CORE_BASE_PROMPT;

// DNA Section Order for Progressive Context
const DNA_SECTION_ORDER = [
  "authorBiography",
  "idealClientProfile",
  "authorBrandVoice",
  "buyingProfile",
  "persuasivePremise",
  "falseBeliefs",
  "productOfferUVP",
  "proofs",
  "testimonials",
  "theProblem",
  "theSolution",
];

// Helper function to get agent-specific instructions from JSON
function getAgentSpecificInstructions(agentName: string, vslSection?: string, funnelStage?: string, tweetFormat?: string, topic?: string): string {
  // Check AGENT_PROMPTS from JSON (primary source)
  if (AGENT_PROMPTS[agentName]) {
    let agentPrompt = AGENT_PROMPTS[agentName];
    
    // Handle dynamic parameters for specific agents
    if (agentName === "Twitter/X Content" && (funnelStage || tweetFormat)) {
      agentPrompt = agentPrompt.replace(/\[FUNNEL_STAGE\]/g, funnelStage || "Awareness");
      agentPrompt = agentPrompt.replace(/\[TWEET_FORMAT\]/g, tweetFormat || "Single Tweet");
    } else if (agentName === "Thumbnail Titles" && topic) {
      agentPrompt = agentPrompt.replace(/\[TOPIC\]/g, topic);
    } else if (agentName === "Perpetual Conversion Video" && vslSection) {
      // For VSL sections, modify the prompt to focus on the specific section
      agentPrompt = agentPrompt.replace(
        /## Task:[\s\S]*?## USE THEIR DNA/,
        `## Task:\nGenerate ONLY ${vslSection}\n\nThis section must be complete, engaging, and ready to use. Write in a conversational tone that builds emotional connection and drives action.\n\n## USE THEIR DNA`
      );
    }
    
    return agentPrompt;
  }
  
  // Fallback for agents not in JSON (shouldn't happen, but safety net)
  return `
## Task:
Create high-quality marketing content that:
- Speaks directly to the target audience
- Addresses their pain points and challenges
- Highlights unique value propositions
- Drives action with clear CTAs
- Fits the business's brand and voice

Use the business information provided to create authentic, conversion-focused content. Never mention AI, agents, or automation.`;
}

function buildPrompt(agentName: string, dnaData: any, generalInput: string, vslSection?: string, funnelStage?: string, tweetFormat?: string, keywords?: string, topic?: string, targetSectionId?: string): string {
  // Note: CORE_BASE_PROMPT is sent as system message, so we don't include it here
  // This saves tokens and avoids duplication
  let prompt = "";

  // Add DNA context - handle both old format (with .content) and new format
  if (dnaData) {
    // Determine which sections to include based on targetSectionId
    let sectionsToInclude: string[] = [];
    
    if (targetSectionId) {
      // If generating for a specific DNA section, only include previous sections
      const targetIndex = DNA_SECTION_ORDER.indexOf(targetSectionId);
      if (targetIndex > 0) {
        // Include all sections before the target section
        sectionsToInclude = DNA_SECTION_ORDER.slice(0, targetIndex);
      }
      // Note: We don't include the target section itself, as we're generating content for it
    } else {
      // If using a regular agent (not generating for a specific DNA section), include ALL completed sections
      sectionsToInclude = DNA_SECTION_ORDER;
    }

    prompt += "## Client's Business Information (Campaign DNA):\n\n";
    prompt += "Below is the personal information this specific client shared about their business. Use these exact details to create personalized content for them:\n\n";

    // Add context note for progressive building
    if (targetSectionId) {
      const targetIndex = DNA_SECTION_ORDER.indexOf(targetSectionId);
      if (targetIndex > 0) {
        prompt += `(Using context from ${targetIndex} previously completed sections)\n\n`;
      }
    }

    // Handle DNA sections - check both formats
    const getContent = (section: any) => {
      if (!section) return null;
      if (typeof section === 'string') return section;
      if (section.content) return section.content;
      return null;
    };

    // Section mapping for display names
    const sectionNames: Record<string, string> = {
      authorBiography: "Author/Company Bio",
      idealClientProfile: "Ideal Client Profile",
      authorBrandVoice: "Brand Voice",
      buyingProfile: "Buying Profile",
      persuasivePremise: "Persuasive Premise",
      falseBeliefs: "False Beliefs to Address",
      productOfferUVP: "Product/Offer/UVP",
      proofs: "Proofs",
      testimonials: "Testimonials",
      theProblem: "The Problem",
      theSolution: "The Solution",
    };

    // Only include sections that are in sectionsToInclude and have content
    for (const sectionId of sectionsToInclude) {
      const content = getContent(dnaData[sectionId]);
      if (content && content.trim()) {
        const sectionName = sectionNames[sectionId] || sectionId;
        prompt += `**${sectionName}:**\n${content}\n\n`;
      }
    }

    // If no sections had content, mention it
    const hasAnyContent = sectionsToInclude.some(sectionId => {
      const content = getContent(dnaData[sectionId]);
      return content && content.trim();
    });

    if (!hasAnyContent) {
      prompt += `No personal business details provided yet in DNA sections. Create content based on general best practices and the additional context below. Note: Content will be more personalized and effective once the client fills in their DNA sections with their specific business details.\n\n`;
    }
  }

  // Add general input
  if (generalInput) {
    prompt += `## Additional Context:\n${generalInput}\n\n`;
  }

  // Add VSL section if specified
  if (vslSection) {
    prompt += `## VSL Section to Generate:\n${vslSection}\n\n`;
  }

  // Add funnel stage if specified
  if (funnelStage) {
    prompt += `## Funnel Stage:\n${funnelStage}\n\n`;
  }

  // Add tweet format if specified
  if (tweetFormat) {
    prompt += `## Tweet Format:\n${tweetFormat}\n\n`;
  }

  // Add keywords if specified
  if (keywords) {
    prompt += `## Keywords:\n${keywords}\n\n`;
  }

  // Add topic if specified
  if (topic) {
    prompt += `## Topic:\n${topic}\n\n`;
  }

  // Add MNEMONIC_FRAMEWORKS for quick reference
  prompt += `\n\n${MNEMONIC_FRAMEWORKS}\n\n`;

  // Add specific instructions based on agent from AGENT_PROMPTS
  const agentPrompt = getAgentSpecificInstructions(agentName, vslSection, funnelStage, tweetFormat, topic);
  if (agentPrompt) {
    prompt += `\n\n${agentPrompt}\n\n`;
  }

  return prompt;
}

// Helper function to clean markdown
function cleanMarkdown(text: string): string {
  if (!text) return "";
  
  // Remove common markdown artifacts
  let cleaned = text
    .replace(/```markdown\n/g, "")
    .replace(/```\n/g, "")
    .replace(/```/g, "")
    .replace(/^#+\s*$/gm, "") // Remove empty headers
    .trim();

  return cleaned;
}

// Using OpenAI only

export async function POST(request: NextRequest) {
  try {
    const { agentId, dnaData, generalInput, agentName, vslSection, funnelStage, tweetFormat, keywords, topic, language, targetSectionId } = await request.json();

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file",
        },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!agentName) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 }
      );
    }

    // Build the prompt using the modular system
    const fullPrompt = buildPrompt(
      agentName,
      dnaData,
      generalInput || "",
      vslSection,
      funnelStage,
      tweetFormat,
      keywords,
      topic,
      targetSectionId
    );

    // Start timing
    const startTime = Date.now();

    // Use OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY!;
    // Use gpt-4.1 as default model
    const modelUsed = process.env.OPENAI_MODEL || "gpt-4.1";
    
    let content = "";
    let tokensUsed = {
      prompt: 0,
      completion: 0,
      total: 0,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: modelUsed,
        messages: [
          {
            role: "system",
            content: CORE_BASE_PROMPT,
          },
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Better error handling for quota/rate limit issues
      if (response.status === 429) {
        if (errorData.error?.code === 'insufficient_quota') {
          throw new Error(
            `OpenAI Quota Error: ${errorData.error?.message || 'Insufficient quota. Please check your OpenAI account billing and usage limits at https://platform.openai.com/account/billing'}`
          );
        } else {
          throw new Error(
            `OpenAI Rate Limit: Too many requests. Please wait a moment and try again. ${errorData.error?.message || ''}`
          );
        }
      }
      
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    content = data.choices[0]?.message?.content || "";
    
    // Extract token usage from OpenAI response
    if (data.usage) {
      tokensUsed = {
        prompt: data.usage.prompt_tokens || 0,
        completion: data.usage.completion_tokens || 0,
        total: data.usage.total_tokens || 0,
      };
    }

    // Calculate time taken
    const endTime = Date.now();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2); // in seconds

    // Clean the markdown output
    const cleanedContent = cleanMarkdown(content);

    if (!cleanedContent) {
      return NextResponse.json(
        { error: "No content generated. Please try again." },
        { status: 500 }
      );
    }

    // Return the generated content with metadata
    return NextResponse.json({
      content: cleanedContent,
      agentId,
      agentName,
      metadata: {
        timeTaken: `${timeTaken}s`,
        timeTakenMs: endTime - startTime,
        tokens: tokensUsed,
        model: modelUsed,
        provider: "openai",
        // Raw input data
        rawInput: {
          generalInput: generalInput || "",
          dnaData: dnaData || null,
          vslSection: vslSection || null,
          funnelStage: funnelStage || null,
          tweetFormat: tweetFormat || null,
          keywords: keywords || null,
          topic: topic || null,
          language: language || "en",
          targetSectionId: targetSectionId || null,
        },
        // Constructed prompt
        prompt: fullPrompt,
        systemPrompt: CORE_BASE_PROMPT,
        // Summary for quick reference
        inputParams: {
          dnaData: dnaData ? "Provided" : "Not provided",
          generalInput: generalInput || "None",
          vslSection: vslSection || "None",
          funnelStage: funnelStage || "None",
          tweetFormat: tweetFormat || "None",
          keywords: keywords || "None",
          topic: topic || "None",
          language: language || "en",
          targetSectionId: targetSectionId || "None",
        },
      },
    });
  } catch (error: any) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate content. Please try again.",
      },
      { status: 500 }
    );
  }
}

