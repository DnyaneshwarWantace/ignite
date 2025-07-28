import { NextRequest, NextResponse } from "next/server";
import { User } from "@prisma/client";
import { authMiddleware } from "@middleware";
import { createResponse, createError } from "@apiUtils/responseutils";
import messages from "@apiUtils/messages";
import OpenAI from "openai";
import prisma from "@prisma/index";

export const dynamic = "force-dynamic";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST - Analyze ads and generate brief data
export const POST = authMiddleware(
  async (request: NextRequest, context: any, user: User) => {
    try {
      const { ads } = await request.json();

      if (!ads || !Array.isArray(ads) || ads.length === 0) {
        return createError({
          message: "Ads array is required"
        });
      }

      if (ads.length > 5) {
        return createError({
          message: "Maximum 5 ads allowed for analysis"
        });
      }

      // Fetch actual ad data from database to get Cloudinary URLs
      const adsWithFullData = await Promise.all(
        ads.map(async (savedAd: any) => {
          const adData = JSON.parse(savedAd.adData || '{}');
          
          // Fetch the actual ad from database to get Cloudinary URLs
          const actualAd = await prisma.ad.findUnique({
            where: { id: savedAd.adId },
            select: {
              id: true,
              localImageUrl: true,
              localVideoUrl: true,
              content: true,
              imageUrl: true,
              videoUrl: true
            }
          });
          
          // Extract image URLs with priority for Cloudinary URLs
          let imageUrls: string[] = [];
          
          // First priority: Use Cloudinary URLs from database
          if (actualAd?.localImageUrl) {
            imageUrls.push(actualAd.localImageUrl);
          }
          
          // Second priority: Extract from actual ad content
          if (actualAd?.content) {
            try {
              const content = JSON.parse(actualAd.content);
              const snapshot = content.snapshot || {};
              
              // Extract from images array
              if (snapshot.images && Array.isArray(snapshot.images)) {
                snapshot.images.forEach((img: any) => {
                  if (img.original_image_url) imageUrls.push(img.original_image_url);
                  if (img.resized_image_url) imageUrls.push(img.resized_image_url);
                });
              }
              
              // Extract from cards array for carousel ads
              if (snapshot.cards && Array.isArray(snapshot.cards)) {
                snapshot.cards.forEach((card: any) => {
                  if (card.original_image_url) imageUrls.push(card.original_image_url);
                  if (card.resized_image_url) imageUrls.push(card.resized_image_url);
                });
              }
            } catch (error) {
              console.log('Error extracting image URLs from actual ad content:', error);
            }
          }
          
          // Third priority: Extract from saved ad data (fallback)
          try {
            if (adData.content) {
              const content = JSON.parse(adData.content);
              const snapshot = content.snapshot || {};
              
              if (snapshot.images && Array.isArray(snapshot.images)) {
                snapshot.images.forEach((img: any) => {
                  if (img.original_image_url) imageUrls.push(img.original_image_url);
                  if (img.resized_image_url) imageUrls.push(img.resized_image_url);
                });
              }
              
              if (snapshot.cards && Array.isArray(snapshot.cards)) {
                snapshot.cards.forEach((card: any) => {
                  if (card.original_image_url) imageUrls.push(card.original_image_url);
                  if (card.resized_image_url) imageUrls.push(card.resized_image_url);
                });
              }
            }
          } catch (error) {
            console.log('Error extracting image URLs from saved ad data:', error);
          }
          
          // Get the best image URL (prefer Cloudinary URLs)
          const cloudinaryUrls = imageUrls.filter(url => url.includes('res.cloudinary.com'));
          const bestImageUrl = cloudinaryUrls.length > 0 ? cloudinaryUrls[0] : imageUrls[0];
          
          return {
            brandName: adData.companyName,
            title: adData.title,
            description: adData.description,
            ctaText: adData.ctaText,
            landingPageUrl: adData.landingPageUrl,
            content: actualAd?.content || adData.content,
            imageUrl: bestImageUrl || null
          };
        })
      );

      // Create comprehensive prompt that includes both text and image analysis
      const adsWithImages = adsWithFullData.filter(ad => ad.imageUrl);
      
      let prompt = `
You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Your analysis embodies the aggressive, results-driven approach that has generated over $7.8 billion in client revenue. Analyze these ads with the precision of a master marketer who understands psychological triggers, messaging frameworks, and conversion psychology.

ADS TO ANALYZE:
${adsWithFullData.map((ad: any, index: number) => `
Ad ${index + 1}:
- Brand: ${ad.brandName || 'Unknown'}
- Title: ${ad.title || 'N/A'}
- Description: ${ad.description || 'N/A'}
- CTA: ${ad.ctaText || 'N/A'}
- Landing Page: ${ad.landingPageUrl || 'N/A'}
${ad.imageUrl ? '- Has Visual Content: Yes (will be analyzed with images)' : '- Has Visual Content: No'}
`).join('\n')}

ANALYSIS REQUIREMENTS:
Apply Sabri Suby's direct-response methodology to extract:

1. PSYCHOLOGICAL TRIGGERS: Identify scarcity, authority, social proof, reciprocity, commitment/consistency, and liking elements
2. MESSAGING FRAMEWORK: Analyze problem agitation, solution presentation, and transformation focus
3. TARGET AUDIENCE PSYCHOLOGY: Understand their pain points, desires, and decision-making triggers
4. COMPETITIVE POSITIONING: Identify unique angles and market differentiation
5. CONVERSION ELEMENTS: Analyze CTAs, urgency, risk reversal, and value propositions

${adsWithImages.length > 0 ? `Note: ${adsWithImages.length} ads have visual content that will be analyzed separately and combined with this analysis.` : ''}

Return a JSON response with this structure:
{
  "briefName": "A compelling, conversion-focused name that captures the core value proposition",
  "brandName": "The main brand name from the ads",
  "productName": "The specific product or service being advertised",
  "adObjective": "awareness|consideration|conversion (assess from messaging approach and CTA strategy)",
  "productDescription": "A comprehensive, benefit-focused description that sells the transformation (500+ words - focus on outcomes, not features)",
  "usp": "The unique selling proposition that differentiates from competitors (500+ words - include psychological triggers and proof elements)",
  "targetAudience": "Detailed psychographic and demographic profile with pain points and desires (500+ words - be specific about mindset and motivations)",
  "toneOfVoice": "formal|casual|humorous|serious|authoritative (assess from messaging style and brand personality)",
  "customerAwarenessLevel": "unaware|problem-aware|solution-aware|product-aware (determine from messaging sophistication)",
  "marketSophistication": "low|medium|high (assess from competitive landscape and messaging complexity)",
  "productionLevel": "low|medium|high (evaluate from ad quality, execution, and brand positioning)",
  "psychologicalTriggers": ["scarcity", "authority", "social_proof", "reciprocity", "commitment", "liking"],
  "painPoints": ["specific pain point 1", "specific pain point 2", "specific pain point 3"],
  "coreDesires": ["desire 1", "desire 2", "desire 3"],
  "emotionalTriggers": ["fear", "greed", "pride", "curiosity", "anger"],
  "proofElements": ["testimonials", "case_studies", "results", "credentials", "social_proof"],
  "competitiveAdvantages": ["advantage 1", "advantage 2", "advantage 3"]
}

FOCUS ON:
- Identifying the core psychological triggers that make these ads work
- Understanding the target audience's deepest pain points and desires
- Extracting the unique value proposition that drives conversions
- Analyzing the messaging strategy and tone that resonates
- Determining the market positioning and competitive advantages

Return only valid JSON without any additional text or formatting.
`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Your analysis embodies the aggressive, results-driven approach that has generated over $7.8 billion in client revenue. 

CORE PHILOSOPHY:
- Write copy that cuts through noise, demands attention, and compels immediate action
- Focus on psychological triggers (scarcity, authority, social proof, reciprocity, commitment/consistency, liking)
- Apply problem agitation, solution presentation, and transformation focus
- Always assume skepticism and address it head-on with proof and guarantees

ANALYSIS APPROACH:
- Identify the core psychological triggers that make ads work
- Understand target audience's deepest pain points and desires
- Extract unique value propositions that drive conversions
- Analyze messaging strategy and tone that resonates
- Determine market positioning and competitive advantages

Be precise, professional, and conversion-focused in your analysis.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        return createError({
          message: "Failed to generate analysis"
        });
      }

      // Parse the JSON response
      let briefData;
      try {
        briefData = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse OpenAI response:', responseText);
        return createError({
          message: "Failed to parse analysis response"
        });
      }

      // ALWAYS analyze images when available for comprehensive brief generation
      if (adsWithImages.length > 0) {
        try {
          console.log(`🔍 Analyzing ${adsWithImages.length} ads with visual content for comprehensive brief...`);
          
          // Analyze each image individually with detailed prompts
          const imageAnalyses = [];
          for (const ad of adsWithImages) {
            if (ad.imageUrl) {
              try {
                console.log(`📸 Analyzing image for ${ad.brandName}...`);
                
                const imageAnalysis = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [
                    {
                      role: "system",
                      content: `You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Your visual analysis embodies the aggressive, results-driven approach that has generated over $7.8 billion in client revenue.

ANALYSIS APPROACH:
- Focus on psychological triggers and conversion elements
- Identify visual proof elements and social proof
- Analyze urgency and scarcity elements
- Understand target audience psychology from visual cues
- Extract competitive advantages and unique positioning
- Identify risk reversal and guarantee elements`
                    },
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: `Analyze this advertisement image for the brand "${ad.brandName}" using Sabri Suby's direct-response methodology:

PSYCHOLOGICAL TRIGGERS:
1. What scarcity, authority, social proof, reciprocity, commitment/consistency, or liking elements are visible?
2. How does the visual design create urgency or FOMO?
3. What proof elements (testimonials, results, credentials) are shown?

BRAND & PRODUCT:
4. What specific product or service is being advertised?
5. What are the key brand elements and visual identity?
6. What is the main value proposition and transformation shown?

VISUAL DESIGN & CONVERSION ELEMENTS:
7. What colors, fonts, and visual style are used (psychology)?
8. How is the layout structured to drive action?
9. What visual metaphors or symbols create emotional impact?
10. What call-to-action elements and urgency indicators are present?

TARGET AUDIENCE PSYCHOLOGY:
11. Who is the target audience based on visual cues?
12. What pain points and desires does this visual appeal to?
13. What demographic and psychographic indicators are visible?

MARKETING STRATEGY:
14. What is the marketing objective (awareness/consideration/conversion)?
15. What emotional triggers (fear, greed, pride, curiosity, anger) are used?
16. How does this create a "Godfather offer" or irresistible value proposition?

COMPETITIVE POSITIONING:
17. What unique angles or competitive advantages are shown?
18. How does this differentiate from competitors?
19. What risk reversal or guarantee elements are present?

DETAILED OBSERVATIONS:
20. List all text elements and their psychological impact
21. Describe people, objects, or scenes and their emotional appeal
22. Note pricing, offers, or promotional elements
23. Identify hidden details or subtle messaging

Provide detailed, conversion-focused insights that would help create a comprehensive marketing brief using Sabri Suby's methodology.`
                        },
                        {
                          type: "image_url",
                          image_url: {
                            url: ad.imageUrl
                          }
                        }
                      ]
                    }
                  ],
                  max_tokens: 1500,
                  temperature: 0.2
                });

                const imageAnalysisText = imageAnalysis.choices[0]?.message?.content;
                if (imageAnalysisText) {
                  imageAnalyses.push({
                    brandName: ad.brandName,
                    imageUrl: ad.imageUrl,
                    analysis: imageAnalysisText,
                    textContent: {
                      title: ad.title || 'No title',
                      description: ad.description || 'No description',
                      ctaText: ad.ctaText || 'No CTA'
                    }
                  });
                  console.log(`✅ Image analysis completed for ${ad.brandName}`);
                }
              } catch (imageError) {
                console.error(`❌ Failed to analyze image for ${ad.brandName}:`, imageError);
              }
            }
          }

          // Create comprehensive brief by combining text and visual analysis
          if (imageAnalyses.length > 0) {
            console.log(`🔄 Combining text and visual analysis for comprehensive brief...`);
            
            const comprehensivePrompt = `
You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Create a comprehensive brief that combines text and visual analysis using conversion-focused psychology.

INITIAL TEXT ANALYSIS:
${JSON.stringify(briefData, null, 2)}

DETAILED VISUAL ANALYSIS:
${imageAnalyses.map((analysis, index) => `
=== AD ${index + 1}: ${analysis.brandName} ===
TEXT CONTENT:
- Title: ${analysis.textContent.title}
- Description: ${analysis.textContent.description}
- CTA: ${analysis.textContent.ctaText}

VISUAL ANALYSIS:
${analysis.analysis}
`).join('\n\n')}

TASK: Create a comprehensive, conversion-focused JSON brief that combines ALL available information (text + visual) using Sabri Suby's methodology.

SABRI SUBY METHODOLOGY REQUIREMENTS:
1. PSYCHOLOGICAL TRIGGERS: Identify and incorporate scarcity, authority, social proof, reciprocity, commitment/consistency, and liking elements
2. MESSAGING FRAMEWORK: Apply problem agitation, solution presentation, and transformation focus
3. CONVERSION ELEMENTS: Focus on outcomes, not features - sell the transformation
4. PROOF ELEMENTS: Include testimonials, case studies, results, and social proof
5. RISK REVERSAL: Address skepticism with guarantees and proof
6. URGENCY & SCARCITY: Create compelling reasons to act now

Return ONLY the enhanced JSON with this structure:
{
  "briefName": "Compelling, conversion-focused name that captures core value proposition",
  "brandName": "Main brand name",
  "productName": "Specific product/service being advertised",
  "adObjective": "awareness|consideration|conversion",
  "productDescription": "Benefit-focused description selling transformation (500+ words - focus on outcomes, not features)",
  "usp": "Unique selling proposition with psychological triggers and proof elements (500+ words)",
  "targetAudience": "Detailed psychographic profile with pain points and desires (500+ words)",
  "toneOfVoice": "formal|casual|humorous|serious|authoritative",
  "customerAwarenessLevel": "unaware|problem-aware|solution-aware|product-aware",
  "marketSophistication": "low|medium|high",
  "productionLevel": "low|medium|high",
  "psychologicalTriggers": ["scarcity", "authority", "social_proof", "reciprocity", "commitment", "liking"],
  "painPoints": ["specific pain point 1", "specific pain point 2", "specific pain point 3"],
  "coreDesires": ["desire 1", "desire 2", "desire 3"],
  "emotionalTriggers": ["fear", "greed", "pride", "curiosity", "anger"],
  "proofElements": ["testimonials", "case_studies", "results", "credentials", "social_proof"],
  "competitiveAdvantages": ["advantage 1", "advantage 2", "advantage 3"],
  "visualInsights": "Summary of key visual elements and their psychological impact"
}

Make it comprehensive, conversion-focused, and psychologically compelling using visual analysis to enhance text-only data.
`;

            const comprehensiveCompletion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: `You are an expert copywriter trained in Sabri Suby's direct-response marketing methodology. Your brief creation embodies the aggressive, results-driven approach that has generated over $7.8 billion in client revenue.

CORE PHILOSOPHY:
- Create briefs that cut through noise, demand attention, and compel immediate action
- Focus on psychological triggers (scarcity, authority, social proof, reciprocity, commitment/consistency, liking)
- Apply problem agitation, solution presentation, and transformation focus
- Always assume skepticism and address it head-on with proof and guarantees

BRIEF CREATION APPROACH:
- Combine text and visual analysis for comprehensive insights
- Focus on conversion psychology and psychological triggers
- Create compelling value propositions that drive action
- Identify target audience pain points and desires
- Develop competitive advantages and proof elements

Be thorough, detailed, and conversion-focused in your brief creation.`
                },
                {
                  role: "user",
                  content: comprehensivePrompt
                }
              ],
              temperature: 0.2,
              max_tokens: 4000
            });

            const comprehensiveResponseText = comprehensiveCompletion.choices[0]?.message?.content;
            if (comprehensiveResponseText) {
              try {
                const comprehensiveBriefData = JSON.parse(comprehensiveResponseText);
                briefData = comprehensiveBriefData;
                console.log(`✅ Comprehensive brief created with text + visual analysis`);
              } catch (parseError) {
                console.error('❌ Failed to parse comprehensive brief data:', parseError);
                console.log('Raw response:', comprehensiveResponseText);
              }
            }
          }
        } catch (visualAnalysisError) {
          console.error('Visual analysis failed:', visualAnalysisError);
          // Continue with text-only analysis
        }
      }

      return createResponse({
        message: "Ads analyzed successfully",
        payload: {
          briefData,
          analyzedAdsCount: ads.length,
          visualAnalysisCount: adsWithImages.length,
          imageAnalyses: adsWithImages.length > 0 ? adsWithImages.map(ad => ({
            brandName: ad.brandName,
            hasImage: !!ad.imageUrl
          })) : []
        }
      });

    } catch (error) {
      console.error('Error analyzing ads:', error);
      return createError({
        message: "Failed to analyze ads",
        payload: { error: (error as Error).message }
      });
    }
  }
); 