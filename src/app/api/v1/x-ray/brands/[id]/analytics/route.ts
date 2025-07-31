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

// Helper function to extract one hook per ad (1:1 mapping)
function extractTopHooks(ads: any[]) {
  const hooks: Array<{ hook: string; count: number; adId: string; createdAt: Date; platform: string; imageUrl: string | null; adType: string }> = [];
  let processedAds = 0;
  let adsWithHooks = 0;
  
  ads.forEach((ad: any) => {
    processedAds++;
    try {
      const content = JSON.parse(ad.content || '{}');
      const snapshot = content.snapshot || {};
      
      // Get the best hook from this ad (priority order)
      const textSources = [
        snapshot.title,           // Highest priority - main title
        snapshot.link_description, // Second priority - description
        snapshot.caption,         // Third priority - caption
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
      
      // For carousel ads, also check first card
      if (snapshot.cards && snapshot.cards.length > 0 && snapshot.cards[0]) {
        const firstCard = snapshot.cards[0];
        const cardTexts = [
          firstCard.title,
          firstCard.body,
          firstCard.text,
          firstCard.description,
          firstCard.message,
          firstCard.link_description
        ].filter(Boolean);
        textSources.unshift(...cardTexts); // Add to beginning for priority
      }
      
      // Get the first good hook from this ad
      let bestHook = null;
      for (const text of textSources) {
        if (text && text.trim().length >= 10 && text.trim().length <= 200) {
          bestHook = cleanHookText(text.trim());
          if (bestHook && bestHook.length >= 10) {
            break; // Use first good hook found
          }
        }
      }
      
      if (bestHook) {
        adsWithHooks++;
        
        // Extract ad details
        const platform = getPlatformFromAd(ad, content, snapshot);
        const imageUrl = getImageFromAd(ad, content, snapshot);
        const adType = getAdTypeFromContent(content, snapshot);
        
        // Get actual ad start date from content (not database creation date)
        let actualStartDate = new Date(ad.createdAt); // fallback to db date
        try {
          const startDate = snapshot.start_date || snapshot.start_date_string || 
                           content.start_date || content.start_date_string ||
                           snapshot.created_time || content.created_time;
          
          if (startDate) {
            // Handle Unix timestamp (in seconds) or date string
            if (typeof startDate === 'number') {
              actualStartDate = new Date(startDate * 1000);
            } else {
              actualStartDate = new Date(startDate);
            }
            
            // Validate the date is reasonable (after 2020 and not in future)
            const minDate = new Date('2020-01-01').getTime();
            const now = new Date().getTime();
            
            if (actualStartDate.getTime() < minDate || actualStartDate.getTime() > now) {
              actualStartDate = new Date(ad.createdAt); // fallback to db date
            }
          }
        } catch (e) {
          // Use database creation date as fallback
          actualStartDate = new Date(ad.createdAt);
        }

        // Get ad active status from content
        let isActive = true; // default to active
        try {
          if (content.is_active === false) {
            isActive = false;
          } else if (content.is_active === true) {
            isActive = true;
          } else {
            // Check end date if is_active is not explicitly set
            const hasEndDate = content.end_date || snapshot.end_date;
            if (hasEndDate) {
              const endDate = new Date(hasEndDate);
              isActive = endDate > new Date();
            }
          }
        } catch (e) {
          isActive = true; // default to active if can't determine
        }

        hooks.push({
          hook: bestHook,
          count: 1, // Each ad contributes 1 to count
          adId: ad.id,
          createdAt: actualStartDate, // Use actual ad start date
          platform: platform,
          imageUrl: imageUrl,
          adType: adType,
          isActive: isActive, // Add active status
          adData: ad // Include full ad data for modal
        });
      }
    } catch (e) {
      // Skip ads with invalid content
      console.error('Error processing ad:', ad.id, e);
    }
  });
  
  console.log(`Processed ${processedAds} ads, found hooks in ${adsWithHooks} ads`);
  
  // Sort by creation date (oldest first) - longest running ads first
  return hooks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// Helper function to get platform from ad
function getPlatformFromAd(ad: any, content: any, snapshot: any): string {
  // Check for platform indicators in the content
  if (snapshot.platform) return snapshot.platform.toUpperCase();
  if (content.platform) return content.platform.toUpperCase();
  if (ad.platform) return ad.platform.toUpperCase();
  
  // Check for Instagram-specific indicators
  if (snapshot.instagram_actor_id || content.instagram_actor_id) return 'INSTAGRAM';
  if (snapshot.source && snapshot.source.toLowerCase().includes('instagram')) return 'INSTAGRAM';
  
  // Default to Facebook if no clear indicator
  return 'FACEBOOK';
}

// Helper function to get image from ad
function getImageFromAd(ad: any, content: any, snapshot: any): string | null {
  // Priority order for images
  const imageSources = [
    ad.localImageUrl,           // Cloudinary URL (highest priority)
    ad.imageUrl,               // Original image URL
    snapshot.images?.[0]?.original_image_url,
    snapshot.images?.[0]?.resized_image_url,
    snapshot.cards?.[0]?.original_image_url,
    snapshot.cards?.[0]?.resized_image_url,
    content.imageUrl,
    content.image_url
  ];
  
  for (const imageUrl of imageSources) {
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      return imageUrl.trim();
    }
  }
  
  return null;
}

// Helper function to get ad type from content
function getAdTypeFromContent(content: any, snapshot: any): string {
  const videos = snapshot.videos || [];
  const images = snapshot.images || [];
  const cards = snapshot.cards || [];
  
  if (videos.length > 0) return 'video';
  if (cards.length > 1) return 'carousel';
  if (images.length > 1) return 'carousel';
  if (images.length === 1) return 'image';
  
  return 'unknown';
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