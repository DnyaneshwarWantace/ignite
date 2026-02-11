import fs from "fs";
import path from "path";

const promptsPath = path.join(process.cwd(), "src", "lib", "ai-writer", "prompts.json");
let promptsData: any = null;

function getPrompts() {
  if (!promptsData) {
    promptsData = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));
  }
  return promptsData;
}

const DNA_SECTION_ORDER = [
  "authorBiography", "idealClientProfile", "authorBrandVoice", "buyingProfile",
  "persuasivePremise", "falseBeliefs", "productOfferUVP", "proofs", "testimonials",
  "theProblem", "theSolution",
];

export function getCoreBasePrompt(): string {
  return getPrompts().CORE_BASE_PROMPT;
}

export function getAgentSpecificInstructions(
  agentName: string,
  vslSection?: string,
  funnelStage?: string,
  tweetFormat?: string,
  topic?: string
): string {
  const AGENT_PROMPTS = getPrompts().AGENT_PROMPTS || {};
  if (AGENT_PROMPTS[agentName]) {
    let agentPrompt = AGENT_PROMPTS[agentName];
    if (agentName === "Twitter/X Content" && (funnelStage || tweetFormat)) {
      agentPrompt = agentPrompt.replace(/\[FUNNEL_STAGE\]/g, funnelStage || "Awareness");
      agentPrompt = agentPrompt.replace(/\[TWEET_FORMAT\]/g, tweetFormat || "Single Tweet");
    } else if (agentName === "Thumbnail Titles" && topic) {
      agentPrompt = agentPrompt.replace(/\[TOPIC\]/g, topic);
    } else if (agentName === "Perpetual Conversion Video" && vslSection) {
      agentPrompt = agentPrompt.replace(
        /## Task:[\s\S]*?## USE THEIR DNA/,
        `## Task:\nGenerate ONLY ${vslSection}\n\nThis section must be complete, engaging, and ready to use. Write in a conversational tone that builds emotional connection and drives action.\n\n## USE THEIR DNA`
      );
    }
    return agentPrompt;
  }
  return `\n## Task:\nCreate high-quality marketing content that speaks to the target audience, addresses pain points, highlights value, and drives action. Use the business information provided. Never mention AI or automation.`;
}

export function buildAWriterPrompt(
  agentName: string,
  dnaData: any,
  generalInput: string,
  vslSection?: string,
  funnelStage?: string,
  tweetFormat?: string,
  keywords?: string,
  topic?: string,
  targetSectionId?: string
): string {
  const { MNEMONIC_FRAMEWORKS } = getPrompts();
  let prompt = "";

  if (dnaData) {
    let sectionsToInclude: string[] = targetSectionId
      ? DNA_SECTION_ORDER.slice(0, Math.max(0, DNA_SECTION_ORDER.indexOf(targetSectionId)))
      : DNA_SECTION_ORDER;

    prompt += "## Client's Business Information (Campaign DNA):\n\nBelow is the personal information this specific client shared about their business. Use these exact details to create personalized content for them:\n\n";
    if (targetSectionId && DNA_SECTION_ORDER.indexOf(targetSectionId) > 0) {
      prompt += `(Using context from ${DNA_SECTION_ORDER.indexOf(targetSectionId)} previously completed sections)\n\n`;
    }

    const getContent = (section: any) => {
      if (!section) return null;
      if (typeof section === "string") return section;
      if (section?.content) return section.content;
      return null;
    };
    const sectionNames: Record<string, string> = {
      authorBiography: "Author/Company Bio", idealClientProfile: "Ideal Client Profile", authorBrandVoice: "Brand Voice",
      buyingProfile: "Buying Profile", persuasivePremise: "Persuasive Premise", falseBeliefs: "False Beliefs to Address",
      productOfferUVP: "Product/Offer/UVP", proofs: "Proofs", testimonials: "Testimonials", theProblem: "The Problem", theSolution: "The Solution",
    };
    for (const sectionId of sectionsToInclude) {
      const content = getContent(dnaData[sectionId]);
      if (content && String(content).trim()) prompt += `**${sectionNames[sectionId] || sectionId}:**\n${content}\n\n`;
    }
    const hasAny = sectionsToInclude.some((id) => getContent(dnaData[id]) && String(getContent(dnaData[id])).trim());
    if (!hasAny) prompt += "No personal business details provided yet in DNA sections. Create content based on general best practices and the additional context below.\n\n";
  }

  if (generalInput) prompt += `## Additional Context:\n${generalInput}\n\n`;
  if (vslSection) prompt += `## VSL Section to Generate:\n${vslSection}\n\n`;
  if (funnelStage) prompt += `## Funnel Stage:\n${funnelStage}\n\n`;
  if (tweetFormat) prompt += `## Tweet Format:\n${tweetFormat}\n\n`;
  if (keywords) prompt += `## Keywords:\n${keywords}\n\n`;
  if (topic) prompt += `## Topic:\n${topic}\n\n`;
  prompt += `\n\n${MNEMONIC_FRAMEWORKS || ""}\n\n`;
  prompt += getAgentSpecificInstructions(agentName, vslSection, funnelStage, tweetFormat, topic);
  return prompt;
}

export function cleanMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/```markdown\n/g, "")
    .replace(/```\n/g, "")
    .replace(/```/g, "")
    .replace(/^#+\s*$/gm, "")
    .trim();
}
