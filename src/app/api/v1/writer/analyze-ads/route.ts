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

      // Prepare ads data for analysis with image URLs
      const adsData = ads.map((savedAd: any) => {
        const adData = JSON.parse(savedAd.adData || '{}');
        
        // Extract image URLs from the saved ad data
        let imageUrls: string[] = [];
        try {
          if (adData.content) {
            const content = JSON.parse(adData.content);
            const snapshot = content.snapshot || {};
            
            // Extract from images array (prefer Cloudinary URLs)
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
          }
        } catch (error) {
          console.log('Error extracting image URLs:', error);
        }
        
        // Prefer Cloudinary URLs for better analysis
        const cloudinaryUrls = imageUrls.filter(url => url.includes('res.cloudinary.com'));
        const bestImageUrl = cloudinaryUrls.length > 0 ? cloudinaryUrls[0] : imageUrls[0];
        
        return {
          brandName: adData.companyName,
          title: adData.title,
          description: adData.description,
          ctaText: adData.ctaText,
          landingPageUrl: adData.landingPageUrl,
          content: adData.content,
          imageUrl: bestImageUrl || null
        };
      });

      // Create comprehensive prompt that includes both text and image analysis
      const adsWithImages = adsData.filter(ad => ad.imageUrl);
      
      let prompt = `
Analyze the following ${ads.length} advertisement(s) and extract key information to create a comprehensive brief. 

Ads to analyze:
${adsData.map((ad: any, index: number) => `
Ad ${index + 1}:
- Brand: ${ad.brandName || 'Unknown'}
- Title: ${ad.title || 'N/A'}
- Description: ${ad.description || 'N/A'}
- CTA: ${ad.ctaText || 'N/A'}
- Landing Page: ${ad.landingPageUrl || 'N/A'}
${ad.imageUrl ? '- Has Visual Content: Yes (will be analyzed with images)' : '- Has Visual Content: No'}
`).join('\n')}

Based on the available text content and metadata of these ads, provide initial insights. 
${adsWithImages.length > 0 ? `Note: ${adsWithImages.length} ads have visual content that will be analyzed separately and combined with this analysis.` : ''}

Please provide a JSON response with the following structure:
{
  "briefName": "A creative name for this brief based on the brand/product",
  "brandName": "The main brand name from the ads",
  "productName": "The main product or service being advertised",
  "adObjective": "awareness|consideration|conversion (choose the most likely objective)",
  "productDescription": "A comprehensive description of the product/service based on available ad content (max 500 words)",
  "usp": "The unique selling proposition based on what makes these ads unique (max 500 words)",
  "targetAudience": "Detailed target audience description based on the ad messaging and style (max 500 words)",
  "toneOfVoice": "formal|casual|humorous|serious (choose the most common tone across the ads)",
  "customerAwarenessLevel": "unaware|problem-aware|solution-aware|product-aware (assess from messaging approach)",
  "marketSophistication": "low|medium|high (assess from competitive positioning and messaging complexity)",
  "productionLevel": "low|medium|high (assess from ad quality and execution)"
}

Focus on:
1. Identifying common patterns across the ads
2. Understanding the brand's messaging strategy
3. Determining the target audience from the ad content and style
4. Extracting the unique value proposition
5. Analyzing the tone and style of communication

Return only valid JSON without any additional text or formatting.
`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing analyst. Analyze the provided ads and return a JSON response with brief data. Be precise and professional."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
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
                  model: "gpt-4-vision-preview",
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert marketing and advertising analyst specializing in visual content analysis. Analyze this advertisement image comprehensively to extract all possible details about the brand, product, target audience, and marketing strategy."
                    },
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: `Analyze this advertisement image for the brand "${ad.brandName}" and provide comprehensive insights about:

BRAND & PRODUCT:
1. What specific product or service is being advertised?
2. What are the key brand elements and visual identity?
3. What is the main value proposition shown?

VISUAL DESIGN:
4. What colors, fonts, and visual style are used?
5. How is the layout structured and what does it communicate?
6. What visual metaphors or symbols are present?

TARGET AUDIENCE:
7. Who is the target audience based on visual cues?
8. What demographic indicators are visible?
9. What lifestyle or interests does this appeal to?

MARKETING STRATEGY:
10. What is the marketing objective (awareness/consideration/conversion)?
11. What emotional appeal is being used?
12. What call-to-action elements are present?

DETAILED OBSERVATIONS:
13. List all text elements visible in the image
14. Describe any people, objects, or scenes shown
15. Note any pricing, offers, or promotional elements
16. Identify any hidden details or subtle messaging

Provide detailed, specific insights that would help create a comprehensive marketing brief.`
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
                  max_tokens: 1200,
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
You are an expert marketing analyst creating a comprehensive brief. Combine the following information:

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

TASK: Create a comprehensive, enhanced JSON brief that combines ALL available information (text + visual) into a single, detailed brief. 

REQUIREMENTS:
1. Use visual insights to fill gaps where text is missing
2. Enhance product descriptions with visual details
3. Refine target audience based on visual cues
4. Add visual design insights to USP
5. Update tone based on visual style
6. Determine customer awareness level from messaging approach
7. Assess market sophistication from competitive positioning
8. Evaluate production level from visual quality and execution
9. Ensure all fields are comprehensive and detailed

Return ONLY the enhanced JSON with this structure:
{
  "briefName": "Creative name based on brand/product",
  "brandName": "Main brand name",
  "productName": "Specific product/service being advertised",
  "adObjective": "awareness|consideration|conversion",
  "productDescription": "Comprehensive description (500+ words) including visual details",
  "usp": "Unique selling proposition with visual insights (500+ words)",
  "targetAudience": "Detailed audience description with visual indicators (500+ words)",
  "toneOfVoice": "formal|casual|humorous|serious",
  "customerAwarenessLevel": "unaware|problem-aware|solution-aware|product-aware",
  "marketSophistication": "low|medium|high",
  "productionLevel": "low|medium|high",
  "visualInsights": "Summary of key visual elements and their impact"
}

Make it comprehensive and detailed, using visual analysis to fill any gaps in text-only data.
`;

            const comprehensiveCompletion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: "You are an expert marketing analyst specializing in creating comprehensive briefs that combine text and visual analysis. Be thorough and detailed."
                },
                {
                  role: "user",
                  content: comprehensivePrompt
                }
              ],
              temperature: 0.2,
              max_tokens: 3000
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