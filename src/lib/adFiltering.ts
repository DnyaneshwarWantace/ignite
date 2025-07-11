// Shared utility functions for ad filtering across components

export interface FilterState {
  format: string[];
  platform: string[];
  status: string[];
  language: string[];
  niche: string[];
  date: Date | null;
  search: string;
  sort: string | null;
}

// Helper function to extract text content from ad for searching
export const getSearchableText = (ad: any, brandName?: string) => {
  const searchableFields = [];
  
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    // Add all possible text fields from the API response
    const textFields = [
      snapshot.page_name,
      snapshot.body?.text,
      snapshot.title,
      snapshot.caption,
      snapshot.link_description,
      snapshot.cta_text,
      snapshot.current_page_name,
      content.ad_archive_id,
      snapshot.page_categories?.join(' '),
      ad.brand?.name,
      brandName,
      ad.id,
      ad.libraryId
    ];

    // Add all text fields after cleaning
    textFields.forEach(field => {
      if (field) {
        const cleanText = field.toString()
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Replace special chars with space
          .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
          .trim();
        if (cleanText) searchableFields.push(cleanText);
      }
    });

  } catch (e) {
    // Fallback to basic fields if content parsing fails
  if (ad.brand?.name) searchableFields.push(ad.brand.name.toLowerCase());
  if (brandName) searchableFields.push(brandName.toLowerCase());
    if (ad.id) searchableFields.push(ad.id.toLowerCase());
    if (ad.libraryId) searchableFields.push(ad.libraryId.toLowerCase());
  }
  
  return searchableFields.join(' ');
};

// Helper function to get ad format
export const getAdFormat = (ad: any): string => {
  try {
    // Check database type field first
  if (ad.type) {
    const type = ad.type.toLowerCase();
    if (type === 'video') return 'Video';
    if (type === 'image') return 'Image';
      if (type === 'carousel') return 'Carousal';
    }
    
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    // Check if it's a carousel first
      if (snapshot.cards && snapshot.cards.length > 1) return 'Carousal';
    if (Array.isArray(snapshot.images) && snapshot.images.length > 1) return 'Carousal';
    
    // Then check display_format from API
    if (snapshot.display_format) {
      const format = snapshot.display_format.toUpperCase();
      if (format === 'VIDEO') return 'Video';
      if (format === 'IMAGE') return 'Image';
      if (format === 'CAROUSEL') return 'Carousal';
    }
    
    // Fallback to content structure
    if (snapshot.videos?.length > 0) return 'Video';
    if (snapshot.images?.length > 0) return 'Image';
    
    return 'Image'; // Final fallback
  } catch (e) {
    return 'Image';
  }
};

// Helper function to get ad platform
export const getAdPlatform = (ad: any): string[] => {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    
    // Get publisher_platform from API
    if (content.publisher_platform && Array.isArray(content.publisher_platform)) {
      return content.publisher_platform.map((platform: string) => {
        // Format platform names to match UI
        const p = platform.toLowerCase();
        if (p === 'facebook') return 'Facebook';
        if (p === 'instagram') return 'Instagram';
        if (p === 'tiktok') return 'TikTok Organic';
        if (p === 'youtube') return 'Youtube';
        if (p === 'linkedin') return 'LinkedIn';
        // Capitalize first letter for other platforms
        return p.charAt(0).toUpperCase() + p.slice(1);
      });
    }
    } catch (e) {
      // Ignore parsing errors
  }
  
  return ['Facebook']; // Default fallback
};

// Helper function to get ad status
export const getAdStatus = (ad: any): string[] => {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    
    // Debug logging
    console.log('Ad status check:', {
      adId: ad.id,
      isActive: content.is_active,
      hasEndDate: !!(content.end_date || content?.snapshot?.end_date),
      endDate: content.end_date || content?.snapshot?.end_date
    });
    
    // Check is_active field from content (this is how it's stored in database)
    if (content.is_active === false) return ['Not Running'];
    if (content.is_active === true) return ['Running'];
    
    // Fallback checks for other status indicators
    const hasEndDate = content.end_date || content?.snapshot?.end_date;
    const endDate = hasEndDate ? new Date(content.end_date || content?.snapshot?.end_date) : null;
    const now = new Date();
    
    // Check if ad has ended
    if (endDate && endDate < now) {
      return ['Not Running'];
    }
      
    // Default to running if no clear indication
    return ['Running'];
    } catch (e) {
    console.error('Error in getAdStatus:', e);
    return ['Running']; // Default to running if can't determine
  }
};

// Helper function to detect ad language
export const getAdLanguage = (ad: any): string[] => {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    // First check if language is explicitly provided in content
    if (content.language || snapshot.language) {
      const lang = (content.language || snapshot.language).toLowerCase();
      if (lang.includes('en')) return ['English'];
      if (lang.includes('ar')) return ['Arabic'];
      if (lang.includes('zh')) return ['Chinese'];
      if (lang.includes('es')) return ['Spanish'];
      if (lang.includes('fr')) return ['French'];
    }
    
    // Check transcript language if available
    if (ad.transcript?.language) {
      const lang = ad.transcript.language.toLowerCase();
      if (lang.includes('en')) return ['English'];
      if (lang.includes('ar')) return ['Arabic'];
      if (lang.includes('zh')) return ['Chinese'];
      if (lang.includes('es')) return ['Spanish'];
      if (lang.includes('fr')) return ['French'];
    }
    
    // Fallback to text analysis
    const text = [
      snapshot.body?.text,
      snapshot.title,
      snapshot.caption,
      snapshot.link_description,
      ad.text,
      ad.headline,
      ad.description
    ].filter(Boolean).join(' ');
    
        if (!text) return ['English']; // Default if no text

    console.log('🔍 Language detection text:', text.substring(0, 200));

    // Check for specific character ranges
    if (/[\u0600-\u06FF]/.test(text)) return ['Arabic'];
    if (/[\u4E00-\u9FFF]/.test(text)) return ['Chinese'];
    if (/[ñáéíóúü]/i.test(text)) {
      console.log('🔍 Spanish text detected:', text.substring(0, 100));
      return ['Spanish'];
    }
    if (/[àâçéèêëîïôûùüÿ]/i.test(text)) return ['French'];
    
    return ['English']; // Default to English for Latin script
  } catch (e) {
    return ['English'];
  }
};

// Helper function to detect ad niche
export const getAdNiche = (ad: any): string[] => {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    // First check page categories from API
    if (snapshot.page_categories && Array.isArray(snapshot.page_categories)) {
      const categories = snapshot.page_categories.map((cat: string) => cat.toLowerCase());
      
      // Map API categories to our niche options
      if (categories.some((cat: string) => cat.includes('beauty') || cat.includes('cosmetic'))) return ['Beauty'];
      if (categories.some((cat: string) => cat.includes('fashion') || cat.includes('clothing'))) return ['Fashion'];
      if (categories.some((cat: string) => cat.includes('automotive') || cat.includes('car'))) return ['Automotive'];
      if (categories.some((cat: string) => cat.includes('software') || cat.includes('app'))) return ['App/Software'];
      if (categories.some((cat: string) => cat.includes('education'))) return ['Education'];
      if (categories.some((cat: string) => cat.includes('entertainment'))) return ['Entertainment'];
      if (categories.some((cat: string) => cat.includes('business'))) return ['Business/Professional'];
      if (categories.some((cat: string) => cat.includes('book') || cat.includes('publishing'))) return ['Book/Publishing'];
      if (categories.some((cat: string) => cat.includes('charity') || cat.includes('nonprofit'))) return ['Charity/NFP'];
      if (categories.some((cat: string) => cat.includes('accessories'))) return ['Accessories'];
      if (categories.some((cat: string) => cat.includes('alcohol') || cat.includes('wine') || cat.includes('beer'))) return ['Alcohol'];
    }
    
    // Fallback to text analysis if no categories
    const searchText = [
      snapshot.body?.text,
      snapshot.title,
      snapshot.caption,
      snapshot.link_description,
      snapshot.page_name
    ].filter(Boolean).join(' ').toLowerCase();
    
    if (/beauty|makeup|cosmetic|skincare/i.test(searchText)) return ['Beauty'];
    if (/fashion|clothing|apparel|dress|shirt|shoes/i.test(searchText)) return ['Fashion'];
    if (/car|auto|vehicle|toyota|honda|bmw/i.test(searchText)) return ['Automotive'];
    if (/app|software|tech|digital|mobile/i.test(searchText)) return ['App/Software'];
    if (/education|learn|course|school|university/i.test(searchText)) return ['Education'];
    if (/entertainment|movie|music|game/i.test(searchText)) return ['Entertainment'];
    if (/business|professional|corporate|office/i.test(searchText)) return ['Business/Professional'];
    if (/book|read|author|publish/i.test(searchText)) return ['Book/Publishing'];
    if (/charity|nonprofit|donate|help/i.test(searchText)) return ['Charity/NFP'];
    if (/accessory|jewelry|watch|bag/i.test(searchText)) return ['Accessories'];
    if (/alcohol|beer|wine|drink/i.test(searchText)) return ['Alcohol'];
    
  } catch (e) {
    // Ignore parsing errors
  }
  
  return ['Business/Professional']; // Default fallback
};

// Main filtering function that can be used across all components
export const filterAds = (ads: any[], filters: FilterState, brandName?: string): any[] => {
  if (!ads || ads.length === 0) return [];
  
  let filtered = ads;
  
  // Apply search filter
  if (filters.search && filters.search.trim() !== '') {
    const searchTerm = filters.search.toLowerCase().trim();
    filtered = filtered.filter((ad: any) => {
      const searchableText = getSearchableText(ad, brandName);
      return searchableText.includes(searchTerm);
    });
  }
  
  // Apply format filter
  if (filters.format && filters.format.length > 0) {
    filtered = filtered.filter((ad: any) => {
      const adFormat = getAdFormat(ad);
      return filters.format.includes(adFormat);
    });
  }
  
  // Apply platform filter
  if (filters.platform && filters.platform.length > 0) {
    filtered = filtered.filter((ad: any) => {
      const adPlatforms = getAdPlatform(ad);
      return filters.platform.some(platform => adPlatforms.includes(platform));
    });
  }
  
  // Apply status filter
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    console.log('Applying status filter:', filters.status);
    console.log('Total ads before status filter:', filtered.length);
    
    filtered = filtered.filter((ad: any) => {
      const adStatus = getAdStatus(ad);
      const matches = filters.status.some(status => adStatus.includes(status));
      console.log(`Ad ${ad.id}: status=${JSON.stringify(adStatus)}, matches=${matches}`);
      return matches;
    });
    
    console.log('Total ads after status filter:', filtered.length);
  }
  
  // Apply language filter
  if (filters.language && Array.isArray(filters.language) && filters.language.length > 0) {
    console.log('🔍 Applying language filter:', filters.language);
    console.log('🔍 Total ads before language filter:', filtered.length);

    filtered = filtered.filter((ad: any) => {
      const adLanguages = getAdLanguage(ad);
      const matches = filters.language.some(language => adLanguages.includes(language)); 
      console.log(`🔍 Ad ${ad.id}: languages=${JSON.stringify(adLanguages)}, matches=${matches}`);
      return matches;
    });

    console.log('🔍 Total ads after language filter:', filtered.length);
  }
  
  // Apply niche filter
  if (filters.niche && filters.niche.length > 0) {
    filtered = filtered.filter((ad: any) => {
      const adNiches = getAdNiche(ad);
      return filters.niche.some(niche => adNiches.includes(niche));
    });
  }
  
  // Apply date filter
  if (filters.date) {
    filtered = filtered.filter((ad: any) => {
      try {
        const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
        const startDate = content.start_date || content.start_date_string;
        if (!startDate) return false;
        
        const adDate = new Date(typeof startDate === 'number' ? startDate * 1000 : startDate);
        const filterDate = new Date(filters.date!);
        
        // Compare just the dates (ignore time)
        return adDate.toDateString() === filterDate.toDateString();
      } catch (e) {
        return false;
      }
    });
  }
  
  // Apply sorting
  if (filters.sort) {
    filtered = [...filtered].sort((a, b) => {
      try {
        const contentA = typeof a.content === 'string' ? JSON.parse(a.content) : a.content;
        const contentB = typeof b.content === 'string' ? JSON.parse(b.content) : b.content;
        
        switch (filters.sort) {
          case 'newest':
            const dateA = new Date(contentA.start_date || contentA.start_date_string || contentA.created_time);
            const dateB = new Date(contentB.start_date || contentB.start_date_string || contentB.created_time);
            return dateB.getTime() - dateA.getTime();
          case 'format':
            const formatA = getAdFormat(a);
            const formatB = getAdFormat(b);
            return formatA.localeCompare(formatB);
          default:
            return 0;
        }
      } catch (e) {
        return 0;
      }
    });
  }
  
  return filtered;
};

// Helper function to create initial filter state
export const createInitialFilterState = (): FilterState => ({
  format: [],
  platform: [],
  status: [],
  language: [],
  niche: [],
  date: null,
  search: "",
  sort: null,
});

// Export all filtering functions as a single object
export const adFiltering = {
  filterAds,
  getSearchableText,
  getAdFormat,
  getAdPlatform,
  getAdStatus,
  getAdLanguage,
  getAdNiche,
  createInitialFilterState,
}; 