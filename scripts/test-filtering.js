const { PrismaClient } = require('@prisma/client');

// JavaScript versions of the filtering functions for testing
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

function getSearchableText(ad, brandName) {
  const searchableFields = [];
  
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
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

    textFields.forEach(field => {
      if (field) {
        const cleanText = field.toString()
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanText) searchableFields.push(cleanText);
      }
    });
  } catch (e) {
    if (ad.brand?.name) searchableFields.push(ad.brand.name.toLowerCase());
    if (brandName) searchableFields.push(brandName.toLowerCase());
    if (ad.id) searchableFields.push(ad.id.toLowerCase());
    if (ad.libraryId) searchableFields.push(ad.libraryId.toLowerCase());
  }
  
  return searchableFields.join(' ');
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
    }
    
    if (snapshot.videos?.length > 0) return 'Video';
    if (snapshot.images?.length > 0) return 'Image';
    
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
        return p.charAt(0).toUpperCase() + p.slice(1);
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

function getAdLanguage(ad) {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    const snapshot = content?.snapshot || {};
    
    if (content.language || snapshot.language) {
      const lang = (content.language || snapshot.language).toLowerCase();
      if (lang.includes('en')) return ['English'];
      if (lang.includes('ar')) return ['Arabic'];
      if (lang.includes('zh')) return ['Chinese'];
      if (lang.includes('es')) return ['Spanish'];
      if (lang.includes('fr')) return ['French'];
    }
    
    if (ad.transcript?.language) {
      const lang = ad.transcript.language.toLowerCase();
      if (lang.includes('en')) return ['English'];
      if (lang.includes('ar')) return ['Arabic'];
      if (lang.includes('zh')) return ['Chinese'];
      if (lang.includes('es')) return ['Spanish'];
      if (lang.includes('fr')) return ['French'];
    }
    
    const text = [
      snapshot.body?.text,
      snapshot.title,
      snapshot.caption,
      snapshot.link_description,
      ad.text,
      ad.headline,
      ad.description
    ].filter(Boolean).join(' ');
    
    if (!text) return ['English'];

    if (/[\u0600-\u06FF]/.test(text)) return ['Arabic'];
    if (/[\u4E00-\u9FFF]/.test(text)) return ['Chinese'];
    if (/[ñáéíóúü]/i.test(text)) return ['Spanish'];
    if (/[àâçéèêëîïôûùüÿ]/i.test(text)) return ['French'];
    
    return ['English'];
  } catch (e) {
    return ['English'];
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
  
  console.log('🔍 Starting filterAds with:', {
    totalAds: ads.length,
    filters: filters,
    brandName: brandName
  });
  
  let filtered = ads;
  
  if (filters.search && filters.search.trim() !== '') {
    const searchTerm = filters.search.toLowerCase().trim();
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const searchableText = getSearchableText(ad, brandName);
      return searchableText.includes(searchTerm);
    });
    console.log(`🔍 Search filter: ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.format && filters.format.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adFormat = getAdFormat(ad);
      const matches = filters.format.includes(adFormat);
      if (beforeCount < 10) {
        console.log(`🔍 Ad ${ad.id}: format=${adFormat}, matches=${matches}`);
      }
      return matches;
    });
    console.log(`🔍 Format filter (${filters.format.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.platform && filters.platform.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adPlatforms = getAdPlatform(ad);
      const matches = filters.platform.some(platform => adPlatforms.includes(platform));
      if (beforeCount < 10) {
        console.log(`🔍 Ad ${ad.id}: platforms=${adPlatforms.join(', ')}, matches=${matches}`);
      }
      return matches;
    });
    console.log(`🔍 Platform filter (${filters.platform.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adStatus = getAdStatus(ad);
      const matches = filters.status.some(status => adStatus.includes(status));
      if (beforeCount < 10) {
        console.log(`🔍 Ad ${ad.id}: status=${adStatus.join(', ')}, matches=${matches}`);
      }
      return matches;
    });
    console.log(`🔍 Status filter (${filters.status.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.language && Array.isArray(filters.language) && filters.language.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adLanguages = getAdLanguage(ad);
      const matches = filters.language.some(language => adLanguages.includes(language));
      if (beforeCount < 10) {
        console.log(`🔍 Ad ${ad.id}: languages=${adLanguages.join(', ')}, matches=${matches}`);
      }
      return matches;
    });
    console.log(`🔍 Language filter (${filters.language.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.niche && filters.niche.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      const adNiches = getAdNiche(ad);
      const matches = filters.niche.some(niche => adNiches.includes(niche));
      if (beforeCount < 10) {
        console.log(`🔍 Ad ${ad.id}: niches=${adNiches.join(', ')}, matches=${matches}`);
      }
      return matches;
    });
    console.log(`🔍 Niche filter (${filters.niche.join(', ')}): ${beforeCount} -> ${filtered.length} ads`);
  }
  
  if (filters.date) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((ad) => {
      try {
        const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
        const startDate = content.start_date || content.start_date_string;
        if (!startDate) return false;
        
        const adDate = new Date(typeof startDate === 'number' ? startDate * 1000 : startDate);
        const filterDate = new Date(filters.date);
        
        return adDate.toDateString() === filterDate.toDateString();
      } catch (e) {
        return false;
      }
    });
    console.log(`🔍 Date filter: ${beforeCount} -> ${filtered.length} ads`);
  }
  
  return filtered;
}

const prisma = new PrismaClient();

// Test data - sample ads with different characteristics
const sampleAds = [
  {
    id: 'test-1',
    type: 'video',
    videoUrl: 'https://example.com/video1.mp4',
    content: JSON.stringify({
      is_active: true,
      publisher_platform: ['facebook'],
      snapshot: {
        body: { text: 'This is an English video ad' },
        page_categories: ['Beauty']
      }
    }),
    brand: { name: 'Test Brand 1' }
  },
  {
    id: 'test-2',
    type: 'image',
    imageUrl: 'https://example.com/image1.jpg',
    content: JSON.stringify({
      is_active: false,
      publisher_platform: ['instagram'],
      snapshot: {
        body: { text: 'Esta es una imagen en español' },
        page_categories: ['Fashion']
      }
    }),
    brand: { name: 'Test Brand 2' }
  },
  {
    id: 'test-3',
    type: 'carousel',
    content: JSON.stringify({
      is_active: true,
      publisher_platform: ['facebook', 'instagram'],
      snapshot: {
        cards: [{}, {}],
        body: { text: 'This is a carousel ad' },
        page_categories: ['Automotive']
      }
    }),
    brand: { name: 'Test Brand 3' }
  },
  {
    id: 'test-4',
    type: 'video',
    videoUrl: 'https://example.com/video2.mp4',
    content: JSON.stringify({
      is_active: true,
      publisher_platform: ['tiktok'],
      snapshot: {
        body: { text: '这是中文视频广告' },
        page_categories: ['App/Software']
      }
    }),
    brand: { name: 'Test Brand 4' }
  }
];

async function testIndividualFilters() {
  console.log('🧪 Testing Individual Filters...\n');

  // Test Format Filter
  console.log('📹 Testing Format Filter:');
  const formatFilters = ['Video', 'Image', 'Carousal'];
  formatFilters.forEach(format => {
    const startTime = Date.now();
    const filters = createInitialFilterState();
    filters.format = [format];
    const result = filterAds(sampleAds, filters);
    const endTime = Date.now();
    console.log(`  ${format}: ${result.length} ads found in ${endTime - startTime}ms`);
    result.forEach(ad => console.log(`    - ${ad.id} (${ad.type})`));
  });

  // Test Platform Filter
  console.log('\n🌐 Testing Platform Filter:');
  const platformFilters = ['Facebook', 'Instagram', 'TikTok Organic', 'Youtube'];
  platformFilters.forEach(platform => {
    const startTime = Date.now();
    const filters = createInitialFilterState();
    filters.platform = [platform];
    const result = filterAds(sampleAds, filters);
    const endTime = Date.now();
    console.log(`  ${platform}: ${result.length} ads found in ${endTime - startTime}ms`);
    result.forEach(ad => console.log(`    - ${ad.id}`));
  });

  // Test Status Filter
  console.log('\n🔄 Testing Status Filter:');
  const statusFilters = ['Running', 'Not Running'];
  statusFilters.forEach(status => {
    const startTime = Date.now();
    const filters = createInitialFilterState();
    filters.status = [status];
    const result = filterAds(sampleAds, filters);
    const endTime = Date.now();
    console.log(`  ${status}: ${result.length} ads found in ${endTime - startTime}ms`);
    result.forEach(ad => console.log(`    - ${ad.id}`));
  });

  // Test Language Filter
  console.log('\n🌍 Testing Language Filter:');
  const languageFilters = ['English', 'Spanish', 'Chinese'];
  languageFilters.forEach(language => {
    const startTime = Date.now();
    const filters = createInitialFilterState();
    filters.language = [language];
    const result = filterAds(sampleAds, filters);
    const endTime = Date.now();
    console.log(`  ${language}: ${result.length} ads found in ${endTime - startTime}ms`);
    result.forEach(ad => console.log(`    - ${ad.id}`));
  });

  // Test Niche Filter
  console.log('\n🎯 Testing Niche Filter:');
  const nicheFilters = ['Beauty', 'Fashion', 'Automotive', 'App/Software'];
  nicheFilters.forEach(niche => {
    const startTime = Date.now();
    const filters = createInitialFilterState();
    filters.niche = [niche];
    const result = filterAds(sampleAds, filters);
    const endTime = Date.now();
    console.log(`  ${niche}: ${result.length} ads found in ${endTime - startTime}ms`);
    result.forEach(ad => console.log(`    - ${ad.id}`));
  });
}

async function testCombinedFilters() {
  console.log('\n🔗 Testing Combined Filters...\n');

  const testCases = [
    {
      name: 'Video + Facebook + Running',
      filters: { format: ['Video'], platform: ['Facebook'], status: ['Running'] }
    },
    {
      name: 'Image + Instagram + Not Running',
      filters: { format: ['Image'], platform: ['Instagram'], status: ['Not Running'] }
    },
    {
      name: 'Video + TikTok + English',
      filters: { format: ['Video'], platform: ['TikTok Organic'], language: ['English'] }
    },
    {
      name: 'All Video Ads',
      filters: { format: ['Video'] }
    },
    {
      name: 'All Running Ads',
      filters: { status: ['Running'] }
    },
    {
      name: 'Beauty + Facebook',
      filters: { niche: ['Beauty'], platform: ['Facebook'] }
    }
  ];

  testCases.forEach(testCase => {
    const startTime = Date.now();
    const filters = createInitialFilterState();
    Object.assign(filters, testCase.filters);
    const result = filterAds(sampleAds, filters);
    const endTime = Date.now();
    console.log(`  ${testCase.name}: ${result.length} ads found in ${endTime - startTime}ms`);
    result.forEach(ad => console.log(`    - ${ad.id}`));
  });
}

async function testRealDatabaseData() {
  console.log('\n🗄️ Testing with Real Database Data...\n');

  try {
    // Fetch some real ads from database
    const realAds = await prisma.ad.findMany({
      take: 50,
      include: {
        brand: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${realAds.length} real ads in database`);

    if (realAds.length === 0) {
      console.log('❌ No ads found in database. Please add some ads first.');
      return;
    }
    
    // Test format filter with real data
    console.log('\n📹 Testing Format Filter with Real Data:');
    const formatFilters = ['Video', 'Image', 'Carousal'];
    formatFilters.forEach(format => {
      const startTime = Date.now();
      const filters = createInitialFilterState();
      filters.format = [format];
      const result = filterAds(realAds, filters);
      const endTime = Date.now();
      console.log(`  ${format}: ${result.length} ads found in ${endTime - startTime}ms`);
      
      // Show sample results
        result.slice(0, 3).forEach(ad => {
        console.log(`    - ${ad.id} (${ad.type}) - ${ad.brand?.name || 'Unknown Brand'}`);
      });
      if (result.length > 3) {
        console.log(`    ... and ${result.length - 3} more`);
      }
    });

    // Test search filter
    console.log('\n🔍 Testing Search Filter with Real Data:');
    const searchTerms = ['test', 'brand', 'ad'];
    searchTerms.forEach(term => {
      const startTime = Date.now();
      const filters = createInitialFilterState();
      filters.search = term;
      const result = filterAds(realAds, filters);
      const endTime = Date.now();
      console.log(`  Search "${term}": ${result.length} ads found in ${endTime - startTime}ms`);
    });

    // Test complex combination
    console.log('\n🎯 Testing Complex Filter Combination:');
    const startTime = Date.now();
    const filters = createInitialFilterState();
    filters.format = ['Video', 'Image'];
    filters.status = ['Running'];
    const result = filterAds(realAds, filters);
    const endTime = Date.now();
    console.log(`  Video/Image + Running: ${result.length} ads found in ${endTime - startTime}ms`);

  } catch (error) {
    console.error('❌ Error testing with real data:', error);
  }
}

async function testPerformance() {
  console.log('\n⚡ Performance Testing...\n');

  // Generate larger test dataset
  const largeTestAds = [];
  for (let i = 0; i < 1000; i++) {
    const types = ['video', 'image', 'carousel'];
    const platforms = ['facebook', 'instagram', 'tiktok'];
    const statuses = [true, false];
    const languages = ['English', 'Spanish', 'Chinese'];
    const niches = ['Beauty', 'Fashion', 'Automotive'];

    largeTestAds.push({
      id: `perf-test-${i}`,
      type: types[i % types.length],
      content: JSON.stringify({
        is_active: statuses[i % statuses.length],
        publisher_platform: [platforms[i % platforms.length]],
        snapshot: {
          body: { text: `Test ad ${i} in ${languages[i % languages.length]}` },
          page_categories: [niches[i % niches.length]]
        }
      }),
      brand: { name: `Brand ${i}` }
    });
  }

  console.log(`📊 Testing with ${largeTestAds.length} ads`);

  // Test single filter performance
  const singleFilterTests = [
    { name: 'Format Filter', filters: { format: ['Video'] } },
    { name: 'Platform Filter', filters: { platform: ['Facebook'] } },
    { name: 'Status Filter', filters: { status: ['Running'] } },
    { name: 'Language Filter', filters: { language: ['English'] } },
    { name: 'Niche Filter', filters: { niche: ['Beauty'] } }
  ];

  singleFilterTests.forEach(test => {
    const startTime = Date.now();
    const filters = createInitialFilterState();
    Object.assign(filters, test.filters);
    const result = filterAds(largeTestAds, filters);
    const endTime = Date.now();
    console.log(`  ${test.name}: ${result.length} ads found in ${endTime - startTime}ms`);
  });

  // Test multiple filter performance
  console.log('\n🔗 Testing Multiple Filters Performance:');
  const startTime = Date.now();
  const filters = createInitialFilterState();
  filters.format = ['Video', 'Image'];
  filters.platform = ['Facebook', 'Instagram'];
  filters.status = ['Running'];
  const result = filterAds(largeTestAds, filters);
  const endTime = Date.now();
  console.log(`  Complex Filter: ${result.length} ads found in ${endTime - startTime}ms`);
}

async function main() {
  console.log('🚀 Starting Comprehensive Filter Testing...\n');

  try {
    await testIndividualFilters();
    await testCombinedFilters();
    await testRealDatabaseData();
    await testPerformance();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
main(); 