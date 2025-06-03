import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper function to extract landing pages from ads
function extractLandingPages(ads: any[]) {
  const landingPageMap = new Map();
  let processedAds = 0;
  let adsWithUrls = 0;
  
  ads.forEach((ad: any) => {
    processedAds++;
    try {
      const content = JSON.parse(ad.content);
      const snapshot = content.snapshot || {};
      
      // Extract landing page URL
      let landingUrl = snapshot.link_url || content.link_url || content.url;
      
      if (landingUrl) {
        adsWithUrls++;
        // Clean and normalize URL
        landingUrl = landingUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        if (landingPageMap.has(landingUrl)) {
          landingPageMap.set(landingUrl, landingPageMap.get(landingUrl) + 1);
        } else {
          landingPageMap.set(landingUrl, 1);
        }
      }
    } catch (e) {
      // Skip ads with invalid content
      console.error('Error parsing ad content for landing pages:', e);
    }
  });
  
  console.log(`Landing Pages Debug: Processed ${processedAds} ads, ${adsWithUrls} had URLs, found ${landingPageMap.size} unique URLs`);
  
  // Convert to array and sort by usage count
  return Array.from(landingPageMap.entries())
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // Increased from 10 to 50 landing pages
}

// Helper function to clean template variables from text
function cleanTemplateVariables(text: string, fallback: string = ""): string {
  if (!text) return fallback;
  
  let cleanText = text
    .replace(/\{\{product\.brand\}\}/gi, "Amazing Brand")
    .replace(/\{\{product\.name\}\}/gi, "Premium Product")
    .replace(/\{\{brand\.name\}\}/gi, "Top Brand")
    .replace(/\{\{company\.name\}\}/gi, "Leading Company")
    .replace(/\{\{product\.price\}\}/gi, "$99")
    .replace(/\{\{discount\}\}/gi, "50% OFF")
    .replace(/\{\{offer\}\}/gi, "Special Offer")
    .replace(/\{\{[^}]+\}\}/g, ""); // Remove any remaining template variables
  
  cleanText = cleanText.trim().replace(/\s+/g, ' ');
  return cleanText || fallback;
}

// Helper function specifically for cleaning hook text
function cleanHookText(text: string): string {
  if (!text) return "";
  
  let cleanText = text.trim();
  
  // Remove URLs and domain-like patterns
  cleanText = cleanText.replace(/https?:\/\/[^\s]+/gi, ''); // Remove full URLs
  cleanText = cleanText.replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*/gi, ''); // Remove domain patterns
  cleanText = cleanText.replace(/ad\.doubleclick\.net/gi, ''); // Remove specific ad domains
  cleanText = cleanText.replace(/fb\.me/gi, ''); // Remove fb.me
  cleanText = cleanText.replace(/galaxy-creators\.jebi\.io/gi, ''); // Remove specific domains
  
  // Clean template variables
  cleanText = cleanText
    .replace(/\{\{[^}]+\}\}/g, '') // Remove template variables
    .replace(/_[a-zA-Z]+/g, '') // Remove underscore prefixed words like _forthehome
    .replace(/\b[A-Z]{2,}\.[A-Z]{2,}\.[A-Z]{2,}\b/gi, '') // Remove ALL_CAPS.DOMAIN.PATTERNS
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // If the text is too short or looks like a URL/domain, return empty
  if (cleanText.length < 5 || 
      cleanText.match(/^[A-Z\-\.]+$/i) || // All caps with dots/dashes
      cleanText.includes('.') && cleanText.split(' ').length === 1) { // Single word with dots
    return "";
  }
  
  return cleanText;
}

// Helper function to extract hooks/headlines from ads
function extractTopHooks(ads: any[]) {
  const hookMap = new Map();
  let processedAds = 0;
  let adsWithHooks = 0;
  let totalHooksFound = 0;
  
  ads.forEach((ad: any) => {
    processedAds++;
    try {
      const content = JSON.parse(ad.content);
      const snapshot = content.snapshot || {};
      
      // Extract hooks from various fields - prioritize link_description as it contains the actual hook
      const hooks = [
        snapshot.link_description, // Primary hook source - this is where the actual hook text is
        snapshot.title,
        snapshot.caption,
        content.headline,
        ad.headline,
        ad.text,
        snapshot.body?.text
      ].filter(Boolean);
      
      if (hooks.length > 0) {
        adsWithHooks++;
        totalHooksFound += hooks.length;
      }
      
      hooks.forEach((hook: string) => {
        if (hook && hook.length > 3 && hook.length < 300) { // Reduced min length and increased max length
          // Clean hook text specifically for marketing content
          const cleanedHook = cleanHookText(hook);
          
          // Skip if the cleaned hook is empty or too short
          if (cleanedHook.length < 5) return;
          
          const finalHook = cleanedHook.substring(0, 200); // Increased length limit for better hooks
          
          if (hookMap.has(finalHook)) {
            hookMap.set(finalHook, hookMap.get(finalHook) + 1);
          } else {
            hookMap.set(finalHook, 1);
          }
        }
      });
    } catch (e) {
      // Skip ads with invalid content
      console.error('Error parsing ad content for hooks:', e);
    }
  });
  
  console.log(`Hooks Debug: Processed ${processedAds} ads, ${adsWithHooks} had hooks, found ${totalHooksFound} total hooks, ${hookMap.size} unique hooks`);
  
  // Convert to array and sort by usage count
  return Array.from(hookMap.entries())
    .map(([hook, count]) => ({ hook, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100); // Increased from 15 to 100 hooks for much better variety
}

// Helper function to analyze ad content for special features
function analyzeAdFeatures(ads: any[]) {
  let discountAds = 0;
  let testimonialAds = 0;
  let freeShippingAds = 0;
  
  const discountKeywords = ['discount', 'sale', 'off', '%', 'save', 'deal', 'promo', 'coupon'];
  const testimonialKeywords = ['review', 'testimonial', 'customer', 'says', 'love', 'recommend', 'rating', 'stars'];
  const freeShippingKeywords = ['free shipping', 'free delivery', 'no shipping cost', 'shipping free'];
  
  ads.forEach((ad: any) => {
    try {
      const content = JSON.parse(ad.content);
      const snapshot = content.snapshot || {};
      
      // Combine all text content and clean template variables
      const allText = [
        snapshot.title,
        snapshot.caption,
        snapshot.body?.text,
        snapshot.link_description,
        ad.text,
        ad.headline,
        ad.description
      ].filter(Boolean)
       .map(text => cleanTemplateVariables(text, ""))
       .join(' ')
       .toLowerCase();
      
      // Check for discount indicators
      if (discountKeywords.some(keyword => allText.includes(keyword))) {
        discountAds++;
      }
      
      // Check for testimonial indicators
      if (testimonialKeywords.some(keyword => allText.includes(keyword))) {
        testimonialAds++;
      }
      
      // Check for free shipping indicators
      if (freeShippingKeywords.some(keyword => allText.includes(keyword))) {
        freeShippingAds++;
      }
    } catch (e) {
      // Skip ads with invalid content
    }
  });
  
  return {
    discountAds,
    testimonialAds,
    freeShippingAds
  };
}

// Helper function to create timeline data
function createTimeline(ads: any[]) {
  const timelineMap = new Map();
  
  ads.forEach((ad: any) => {
    try {
      const content = JSON.parse(ad.content);
      
      // Extract start date
      let startDate = content.start_date || content.start_date_string;
      
      if (startDate) {
        // Parse date and group by month
        const date = new Date(startDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (timelineMap.has(monthKey)) {
          timelineMap.set(monthKey, timelineMap.get(monthKey) + 1);
        } else {
          timelineMap.set(monthKey, 1);
        }
      }
    } catch (e) {
      // Skip ads with invalid content
    }
  });
  
  // Convert to array and sort by date
  return Array.from(timelineMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
}

export const GET = authMiddleware(
  async (request: NextRequest, context: { params: { id: string } }, user: User) => {
    const brandId = context.params.id;

    // Fetch brand with all ads
    const brand = await prisma.brand.findUnique({
      where: {
        id: brandId,
      },
      include: {
        ads: true,
      },
    });

    if (!brand) {
      return createError({
        message: "Brand not found",
      });
    }

    const ads = brand.ads || [];
    
    console.log(`Analytics Debug: Brand ${brandId} has ${ads.length} ads in database`);
    
    // Log first few ads to see their structure
    if (ads.length > 0) {
      console.log('Sample ad structure:', {
        id: ads[0].id,
        type: ads[0].type,
        hasContent: !!ads[0].content,
        contentLength: ads[0].content?.length || 0,
        contentPreview: ads[0].content?.substring(0, 100) + '...'
      });
    }
    
    // Calculate basic statistics
    const videoAds = ads.filter((ad: any) => ad.type === 'video').length;
    const imageAds = ads.filter((ad: any) => ad.type === 'image').length;
    const carouselAds = ads.filter((ad: any) => ad.type === 'carousel').length;
    
    let activeAds = 0;
    let inactiveAds = 0;
    
    ads.forEach((ad: any) => {
      try {
        const content = JSON.parse(ad.content);
        // Check if ad is active based on ScrapeCreators API format
        // Try multiple possible field names for active status
        const isActive = content.is_active ?? content.active ?? content.status === 'active' ?? 
                       content.ad_delivery_status === 'active' ?? content.delivery_status === 'active';
        
        if (isActive === true) {
          activeAds++;
        } else if (isActive === false) {
          inactiveAds++;
        } else {
          // Check if ad has end_date to determine if it's inactive
          const endDate = content.end_date || content.end_date_string;
          const startDate = content.start_date || content.start_date_string;
          
          if (endDate) {
            const endDateTime = new Date(endDate).getTime();
            const now = Date.now();
            if (endDateTime < now) {
              inactiveAds++;
            } else {
              activeAds++;
            }
          } else if (startDate) {
            // If no end date but has start date, consider it active if recent
            const startDateTime = new Date(startDate).getTime();
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (startDateTime > thirtyDaysAgo) {
              activeAds++;
            } else {
              inactiveAds++;
            }
          } else {
            // If no date info, assume active for recently scraped ads
            activeAds++;
          }
        }
      } catch (e) {
        activeAds++;
      }
    });

    // Extract detailed analytics
    const landingPages = extractLandingPages(ads);
    const topHooks = extractTopHooks(ads);
    const adFeatures = analyzeAdFeatures(ads);
    const timeline = createTimeline(ads);

    console.log(`Analytics Results: ${landingPages.length} landing pages, ${topHooks.length} hooks, ${timeline.length} timeline entries`);

    const analytics = {
      // Basic stats
      totalAds: ads.length,
      activeAds,
      inactiveAds,
      videoAds,
      imageAds,
      carouselAds,
      
      // Detailed analytics
      landingPages,
      topHooks,
      adFeatures,
      timeline,
      
      // Additional insights
      avgAdsPerMonth: timeline.length > 0 ? Math.round(ads.length / timeline.length) : 0,
      mostUsedAdType: videoAds > imageAds && videoAds > carouselAds ? 'video' : 
                     imageAds > carouselAds ? 'image' : 'carousel'
    };

    return createResponse({
      message: messages.SUCCESS,
      payload: { 
        brand: {
          id: brand.id,
          name: brand.name,
          logo: brand.logo,
          pageId: brand.pageId
        },
        analytics 
      },
    });
  }
); 