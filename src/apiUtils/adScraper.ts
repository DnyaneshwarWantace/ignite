import axios from 'axios';

const SCRAPE_CREATORS_API_KEY = process.env.SCRAPE_CREATORS_API_KEY || process.env.NEXT_PUBLIC_SCRAPE_CREATORS_API_KEY;
const SCRAPE_CREATORS_BASE_URL = 'https://api.scrapecreators.com/v1/facebook/adLibrary';

interface ScrapedAd {
  id: string;
  type: 'video' | 'image' | 'carousel';
  content: any;
  imageUrl?: string;
  videoUrl?: string;
  text?: string;
  headline?: string;
  description?: string;
  created_time: string;
}

export async function scrapeCompanyAds(pageId: string, limit: number = 200, offset: number = 0, apiKey?: string): Promise<ScrapedAd[]> {
  try {
    const key = apiKey || SCRAPE_CREATORS_API_KEY;
    if (!key) {
      throw new Error('ScrapeCreators API key not found. Add it in Settings or set SCRAPE_CREATORS_API_KEY env.');
    }

    console.log(`Calling ScrapeCreators API for pageId: ${pageId} with limit: ${limit}, offset: ${offset}`);
    
    let allAds: any[] = [];
    let cursor: string | null = null;
    let totalFetched = 0;
    let skippedAds = 0;
    let hasMore = true;
    
    // If we have an offset, we need to skip ads until we reach the offset
    const shouldSkipAds = offset > 0;
    
    const pageSize = 50;
    while (hasMore && totalFetched < limit && allAds.length < 100 * 30) {
      const params = new URLSearchParams({ pageId, limit: String(pageSize) });
      if (cursor) params.set('cursor', cursor);
      const url = `${SCRAPE_CREATORS_BASE_URL}/company/ads?${params.toString()}`;

      console.log(`Fetching batch ${Math.floor((totalFetched + skippedAds) / pageSize) + 1}, URL: ${url.substring(0, 120)}...`);
      
      const response: any = await axios.get(url, {
        headers: {
          'x-api-key': key!
        }
      });

      console.log('ScrapeCreators API response status:', response.status);
      
      let adsData: any = response.data;
      let batchAds: any[] = [];

      // Handle ScrapeCreators API response format
      if (adsData && typeof adsData === 'object') {
        // ScrapeCreators API returns { results: [...], searchResultsCount: number, cursor: string }
        if (adsData.results && Array.isArray(adsData.results)) {
          batchAds = adsData.results;
          cursor = adsData.cursor || null;
          console.log(`Batch returned ${batchAds.length} ads. Total available: ${adsData.searchResultsCount}. Next cursor: ${cursor}`);
        }
        // Fallback for other possible formats
        else if (adsData.data && Array.isArray(adsData.data)) {
          batchAds = adsData.data;
          cursor = adsData.cursor || null;
        }
        else if (adsData.ads && Array.isArray(adsData.ads)) {
          batchAds = adsData.ads;
        }
        // If the response itself is not an array, wrap it
        else if (!Array.isArray(adsData)) {
          console.log('Response is not an array, wrapping in array');
          batchAds = [adsData];
        }
      }

      // Handle offset by skipping ads
      if (shouldSkipAds && skippedAds < offset) {
        const adsToSkip = Math.min(batchAds.length, offset - skippedAds);
        batchAds = batchAds.slice(adsToSkip);
        skippedAds += adsToSkip;
        console.log(`Skipped ${adsToSkip} ads. Total skipped: ${skippedAds}/${offset}`);
      }

      // Add batch to all ads (only if we've skipped enough)
      if (skippedAds >= offset) {
        allAds = allAds.concat(batchAds);
        totalFetched += batchAds.length;
      }
      
      // Check if we should continue
      hasMore = Boolean(cursor) && batchAds.length > 0 && totalFetched < limit;
      
      console.log(`Total ads fetched so far: ${totalFetched}, skipped: ${skippedAds}`);
      
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Final total: ${allAds.length} ads fetched (after skipping ${skippedAds})`);

    // Transform the API response to our format
    return allAds.slice(0, limit).map((ad: any, index: number) => {
      // Extract data from ScrapeCreators API format
      const snapshot = ad.snapshot || {};
      const body = snapshot.body || {};
      
      return {
        id: ad.ad_archive_id || ad.id || `ad_${pageId}_${index}`,
        type: determineAdType(ad),
        content: JSON.stringify(ad),
        imageUrl: extractImageUrl(ad),
        videoUrl: extractVideoUrl(ad),
        text: body.text || snapshot.caption || '',
        headline: snapshot.title || '',
        description: snapshot.link_description || '',
        created_time: ad.created_time || ''
      };
    });
  } catch (error: any) {
    console.error('Error scraping ads:', error);
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    }
    throw new Error('Failed to scrape ads from ScrapeCreators API');
  }
}

export async function scrapeIndividualAd(libraryId: string, apiKey?: string): Promise<ScrapedAd | null> {
  try {
    const key = apiKey || SCRAPE_CREATORS_API_KEY;
    if (!key) {
      throw new Error('ScrapeCreators API key not found. Add it in Settings or set SCRAPE_CREATORS_API_KEY env.');
    }

    const { data } = await axios.get(
      `${SCRAPE_CREATORS_BASE_URL}/ad`,
      {
        params: {
          id: libraryId
        },
        headers: {
          'x-api-key': key
        }
      }
    );

    return {
      id: data.id || data.library_id || data.ad_id,
      type: determineAdType(data),
      content: JSON.stringify(data),
      imageUrl: extractImageUrl(data),
      videoUrl: extractVideoUrl(data),
      text: data.ad_creative_body || data.text || '',
      headline: data.ad_creative_link_title || data.headline || '',
      description: data.ad_creative_link_description || data.description || '',
      created_time: data.created_time || ''
    };
  } catch (error) {
    console.error('Error scraping individual ad:', error);
    return null;
  }
}

/**
 * Alias for scrapeIndividualAd - used by auto-tracker
 * Gets a single ad by its library ID to check status
 */
export async function getAdById(libraryId: string, apiKey?: string): Promise<ScrapedAd | null> {
  return scrapeIndividualAd(libraryId, apiKey);
}

function determineAdType(ad: any): 'video' | 'image' | 'carousel' {
  const snapshot = ad.snapshot || {};
  
  // Check for video content
  if (snapshot.videos && Array.isArray(snapshot.videos) && snapshot.videos.length > 0) {
    return 'video';
  }
  
  // Check for carousel (multiple cards)
  if (snapshot.cards && Array.isArray(snapshot.cards) && snapshot.cards.length > 1) {
    return 'carousel';
  }
  
  // Check for video URLs in cards
  if (snapshot.cards && Array.isArray(snapshot.cards)) {
    for (const card of snapshot.cards) {
      if (card.video_hd_url || card.video_sd_url) {
        return 'video';
      }
    }
  }
  
  // Fallback to original logic for other formats
  if (ad.video_url || ad.video || ad.ad_creative_video || 
      (ad.media && ad.media.some((m: any) => m.type === 'video'))) {
    return 'video';
  }
  
  if (ad.carousel || ad.media_count > 1 || 
      (ad.media && ad.media.length > 1) ||
      ad.ad_creative_link_captions?.length > 1) {
    return 'carousel';
  }
  
  // Default to image
  return 'image';
}

function extractImageUrl(ad: any): string | undefined {
  const snapshot = ad.snapshot || {};
  
  // Try to get image from first card
  if (snapshot.cards && Array.isArray(snapshot.cards) && snapshot.cards.length > 0) {
    const firstCard = snapshot.cards[0];
    return firstCard.original_image_url || firstCard.resized_image_url;
  }
  
  // Try to get from images array
  if (snapshot.images && Array.isArray(snapshot.images) && snapshot.images.length > 0) {
    return snapshot.images[0].original_image_url || snapshot.images[0].resized_image_url;
  }
  
  // Fallback to original logic
  return ad.image_url || 
         ad.ad_creative_image_url || 
         ad.thumbnail_url ||
         (ad.media && ad.media[0]?.image_url) ||
         (ad.images && ad.images[0]) ||
         undefined;
}

function extractVideoUrl(ad: any): string | undefined {
  const snapshot = ad.snapshot || {};
  
  // Try to get video from videos array
  if (snapshot.videos && Array.isArray(snapshot.videos) && snapshot.videos.length > 0) {
    const firstVideo = snapshot.videos[0];
    return firstVideo.video_hd_url || firstVideo.video_sd_url;
  }
  
  // Try to get video from first card
  if (snapshot.cards && Array.isArray(snapshot.cards) && snapshot.cards.length > 0) {
    const firstCard = snapshot.cards[0];
    return firstCard.video_hd_url || firstCard.video_sd_url;
  }
  
  // Fallback to original logic
  return ad.video_url || 
         ad.ad_creative_video_url || 
         (ad.media && ad.media.find((m: any) => m.type === 'video')?.url) ||
         undefined;
}

export function extractPageIdFromInput(input: string): string | null {
  // First check if input is already a page ID (only digits)
  if (/^\d+$/.test(input.trim())) {
    return input.trim();
  }
  
  // Extract page ID from Facebook Ad Library URL
  const patterns = [
    /view_all_page_id=(\d+)/,
    /page_id=(\d+)/,
    /pageId=(\d+)/,
    /facebook\.com\/ads\/library\/\?.*page_id=(\d+)/,
    /facebook\.com\/ads\/library\/\?.*search_term=.*&page_id=(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

