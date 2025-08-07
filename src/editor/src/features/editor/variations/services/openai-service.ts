import OpenAI from 'openai';

interface TextVariationsResponse {
  variations: string[];
  error?: string;
}

class OpenAIService {
  private openai: OpenAI | null = null;

  constructor() {
    // Check if we're in browser environment (Next.js client-side)
    if (typeof window !== 'undefined') {
      console.warn('OpenAI service should not be used on client-side for security reasons');
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY is not configured. Variations will use fallback text generation.');
      return;
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  private isConfigured(): boolean {
    return this.openai !== null;
  }

  async generateTextVariations(originalText: string): Promise<TextVariationsResponse> {
    // If OpenAI is not configured, return fallback variations immediately
    if (!this.isConfigured()) {
      return this.getFallbackVariations(originalText);
    }

    try {
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a top-tier direct response copywriter trained in the principles of Sabri Suby, Dan Kennedy, and Russell Brunson.

Your job is to take a video script with multiple sentences (displayed as bold on-screen text throughout the video) and generate:

An enhanced version of the entire script — applying proven copywriting techniques to each sentence while maintaining narrative flow.

Then, generate 10 complete script variations that:

Keep the core message and narrative structure intact across ALL sentences
Maintain logical consistency between opening, middle, and closing sentences
Fit within 1–2 lines max per sentence (10–12 words or less per line)
Are clear, visual, high-contrast (to be used in story/feed ads)
Are written with attention-grabbing direct-response copywriting principles, such as:

Pattern interrupts
Big benefit first
Curiosity or contrast
"Reason why" or "how to" formats
Power words, specificity, emotional payoff
Conversational edge (like "Here's why I stopped doing ___")

CRITICAL: Each variation must maintain narrative coherence - if the opening sentence introduces a problem, the closing sentence must provide a solution. If the opening mentions a specific tool/result, the closing must reference the same tool/result.`
          },
          {
            role: "user",
            content: `Generate 9 variations of this text, keeping the core message but applying direct-response copywriting principles. Each variation should be attention-grabbing, clear, and high-contrast for video ads. Output as JSON array of plain text sentences: "${originalText}"`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const variations = JSON.parse(content);
      
      if (!Array.isArray(variations) || variations.length !== 9) {
        throw new Error('Invalid response format from OpenAI');
      }

      return { variations };
    } catch (error) {
      console.error('Error generating text variations:', error);
      return {
        ...this.getFallbackVariations(originalText),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getFallbackVariations(originalText: string): TextVariationsResponse {
    // Create truly different sentences based on the original text theme
    const variations = [];
    
    // If it's about creating video ads, generate related variations
    if (originalText.toLowerCase().includes('video') || originalText.toLowerCase().includes('ads') || originalText.toLowerCase().includes('create')) {
      variations.push(
        "Transform Your Vision Into Viral Video Content",
        "Build Stunning Video Campaigns in Minutes", 
        "Create Professional Video Ads That Convert",
        "Generate Engaging Video Content Instantly",
        "Design Video Ads That Drive Results",
        "Turn Ideas Into High-Converting Video Content",
        "Create Video Ads That Actually Work",
        "Generate Professional Video Content in Seconds",
        "Build Video Campaigns That Convert Like Crazy"
      );
    } else {
      // Generic creative variations for any text
      variations.push(
        `Make ${originalText.split(' ').slice(1, 3).join(' ')} Your Reality`,
        `Unlock the Power of ${originalText.split(' ').slice(-2).join(' ')}`,
        `Experience ${originalText.replace(/Turn|Create|Generate/gi, 'Revolutionary').split(' ').slice(0, 4).join(' ')}`,
        `Discover ${originalText.replace(/Ideas|Thoughts/gi, 'Innovation').split(' ').slice(1).join(' ')}`,
        `Master ${originalText.replace(/Video|Content/gi, 'Digital Marketing').split(' ').slice(-3).join(' ')}`,
        `Transform ${originalText.split(' ').slice(0, 2).join(' ')} Into Success`,
        `Revolutionize Your ${originalText.split(' ').slice(-2).join(' ')}`,
        `Unleash the Power of ${originalText.replace(/Create|Generate/gi, 'Innovative').split(' ').slice(1, 4).join(' ')}`,
        `Elevate Your ${originalText.split(' ').slice(-3).join(' ')} Game`
      );
    }
    
    return { 
      variations: variations.slice(0, 9)
    };
  }
}

export const openAIService = new OpenAIService();
export default OpenAIService;