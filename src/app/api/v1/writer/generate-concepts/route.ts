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
You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Create EXACTLY 5 unique, conversion-focused ad concepts that embody the aggressive, results-driven approach that has generated over $7.8 billion in client revenue.

BRIEF DATA:
Brand: ${briefData.brandName}
Product: ${briefData.productName}
Objective: ${briefData.adObjective}
Target: ${briefData.targetAudience}
Tone: ${briefData.toneOfVoice}
${briefData.psychologicalTriggers ? `Psychological Triggers: ${briefData.psychologicalTriggers.join(', ')}` : ''}
${briefData.painPoints ? `Pain Points: ${briefData.painPoints.join(', ')}` : ''}
${briefData.coreDesires ? `Core Desires: ${briefData.coreDesires.join(', ')}` : ''}

SABRI SUBY CONCEPT CREATION METHODOLOGY:
1. PSYCHOLOGICAL TRIGGERS: Each concept must leverage specific psychological triggers (scarcity, authority, social proof, reciprocity, commitment/consistency, liking)
2. MESSAGING FRAMEWORK: Apply problem agitation, solution presentation, and transformation focus
3. CONVERSION FOCUS: Every concept must be designed to compel immediate action
4. PROOF ELEMENTS: Include testimonials, case studies, results, and social proof
5. RISK REVERSAL: Address skepticism with guarantees and proof
6. URGENCY & SCARCITY: Create compelling reasons to act now

CRITICAL REQUIREMENT: You MUST create EXACTLY 5 concepts. No more, no less.

Create 5 concepts with this structure:
[
  {
    "conceptNumber": 1,
    "conceptName": "Compelling, conversion-focused name",
    "conceptDescription": "Detailed concept description (300+ words - explain the full concept, visual approach, messaging strategy, psychological triggers, and execution details)",
    "coreDesires": ["desire1", "desire2"],
    "coreDesireDescription": "Why this concept works (150 words - explain the psychological and emotional appeal using Sabri Suby's methodology)",
    "emotionsToEvoke": ["emotion1", "emotion2"],
    "emotionDescription": "How it makes people feel (150 words - describe the emotional journey and impact)",
    "targetAudienceSegment": "Specific audience segment",
    "uniqueAngle": "What makes it different and compelling",
    "visualStyle": "Visual approach and design strategy",
    "toneOfVoice": "Tone for this concept",
    "keyMessage": "Main conversion-focused message",
    "callToAction": "Compelling CTA that drives action",
    "psychologicalTriggers": ["trigger1", "trigger2", "trigger3"],
    "proofElements": ["proof1", "proof2", "proof3"],
    "urgencyElements": ["urgency1", "urgency2"],
    "riskReversal": "How to address skepticism",
    "desireOptions": ["option1", "option2", "option3", "option4", "option5"],
    "emotionOptions": ["option1", "option2", "option3", "option4", "option5"]
  },
  {
    "conceptNumber": 2,
    "conceptName": "Second concept name",
    "conceptDescription": "Second concept description...",
    // ... same structure for concept 2
  },
  {
    "conceptNumber": 3,
    "conceptName": "Third concept name",
    "conceptDescription": "Third concept description...",
    // ... same structure for concept 3
  },
  {
    "conceptNumber": 4,
    "conceptName": "Fourth concept name",
    "conceptDescription": "Fourth concept description...",
    // ... same structure for concept 4
  },
  {
    "conceptNumber": 5,
    "conceptName": "Fifth concept name",
    "conceptDescription": "Fifth concept description...",
    // ... same structure for concept 5
  }
]

CONCEPT TYPES (one of each):
1. Problem-Agitation-Solution: Amplify pain points before presenting solution
2. Social Proof/Testimonial: Leverage authority and peer validation
3. Scarcity/Urgency: Create time-sensitive, limited availability
4. Storytelling/Transformation: Sell the dream and "promised land"
5. Authority/Expertise: Establish credibility and trust

Each concept must:
- Use specific psychological triggers from Sabri Suby's methodology
- Include proof elements and social proof
- Address skepticism with risk reversal
- Create urgency and scarcity
- Focus on transformation, not just features
- Be designed for immediate action and conversion

IMPORTANT: Return ONLY a valid JSON array with exactly 5 concepts. Do not include any additional text or explanations.
`;

      // Generate concepts using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Your concept creation embodies the aggressive, results-driven approach that has generated over $7.8 billion in client revenue.

CORE PHILOSOPHY:
- Create concepts that cut through noise, demand attention, and compel immediate action
- Focus on psychological triggers (scarcity, authority, social proof, reciprocity, commitment/consistency, liking)
- Apply problem agitation, solution presentation, and transformation focus
- Always assume skepticism and address it head-on with proof and guarantees

CONCEPT CREATION APPROACH:
- Each concept must be designed for maximum conversion
- Use specific psychological triggers from Sabri Suby's methodology
- Include proof elements and social proof in every concept
- Address skepticism with risk reversal strategies
- Create urgency and scarcity elements
- Focus on transformation and outcomes, not just features

Create unique, compelling, and strategically sound ad concepts that drive immediate action.`
          },
          {
            role: "user",
            content: conceptGenerationPrompt
          }
        ],
        temperature: 0.6, // Balanced creativity with focus
        max_tokens: 5000
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
        if (!Array.isArray(concepts)) {
          console.error('Response is not an array:', responseText);
          return createError({
            message: "Invalid response format - expected array of concepts"
          });
        }
        
        if (concepts.length !== 5) {
          console.error(`Expected 5 concepts, got ${concepts.length}:`, responseText);
          return createError({
            message: `Expected 5 concepts, but received ${concepts.length}. Please try again.`
          });
        }
        
        // Validate each concept has required fields
        for (let i = 0; i < concepts.length; i++) {
          const concept = concepts[i];
          if (!concept.conceptName || !concept.conceptDescription) {
            console.error(`Concept ${i + 1} missing required fields:`, concept);
            return createError({
              message: `Concept ${i + 1} is missing required fields. Please try again.`
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse concepts response:', responseText);
        return createError({
          message: "Failed to parse concept generation response. Please try again."
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