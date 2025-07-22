const { PrismaClient } = require('@prisma/client');

// Import all the JavaScript filtering functions
function createInitialFilterState() {
  return {
    format: [],
    platform: [],
    status: [],
    language: [],
    niche: [],
    date: null,
    search: '',
    sort: null
  };
}

function getAdFormat(ad) {
  try {
    if (ad.type) {
      const type = ad.type.toLowerCase();
      if (type === 'video') return 'Video';
      if (type === 'image') return 'Image';
      if (type === 'carousel') return 'Carousal';
    }
    
    if (ad.videoUrl || ad.localVideoUrl) {
      return 'Video';
    }
    
    if (ad.imageUrl || ad.localImageUrl) {
      return 'Image';
    }
    
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    if (snapshot.cards && snapshot.cards.length > 1) return 'Carousal';
    if (Array.isArray(snapshot.images) && snapshot.images.length > 1) return 'Carousal';
    
    if (snapshot.display_format) {
      const format = snapshot.display_format.toUpperCase();
      if (format === 'VIDEO') return 'Video';
      if (format === 'IMAGE') return 'Image';
      if (format === 'CAROUSEL') return 'Carousal';
      if (format === 'DCO') {
        if (snapshot.videos?.length > 0) return 'Video';
        if (snapshot.images?.length > 0) return 'Image';
        if (snapshot.cards?.length > 0) return 'Carousal';
        return 'Image';
      }
    }
    
    if (snapshot.videos?.length > 0) return 'Video';
    if (snapshot.images?.length > 0) return 'Image';
    if (snapshot.cards?.length > 0) return 'Carousal';
    
    return 'Image';
  } catch (e) {
    return 'Image';
  }
}

function getAdPlatform(ad) {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    
    if (content.publisher_platform && Array.isArray(content.publisher_platform)) {
      return content.publisher_platform.map((platform) => {
        const p = platform.toLowerCase();
        if (p === 'facebook') return 'Facebook';
        if (p === 'instagram') return 'Instagram';
        if (p === 'tiktok') return 'TikTok Organic';
        if (p === 'youtube') return 'Youtube';
        if (p === 'linkedin') return 'LinkedIn';
        if (p === 'audience_network') return 'Facebook';
        if (p === 'messenger') return 'Facebook';
        return p.charAt(0).toUpperCase() + p.slice(1);
      });
    }
    
    if (content.publisher_platform && typeof content.publisher_platform === 'string') {
      const platforms = content.publisher_platform.split(',').map((p) => p.trim().toLowerCase());
      return platforms.map((platform) => {
        if (platform === 'facebook') return 'Facebook';
        if (platform === 'instagram') return 'Instagram';
        if (platform === 'tiktok') return 'TikTok Organic';
        if (platform === 'youtube') return 'Youtube';
        if (platform === 'linkedin') return 'LinkedIn';
        if (platform === 'audience_network') return 'Facebook';
        if (platform === 'messenger') return 'Facebook';
        return platform.charAt(0).toUpperCase() + platform.slice(1);
      });
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return ['Facebook'];
}

function getAdStatus(ad) {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    
    if (content.is_active === false) return ['Not Running'];
    if (content.is_active === true) return ['Running'];
    
    const hasEndDate = content.end_date || content?.snapshot?.end_date;
    const endDate = hasEndDate ? new Date(content.end_date || content?.snapshot?.end_date) : null;
    const now = new Date();
    
    if (endDate && endDate < now) {
      return ['Not Running'];
    }
      
    return ['Running'];
  } catch (e) {
    return ['Running'];
  }
}

function getAdNiche(ad) {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    if (snapshot.page_categories && Array.isArray(snapshot.page_categories)) {
      const categories = snapshot.page_categories.map((cat) => cat.toLowerCase());
      
      if (categories.some((cat) => cat.includes('beauty') || cat.includes('cosmetic'))) return ['Beauty'];
      if (categories.some((cat) => cat.includes('fashion') || cat.includes('clothing'))) return ['Fashion'];
      if (categories.some((cat) => cat.includes('automotive') || cat.includes('car'))) return ['Automotive'];
      if (categories.some((cat) => cat.includes('software') || cat.includes('app'))) return ['App/Software'];
      if (categories.some((cat) => cat.includes('education'))) return ['Education'];
      if (categories.some((cat) => cat.includes('entertainment'))) return ['Entertainment'];
      if (categories.some((cat) => cat.includes('business'))) return ['Business/Professional'];
      if (categories.some((cat) => cat.includes('book') || cat.includes('publishing'))) return ['Book/Publishing'];
      if (categories.some((cat) => cat.includes('charity') || cat.includes('nonprofit'))) return ['Charity/NFP'];
      if (categories.some((cat) => cat.includes('accessories'))) return ['Accessories'];
      if (categories.some((cat) => cat.includes('alcohol') || cat.includes('wine') || cat.includes('beer'))) return ['Alcohol'];
    }
    
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
  
  return ['Business/Professional'];
}

function filterAds(ads, filters, brandName) {
  if (!ads || ads.length === 0) return [];
  
  let filtered = ads;
  
  if (filters.format && filters.format.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adFormat = getAdFormat(ad);
      return filters.format.includes(adFormat);
    });
    console.log(`🔍 Format filter (${filters.format.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.platform && filters.platform.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adPlatforms = getAdPlatform(ad);
      return filters.platform.some(platform => adPlatforms.includes(platform));
    });
    console.log(`🔍 Platform filter (${filters.platform.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adStatus = getAdStatus(ad);
      return filters.status.some(status => adStatus.includes(status));
    });
    console.log(`🔍 Status filter (${filters.status.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.niche && filters.niche.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adNiches = getAdNiche(ad);
      return filters.niche.some(niche => adNiches.includes(niche));
    });
    console.log(`🔍 Niche filter (${filters.niche.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  return filtered;
}

const prisma = new PrismaClient();

async function testRealFilters() {
  console.log('🎯 Testing All Filters with Real Data...\n');

  try {
    const ads = await prisma.ad.findMany({
      take: 100,
      include: {
        brand: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${ads.length} ads to test\n`);

    // Test Platform Filter
    console.log('🌐 Testing Platform Filter:');
    const platformFilters = ['Facebook', 'Instagram', 'TikTok Organic', 'Youtube'];
    platformFilters.forEach(platform => {
      const startTime = Date.now();
      const filters = createInitialFilterState();
      filters.platform = [platform];
      const result = filterAds(ads, filters);
      const endTime = Date.now();
      console.log(`  ${platform}: ${result.length} ads found in ${endTime - startTime}ms`);
    });

    // Test Status Filter
    console.log('\n🔄 Testing Status Filter:');
    const statusFilters = ['Running', 'Not Running'];
    statusFilters.forEach(status => {
      const startTime = Date.now();
      const filters = createInitialFilterState();
      filters.status = [status];
      const result = filterAds(ads, filters);
      const endTime = Date.now();
      console.log(`  ${status}: ${result.length} ads found in ${endTime - startTime}ms`);
    });

    // Test Niche Filter
    console.log('\n🎯 Testing Niche Filter:');
    const nicheFilters = ['Fashion', 'Beauty', 'Automotive', 'App/Software'];
    nicheFilters.forEach(niche => {
      const startTime = Date.now();
      const filters = createInitialFilterState();
      filters.niche = [niche];
      const result = filterAds(ads, filters);
      const endTime = Date.now();
      console.log(`  ${niche}: ${result.length} ads found in ${endTime - startTime}ms`);
    });

    // Test Combined Filters
    console.log('\n🔗 Testing Combined Filters:');
    const combinedTests = [
      {
        name: 'Fashion + Facebook + Running',
        filters: { niche: ['Fashion'], platform: ['Facebook'], status: ['Running'] }
      },
      {
        name: 'Instagram + Running',
        filters: { platform: ['Instagram'], status: ['Running'] }
      },
      {
        name: 'All Carousal + Facebook',
        filters: { format: ['Carousal'], platform: ['Facebook'] }
      }
    ];

    combinedTests.forEach(test => {
      const startTime = Date.now();
      const filters = createInitialFilterState();
      Object.assign(filters, test.filters);
      const result = filterAds(ads, filters);
      const endTime = Date.now();
      console.log(`  ${test.name}: ${result.length} ads found in ${endTime - startTime}ms`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealFilters(); 