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
  
  // Fallback detection from content
  if (ad.content) {
    try {
      const content = JSON.parse(ad.content);
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
  
  // Try to get platforms from content
  if (ad.content) {
    try {
      const content = JSON.parse(ad.content);
      const publisherPlatforms = content.publisher_platform || [];
      
      // Map platform names to match FilterRow options
      publisherPlatforms.forEach((platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('facebook')) platforms.push('Facebook');
        else if (p.includes('instagram')) platforms.push('Instagram');
        else if (p.includes('tiktok')) platforms.push('TikTok Organic');
        else if (p.includes('youtube')) platforms.push('Youtube');
        else if (p.includes('linkedin')) platforms.push('LinkedIn');
        else platforms.push(platform); // Keep original if no match
      });
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Try to get platform from direct ad properties
  if (ad.platform) {
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
      
      // Check various status fields
      const isActive = content.is_active ?? content.active ?? content.status === 'active';
      
      if (isActive === true) return ['Running'];
      if (isActive === false) return ['Not Running'];
      
      // Check end date
      const endDate = content.end_date || content.end_date_string;
      if (endDate) {
        const endDateTime = new Date(endDate).getTime();
        const now = Date.now();
        return endDateTime > now ? ['Running'] : ['Not Running'];
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