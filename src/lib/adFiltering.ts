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
  
  // Add basic ad fields
  if (ad.headline) searchableFields.push(ad.headline.toLowerCase());
  if (ad.text) searchableFields.push(ad.text.toLowerCase());
  if (ad.description) searchableFields.push(ad.description.toLowerCase());
  if (ad.id) searchableFields.push(ad.id.toLowerCase());
  if (ad.libraryId) searchableFields.push(ad.libraryId.toLowerCase());
  
  // Add brand info
  if (ad.brand?.name) searchableFields.push(ad.brand.name.toLowerCase());
  if (brandName) searchableFields.push(brandName.toLowerCase());
  
  // Parse content for more searchable text
  if (ad.content) {
    try {
      const content = JSON.parse(ad.content);
      const snapshot = content.snapshot || {};
      
      if (snapshot.title) searchableFields.push(snapshot.title.toLowerCase());
      if (snapshot.caption) searchableFields.push(snapshot.caption.toLowerCase());
      if (snapshot.link_description) searchableFields.push(snapshot.link_description.toLowerCase());
      if (snapshot.page_name) searchableFields.push(snapshot.page_name.toLowerCase());
      if (snapshot.body?.text) searchableFields.push(snapshot.body.text.toLowerCase());
      if (snapshot.cta_text) searchableFields.push(snapshot.cta_text.toLowerCase());
      if (content.ad_archive_id) searchableFields.push(content.ad_archive_id.toLowerCase());
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return searchableFields.join(' ');
};

// Helper function to get ad format
export const getAdFormat = (ad: any): string => {
  if (ad.type) {
    // Normalize format names
    const type = ad.type.toLowerCase();
    if (type === 'carousel') return 'Carousal'; // Match FilterRow spelling
    if (type === 'video') return 'Video';
    if (type === 'image') return 'Image';
  }
  
  // Extract from content JSON
  if (ad.content) {
    try {
      const content = JSON.parse(ad.content);
      
      // Check display_format in snapshot
      if (content.snapshot?.display_format) {
        const format = content.snapshot.display_format.toLowerCase();
        if (format === 'video') return 'Video';
        if (format === 'dco') return 'Carousal'; // DCO = Dynamic Creative Optimization (Carousel)
        if (format === 'carousel') return 'Carousal';
        if (format === 'image') return 'Image';
      }
      
      // Fallback detection from content structure
      const snapshot = content.snapshot || {};
      
      if (snapshot.videos && snapshot.videos.length > 0) return 'Video';
      if (snapshot.cards && snapshot.cards.length > 1) return 'Carousal';
      if (snapshot.images && snapshot.images.length > 0) return 'Image';
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return 'Image'; // Default fallback
};

// Helper function to get ad platform
export const getAdPlatform = (ad: any): string[] => {
  const platforms: string[] = [];
  
  // Extract from content JSON
  if (ad.content) {
    try {
      const content = JSON.parse(ad.content);
      
      // Check publisher_platform (this is the actual field name)
      if (content.publisher_platform && Array.isArray(content.publisher_platform)) {
        content.publisher_platform.forEach((platform: string) => {
          const p = platform.toLowerCase();
          if (p === 'facebook') platforms.push('Facebook');
          else if (p === 'instagram') platforms.push('Instagram');
          else if (p === 'audience_network') platforms.push('Audience Network');
          else if (p === 'messenger') platforms.push('Messenger');
          else if (p === 'tiktok') platforms.push('TikTok Organic');
          else if (p === 'youtube') platforms.push('Youtube');
          else if (p === 'linkedin') platforms.push('LinkedIn');
          else platforms.push(platform); // Keep original if no match
        });
      }
      
      // Fallback: Check publisherPlatform (camelCase format - just in case)
      if (platforms.length === 0 && content.publisherPlatform && Array.isArray(content.publisherPlatform)) {
        content.publisherPlatform.forEach((platform: string) => {
        const p = platform.toLowerCase();
          if (p === 'facebook') platforms.push('Facebook');
          else if (p === 'instagram') platforms.push('Instagram');
          else if (p === 'audience_network') platforms.push('Audience Network');
          else if (p === 'messenger') platforms.push('Messenger');
          else if (p === 'tiktok') platforms.push('TikTok Organic');
          else if (p === 'youtube') platforms.push('Youtube');
          else if (p === 'linkedin') platforms.push('LinkedIn');
        else platforms.push(platform); // Keep original if no match
      });
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Try to get platform from direct ad properties
  if (platforms.length === 0 && ad.platform) {
    const p = ad.platform.toLowerCase();
    if (p.includes('facebook')) platforms.push('Facebook');
    else if (p.includes('instagram')) platforms.push('Instagram');
    else if (p.includes('tiktok')) platforms.push('TikTok Organic');
    else if (p.includes('youtube')) platforms.push('Youtube');
    else if (p.includes('linkedin')) platforms.push('LinkedIn');
    else platforms.push(ad.platform);
  }
  
  // Remove duplicates
  const uniquePlatforms = Array.from(new Set(platforms));
  
  // Default fallback if no platforms found
  return uniquePlatforms.length > 0 ? uniquePlatforms : ['Facebook'];
};

// Helper function to get ad status
export const getAdStatus = (ad: any): string[] => {
  if (ad.content) {
    try {
      const content = JSON.parse(ad.content);
      
      // Check is_active field (this is the actual field name)
      if (content.hasOwnProperty('is_active')) {
        return content.is_active ? ['Running'] : ['Not Running'];
      }
      
      // Fallback: Check isActive field (camelCase format - just in case)
      if (content.hasOwnProperty('isActive')) {
        return content.isActive ? ['Running'] : ['Not Running'];
      }
      
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return ['Running']; // Default fallback
};

// Helper function to detect ad language (basic implementation)
export const getAdLanguage = (ad: any, brandName?: string): string[] => {
  const text = getSearchableText(ad, brandName);
  
  // Basic language detection (you can enhance this)
  if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(text)) {
    if (/[ñáéíóúü]/i.test(text)) return ['Spanish'];
    return ['French'];
  }
  if (/[一-龯]/i.test(text)) return ['Chinese'];
  if (/[ا-ي]/i.test(text)) return ['Arabic'];
  
  return ['English']; // Default fallback
};

// Helper function to detect ad niche (basic implementation)
export const getAdNiche = (ad: any, brandName?: string): string[] => {
  const text = getSearchableText(ad, brandName);
  const brand = brandName?.toLowerCase() || ad.brand?.name?.toLowerCase() || '';
  
  // Basic niche detection based on keywords
  if (/beauty|makeup|cosmetic|skincare|lipstick|foundation/i.test(text + ' ' + brand)) return ['Beauty'];
  if (/fashion|clothing|apparel|dress|shirt|shoes|style/i.test(text + ' ' + brand)) return ['Fashion'];
  if (/car|auto|vehicle|toyota|honda|bmw|mercedes/i.test(text + ' ' + brand)) return ['Automotive'];
  if (/app|software|tech|digital|mobile|download/i.test(text + ' ' + brand)) return ['App/Software'];
  if (/education|learn|course|school|university|study/i.test(text + ' ' + brand)) return ['Education'];
  if (/entertainment|movie|music|game|fun|play/i.test(text + ' ' + brand)) return ['Entertainment'];
  if (/business|professional|corporate|office|work/i.test(text + ' ' + brand)) return ['Business/Professional'];
  if (/book|read|author|publish|novel/i.test(text + ' ' + brand)) return ['Book/Publishing'];
  if (/charity|nonprofit|donate|help|support/i.test(text + ' ' + brand)) return ['Charity/NFP'];
  if (/accessory|jewelry|watch|bag|wallet/i.test(text + ' ' + brand)) return ['Accessories'];
  if (/alcohol|beer|wine|drink|cocktail/i.test(text + ' ' + brand)) return ['Alcohol'];
  
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
      return filters.platform.some((platform: string) => adPlatforms.includes(platform));
    });
  }
  
  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((ad: any) => {
      const adStatus = getAdStatus(ad);
      return filters.status.some((status: string) => adStatus.includes(status));
    });
  }
  
  // Apply language filter
  if (filters.language && filters.language.length > 0) {
    filtered = filtered.filter((ad: any) => {
      const adLanguages = getAdLanguage(ad, brandName);
      return filters.language.some((language: string) => adLanguages.includes(language));
    });
  }
  
  // Apply niche filter
  if (filters.niche && filters.niche.length > 0) {
    filtered = filtered.filter((ad: any) => {
      const adNiches = getAdNiche(ad, brandName);
      return filters.niche.some((niche: string) => adNiches.includes(niche));
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