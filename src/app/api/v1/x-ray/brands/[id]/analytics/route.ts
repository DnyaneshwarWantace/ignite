import messages from "@apiUtils/messages";
import { createError, createResponse } from "@apiUtils/responseutils";
import { authMiddleware } from "@middleware";
import { User } from "@prisma/client";
import prisma from "@prisma/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');
  }
}

// Helper function to extract landing page URL from ad
function getLandingPageUrl(ad: any): string | null {
  try {
    const content = JSON.parse(ad.content || '{}');
    const snapshot = content.snapshot || {};
    
    // Extract landing page URL from ad content
    const url = snapshot.link_url || 
               content.link_url || 
               snapshot.url ||
               content.url ||
               snapshot.website_url ||
               content.website_url;
               
    // Check cards for carousel ads
    if (!url && snapshot.cards && snapshot.cards.length > 0) {
      const cardUrl = snapshot.cards[0].link_url;
      if (cardUrl) return cardUrl;
    }
               
    if (url) {
      // Ensure URL has protocol
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      } else {
        return `https://${url}`;
      }
    }
  } catch (e) {
    // Skip ads with invalid content
  }
  
  return null;
}

// Helper function to extract hooks from text
function extractHooks(text: string): string[] {
  const hooks: string[] = [];
  
  // Split by common sentence endings and clean
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 150); // Good hook length
  
  sentences.forEach(sentence => {
    const cleanedHook = cleanHookText(sentence);
    if (cleanedHook && cleanedHook.length >= 10) {
      hooks.push(cleanedHook);
    }
  });
  
  return hooks;
}

// Helper function to extract landing pages from ads
function extractLandingPages(ads: any[]) {
  const landingPageMap = new Map<string, number>();
  let processedAds = 0;
  let adsWithUrls = 0;
  
  ads.forEach((ad: any) => {
    processedAds++;
    const url = getLandingPageUrl(ad);
    if (url) {
        adsWithUrls++;
      const domain = extractDomain(url);
      landingPageMap.set(domain, (landingPageMap.get(domain) || 0) + 1);
        }
  });
  
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
    .replace(/\{\{[^}]+\}\}/g, "") // Remove all template variables
    .replace(/\s+/g, ' ');
  
  cleanText = cleanText.trim();
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
  const hookMap = new Map<string, number>();
  let processedAds = 0;
  let adsWithHooks = 0;
  let totalHooksFound = 0;
  
  ads.forEach((ad: any) => {
    processedAds++;
    try {
      const content = JSON.parse(ad.content || '{}');
      const snapshot = content.snapshot || {};
      
      // Get all possible text sources
      const textSources = [
        snapshot.link_description,
        snapshot.title,
        snapshot.caption,
        content.headline,
        ad.headline,
        ad.text,
        snapshot.body?.text,
        content.text,
        snapshot.message,
        content.message,
        snapshot.description,
        content.description
      ].filter(Boolean);
      
      // Also check cards for carousel ads
      if (snapshot.cards && snapshot.cards.length > 0) {
        snapshot.cards.forEach((card: any) => {
          if (card) {
            const cardTexts = [
              card.body,
              card.text,
              card.title,
              card.description,
              card.message,
              card.link_description
            ].filter(Boolean);
            textSources.push(...cardTexts);
          }
        });
      }
      
      // Process each text source
      textSources.forEach(text => {
        if (text) {
          const hooks = extractHooks(text);
          if (hooks.length > 0) {
            adsWithHooks++;
            totalHooksFound += hooks.length;
            hooks.forEach(hook => {
              hookMap.set(hook, (hookMap.get(hook) || 0) + 1);
            });
          }
        }
      });
    } catch (e) {
      // Skip ads with invalid content
    }
  });
  
  // Convert to array and sort by usage count
  return Array.from(hookMap.entries())
    .map(([hook, count]) => ({ hook, count }))
    .sort((a, b) => b.count - a.count); // Return all hooks, not just top 100
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