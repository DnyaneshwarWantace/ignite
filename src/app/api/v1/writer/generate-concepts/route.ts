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

// POST - Generate 5 unique ad concepts based on brief data
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { briefData } = await request.json();

      if (!briefData) {
        return createError({
          message: "Brief data is required"
        });
      }

      const conceptGenerationPrompt = `
Create 5 unique ad concepts for this brand. Be creative and strategic.

BRIEF: ${briefData.brandName} - ${briefData.productName}
OBJECTIVE: ${briefData.adObjective}
TARGET: ${briefData.targetAudience}
TONE: ${briefData.toneOfVoice}

Create 5 concepts with this structure:
{
  "conceptNumber": 1-5,
  "conceptName": "Creative name",
  "conceptDescription": "Detailed concept description (200 words - explain the full concept, visual approach, messaging strategy, and execution details)",
  "coreDesires": ["desire1", "desire2"],
  "coreDesireDescription": "Why this concept works (100 words - explain the psychological and emotional appeal)",
  "emotionsToEvoke": ["emotion1", "emotion2"],
  "emotionDescription": "How it makes people feel (100 words - describe the emotional journey and impact)",
  "targetAudienceSegment": "Specific audience",
  "uniqueAngle": "What makes it different",
  "visualStyle": "Visual approach",
  "toneOfVoice": "Tone for this concept",
  "keyMessage": "Main message",
  "callToAction": "Suggested CTA",
  "desireOptions": ["option1", "option2", "option3", "option4", "option5"],
  "emotionOptions": ["option1", "option2", "option3", "option4", "option5"]
}

Make each concept completely different. Focus on: Problem-Solution, Lifestyle, Testimonial, Storytelling, Humor.

For each concept, also generate:
- "desireOptions": 5 relevant core desires that could work for this concept
- "emotionOptions": 5 relevant emotions that could be evoked for this concept

These options should be specific to each concept's unique angle and target audience.

Return JSON array only.
`;

      // Generate concepts using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert creative director specializing in advertising concept development. Create unique, compelling, and strategically sound ad concepts."
          },
          {
            role: "user",
            content: conceptGenerationPrompt
          }
        ],
        temperature: 0.7, // Balanced creativity
        max_tokens: 3500
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        return createError({
          message: "Failed to generate concepts"
        });
      }

      // Parse the JSON response
      let concepts;
      try {
        concepts = JSON.parse(responseText);
        
        // Ensure we have exactly 5 concepts
        if (!Array.isArray(concepts) || concepts.length !== 5) {
          throw new Error('Invalid concept format');
        }
      } catch (error) {
        console.error('Failed to parse concepts response:', responseText);
        return createError({
          message: "Failed to parse concept generation response"
        });
      }

      return createResponse({
        message: "Concepts generated successfully",
        payload: {
          concepts,
          briefData,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating concepts:', error);
      return createError({
        message: "Failed to generate concepts",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// GET - Get concept generation status or history
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      return createResponse({
        message: "Concept generation service is available",
        payload: {
          service: "concept-generation",
          status: "active",
          maxConcepts: 5
        }
      });

    } catch (error) {
      console.error('Error checking concept generation service:', error);
      return createError({
        message: "Failed to check service status",
        payload: { error: (error as Error).message }
      });
    }
  }
); 