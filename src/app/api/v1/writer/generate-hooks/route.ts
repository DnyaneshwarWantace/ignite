import { NextRequest, NextResponse } from "next/server";
import { User } from "@prisma/client";
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
Create 3 compelling hooks for each concept based on the concept details. Make them attention-grabbing and platform-ready.

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
`).join('\n\n')}

CRITICAL: Create EXACTLY 3 hooks for each concept with COMPLETE structure.

For each concept, create this EXACT structure:
{
  "conceptNumber": 1-5,
  "conceptName": "Concept name",
  "hooks": [
    {
      "hookNumber": 1,
      "hookType": "Question",
      "hookText": "Hook text (under 120 chars)",
      "targetEmotion": "Primary emotion",
      "rationale": "Why it works (30 words)",
      "variations": ["Alt 1", "Alt 2"]
    },
    {
      "hookNumber": 2,
      "hookType": "Problem",
      "hookText": "Hook text (under 120 chars)",
      "targetEmotion": "Primary emotion",
      "rationale": "Why it works (30 words)",
      "variations": ["Alt 1", "Alt 2"]
    },
    {
      "hookNumber": 3,
      "hookType": "Curiosity",
      "hookText": "Hook text (under 120 chars)",
      "targetEmotion": "Primary emotion",
      "rationale": "Why it works (30 words)",
      "variations": ["Alt 1", "Alt 2"]
    }
  ]
}

Hook Types to use (one of each per concept):
- Question: "What if you could..."
- Problem: "Tired of..."
- Curiosity: "The secret to..."
- Story: "When Sarah tried..."
- Statistic: "87% of people..."

IMPORTANT: Ensure EVERY hook has ALL required fields: hookNumber, hookType, hookText, targetEmotion, rationale, and variations.

Return ONLY valid JSON array with exactly ${concepts.length} concept objects.
`;

      // Generate hooks using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert copywriter specializing in creating compelling advertising hooks that drive engagement and conversions."
          },
          {
            role: "user",
            content: hookGenerationPrompt
          }
        ],
        temperature: 0.6, // More focused
        max_tokens: 2500
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
        hooksData = hooksData.map((concept, conceptIndex) => {
          if (!concept.hooks || !Array.isArray(concept.hooks)) {
            throw new Error(`Concept ${conceptIndex + 1} missing hooks array`);
          }
          
          // Ensure each hook has all required fields
          concept.hooks = concept.hooks.map((hook, hookIndex) => {
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