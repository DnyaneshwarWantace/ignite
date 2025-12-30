import { NextRequest, NextResponse } from "next/server";
// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST - Generate compelling hooks for each concept
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { concepts } = await request.json();
      
      console.log('Received hook generation request:', {
        conceptsCount: concepts?.length,
        concepts: concepts
      });

      if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
        return createError({
          message: "Concepts array is required"
        });
      }

      const hookGenerationPrompt = `
You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Create 3 compelling hooks for each concept that embody the aggressive, results-driven approach that has generated over $7.8 billion in client revenue.

CONCEPTS DATA:
${concepts.map((concept, index) => `
CONCEPT ${index + 1}: ${concept.conceptName}
DESCRIPTION: ${concept.conceptDescription || 'N/A'}
CORE DESIRES: ${concept.coreDesires?.join(', ') || 'N/A'}
EMOTIONS TO EVOKE: ${concept.emotionsToEvoke?.join(', ') || 'N/A'}
TARGET AUDIENCE: ${concept.targetAudienceSegment || 'N/A'}
UNIQUE ANGLE: ${concept.uniqueAngle || 'N/A'}
VISUAL STYLE: ${concept.visualStyle || 'N/A'}
TONE OF VOICE: ${concept.toneOfVoice || 'N/A'}
KEY MESSAGE: ${concept.keyMessage || 'N/A'}
PSYCHOLOGICAL TRIGGERS: ${concept.psychologicalTriggers?.join(', ') || 'N/A'}
PROOF ELEMENTS: ${concept.proofElements?.join(', ') || 'N/A'}
URGENCY ELEMENTS: ${concept.urgencyElements?.join(', ') || 'N/A'}
RISK REVERSAL: ${concept.riskReversal || 'N/A'}
`).join('\n\n')}

SABRI SUBY HOOK CREATION METHODOLOGY:
1. PSYCHOLOGICAL TRIGGERS: Each hook must leverage specific psychological triggers (scarcity, authority, social proof, reciprocity, commitment/consistency, liking)
2. PATTERN INTERRUPT: Create hooks that stop scrolling with bold, provocative statements
3. PROBLEM AMPLIFICATION: Spend significant time on pain points and failed attempts
4. CREDIBILITY BUILDING: Establish authority with specific proof and results
5. SOCIAL PROOF: Layer testimonials and case studies throughout
6. URGENCY & SCARCITY: Drive immediate action with time-sensitive elements
7. RISK REVERSAL: Remove all purchase anxiety with guarantees

CRITICAL: Create EXACTLY 3 hooks for each concept with COMPLETE structure.

For each concept, create this EXACT structure:
{
  "conceptNumber": 1-5,
  "conceptName": "Concept name",
  "hooks": [
    {
      "hookNumber": 1,
      "hookType": "Pattern Interrupt",
      "hookText": "Hook text (under 120 chars - bold, provocative, stops scrolling)",
      "targetEmotion": "Primary emotion (fear, greed, pride, curiosity, anger)",
      "rationale": "Why it works (50 words - explain psychological trigger and emotional appeal)",
      "variations": ["Alt 1", "Alt 2"],
      "psychologicalTrigger": "scarcity|authority|social_proof|reciprocity|commitment|liking",
      "urgencyElement": "Time-sensitive or scarcity element",
      "proofElement": "Specific proof or social proof element"
    },
    {
      "hookNumber": 2,
      "hookType": "Problem Agitation",
      "hookText": "Hook text (under 120 chars - amplify pain points)",
      "targetEmotion": "Primary emotion",
      "rationale": "Why it works (50 words - explain problem amplification)",
      "variations": ["Alt 1", "Alt 2"],
      "psychologicalTrigger": "scarcity|authority|social_proof|reciprocity|commitment|liking",
      "urgencyElement": "Time-sensitive or scarcity element",
      "proofElement": "Specific proof or social proof element"
    },
    {
      "hookNumber": 3,
      "hookType": "Solution Presentation",
      "hookText": "Hook text (under 120 chars - present solution as inevitable)",
      "targetEmotion": "Primary emotion",
      "rationale": "Why it works (50 words - explain solution presentation)",
      "variations": ["Alt 1", "Alt 2"],
      "psychologicalTrigger": "scarcity|authority|social_proof|reciprocity|commitment|liking",
      "urgencyElement": "Time-sensitive or scarcity element",
      "proofElement": "Specific proof or social proof element"
    }
  ]
}

HOOK TYPES TO USE (one of each per concept):
- Pattern Interrupt: "WARNING: [Threat] Unless You [Specific Action] [Timeframe]"
- Problem Agitation: "Tired of [Pain Point]? Here's What [Specific Person] Did..."
- Solution Presentation: "Finally! A [Solution Type] That [Solves Problem] Without [Common Negative]"
- Social Proof: "How [Specific Person] [Achieved Specific Result] [In Specific Timeframe]"
- Authority/Expertise: "The [Number] [Adjective] Secrets That [Target Audience] Use to [Desired Outcome]"
- Scarcity/Urgency: "Only [Number] [Timeframe] Left to [Specific Action] - [Consequence]"
- Curiosity: "The [Adjective] Method [Specific Person] Used to [Achieve Result]"
- Story: "When [Specific Person] [Specific Action], [Unexpected Result] Happened"
- Statistic: "[Specific Number]% of [Target Audience] [Specific Behavior] - Here's Why"
- Risk Reversal: "What If [Specific Person] Could [Desired Outcome] Without [Risk]?"

HOOK REQUIREMENTS:
- Include specific numbers whenever possible
- Create curiosity gaps that demand resolution
- Address the target audience's biggest pain point
- Promise a clear, specific benefit
- Include urgency or scarcity elements
- Use power words that trigger emotions
- Make it impossible to ignore, difficult to dismiss, and compulsive to act upon

IMPORTANT: Ensure EVERY hook has ALL required fields: hookNumber, hookType, hookText, targetEmotion, rationale, variations, psychologicalTrigger, urgencyElement, and proofElement.

Return ONLY valid JSON array with exactly ${concepts.length} concept objects.
`;

      // Generate hooks using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Your hook creation embodies the aggressive, results-driven approach that has generated over $7.8 billion in client revenue.

CORE PHILOSOPHY:
- Create hooks that cut through noise, demand attention, and compel immediate action
- Focus on psychological triggers (scarcity, authority, social proof, reciprocity, commitment/consistency, liking)
- Apply pattern interrupt, problem agitation, and solution presentation
- Always assume skepticism and address it head-on with proof and guarantees

HOOK CREATION APPROACH:
- Each hook must be designed to stop scrolling and demand attention
- Use specific psychological triggers from Sabri Suby's methodology
- Include proof elements and social proof in every hook
- Address skepticism with risk reversal strategies
- Create urgency and scarcity elements
- Focus on transformation and outcomes, not just features

Create compelling advertising hooks that drive immediate engagement and conversions.`
          },
          {
            role: "user",
            content: hookGenerationPrompt
          }
        ],
        temperature: 0.5, // More focused for consistency
        max_tokens: 4000
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        return createError({
          message: "Failed to generate hooks"
        });
      }

      // Parse the JSON response
      let hooksData;
      try {
        hooksData = JSON.parse(responseText);
        
        // Validate and fix the structure
        if (!Array.isArray(hooksData)) {
          throw new Error('Response is not an array');
        }
        
        // Ensure we have hooks for each concept and validate each hook
        if (hooksData.length !== concepts.length) {
          throw new Error(`Expected ${concepts.length} concepts, got ${hooksData.length}`);
        }
        
        // Validate each concept and its hooks
        hooksData = hooksData.map((concept: any, conceptIndex: number) => {
          if (!concept.hooks || !Array.isArray(concept.hooks)) {
            throw new Error(`Concept ${conceptIndex + 1} missing hooks array`);
          }
          
          // Ensure each hook has all required fields
          concept.hooks = concept.hooks.map((hook: any, hookIndex: number) => {
            if (!hook.hookNumber) hook.hookNumber = hookIndex + 1;
            if (!hook.hookType) {
              const types = ['Question', 'Problem', 'Curiosity', 'Story', 'Statistic'];
              hook.hookType = types[hookIndex % types.length];
            }
            if (!hook.hookText) hook.hookText = 'Hook text missing';
            if (!hook.targetEmotion) hook.targetEmotion = 'Engagement';
            if (!hook.rationale) hook.rationale = 'Designed to engage the target audience';
            if (!hook.variations || !Array.isArray(hook.variations)) {
              hook.variations = ['Variation 1', 'Variation 2'];
            }
            return hook;
          });
          
          return concept;
        });
        
        console.log('✅ Hooks data validated and fixed successfully');
      } catch (error) {
        console.error('Failed to parse hooks response:', responseText);
        console.error('Parse error:', error);
        return createError({
          message: "Failed to parse hook generation response",
          payload: { error: (error as Error).message, responsePreview: responseText.substring(0, 500) }
        });
      }

      return createResponse({
        message: "Hooks generated successfully",
        payload: {
          hooksData,
          concepts,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating hooks:', error);
      return createError({
        message: "Failed to generate hooks",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// GET - Get hook generation status or examples
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      return createResponse({
        message: "Hook generation service is available",
        payload: {
          service: "hook-generation",
          status: "active",
          hookTypes: [
            "Question Hooks",
            "Problem-Agitation Hooks", 
            "Curiosity Hooks",
            "Story Hooks",
            "Statistic Hooks",
            "Contrarian Hooks",
            "Urgency Hooks",
            "Aspirational Hooks",
            "Pain Point Hooks",
            "Benefit Hooks"
          ]
        }
      });

    } catch (error) {
      console.error('Error checking hook generation service:', error);
      return createError({
        message: "Failed to check service status",
        payload: { error: (error as Error).message }
      });
    }
  }
); 