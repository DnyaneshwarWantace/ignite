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

// POST - Analyze image using OpenAI Vision
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { imageUrl, analysisType = "general" } = await request.json();

      if (!imageUrl) {
        return createError({
          message: "Image URL is required"
        });
      }

      // Validate that it's a Cloudinary URL or other trusted source
      const isTrustedUrl = imageUrl.includes('res.cloudinary.com') || 
                          imageUrl.includes('fbcdn.net') ||
                          imageUrl.startsWith('https://');

      if (!isTrustedUrl) {
        return createError({
          message: "Invalid image URL format"
        });
      }

      // Define analysis prompts based on type
      const analysisPrompts = {
        general: "Analyze this advertisement image and provide insights about: 1) Brand identity and messaging, 2) Visual design elements (colors, layout, typography), 3) Target audience indicators, 4) Call-to-action elements, 5) Product/service being advertised, 6) Emotional appeal and tone. Be specific and detailed.",
        
        marketing: "Analyze this advertisement image from a marketing perspective: 1) Marketing strategy and positioning, 2) Unique selling propositions, 3) Competitive advantages shown, 4) Customer pain points addressed, 5) Value proposition, 6) Marketing channels this ad would work best for. Focus on business and marketing insights.",
        
        creative: "Analyze this advertisement image from a creative design perspective: 1) Visual composition and layout, 2) Color psychology and palette choices, 3) Typography and text hierarchy, 4) Imagery and visual metaphors, 5) Brand consistency elements, 6) Creative effectiveness and memorability. Focus on design and creative execution.",
        
        audience: "Analyze this advertisement image to understand the target audience: 1) Demographics (age, gender, lifestyle), 2) Psychographics (interests, values, attitudes), 3) Behavioral indicators, 4) Socioeconomic indicators, 5) Cultural references, 6) Pain points and desires addressed. Be specific about who this ad targets."
      };

      const prompt = analysisPrompts[analysisType as keyof typeof analysisPrompts] || analysisPrompts.general;

      // Call OpenAI Vision API
      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing and advertising analyst. Analyze the provided advertisement image and provide detailed, professional insights. Be specific, actionable, and thorough in your analysis."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      const analysis = completion.choices[0]?.message?.content;
      
      if (!analysis) {
        return createError({
          message: "Failed to analyze image"
        });
      }

      return createResponse({
        message: "Image analyzed successfully",
        payload: {
          analysis,
          analysisType,
          imageUrl,
          model: "gpt-4-vision-preview"
        }
      });

    } catch (error) {
      console.error('Error analyzing image:', error);
      return createError({
        message: "Failed to analyze image",
        payload: { error: (error as Error).message }
      });
    }
  }
);

// GET - Get available analysis types
export const GET = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const analysisTypes = [
        {
          id: "general",
          name: "General Analysis",
          description: "Comprehensive analysis covering brand, design, audience, and messaging"
        },
        {
          id: "marketing",
          name: "Marketing Analysis", 
          description: "Focus on marketing strategy, positioning, and business insights"
        },
        {
          id: "creative",
          name: "Creative Analysis",
          description: "Design-focused analysis of visual elements and creative execution"
        },
        {
          id: "audience",
          name: "Audience Analysis",
          description: "Deep dive into target audience demographics and psychographics"
        }
      ];

      return createResponse({
        message: "Analysis types retrieved successfully",
        payload: { analysisTypes }
      });

    } catch (error) {
      console.error('Error getting analysis types:', error);
      return createError({
        message: "Failed to get analysis types",
        payload: { error: (error as Error).message }
      });
    }
  }
); 