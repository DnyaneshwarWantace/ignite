const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock the filtering functions (copy from adFiltering.ts)
function getAdStatus(ad) {
  try {
    const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
    
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
    return ['Running']; // Default to running if can't determine
  }
}

function getAdLanguage(ad) {
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
    
    // Debug: Log the text being analyzed
    console.log(`🔍 Analyzing text for ad ${ad.id}:`, text.substring(0, 100) + '...');
    
    // Check for specific character ranges
    if (/[\u0600-\u06FF]/.test(text)) {
      console.log(`✅ Arabic detected for ad ${ad.id}`);
      return ['Arabic'];
    }
    if (/[\u4E00-\u9FFF]/.test(text)) {
      console.log(`✅ Chinese detected for ad ${ad.id}`);
      return ['Chinese'];
    }
    if (/[ñáéíóúü]/i.test(text)) {
      console.log(`✅ Spanish detected for ad ${ad.id}`);
      return ['Spanish'];
    }
    if (/[àâçéèêëîïôûùüÿ]/i.test(text)) {
      console.log(`✅ French detected for ad ${ad.id}`);
      return ['French'];
    }
    
    console.log(`✅ English detected for ad ${ad.id} (default)`);
    return ['English']; // Default to English for Latin script
  } catch (e) {
    console.error(`❌ Error in getAdLanguage for ad ${ad.id}:`, e);
    return ['English'];
  }
}

function filterAds(ads, filters) {
  if (!ads || ads.length === 0) return [];
  
  let filtered = ads;
  
  // Apply status filter
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
    console.log('🔍 Applying status filter:', filters.status);
    console.log('📊 Total ads before status filter:', filtered.length);
    
    filtered = filtered.filter((ad) => {
      const adStatus = getAdStatus(ad);
      const matches = filters.status.some(status => adStatus.includes(status));
      console.log(`  Ad ${ad.id}: status=${adStatus}, matches=${matches}`);
      return matches;
    });
    
    console.log('📊 Total ads after status filter:', filtered.length);
  }
  
  // Apply language filter
  if (filters.language && Array.isArray(filters.language) && filters.language.length > 0) {
    console.log('🔍 Applying language filter:', filters.language);
    console.log('📊 Total ads before language filter:', filtered.length);
    
    filtered = filtered.filter((ad) => {
      const adLanguages = getAdLanguage(ad);
      const matches = filters.language.some(language => adLanguages.includes(language));
      console.log(`  Ad ${ad.id}: languages=${adLanguages}, matches=${matches}`);
      return matches;
    });
    
    console.log('📊 Total ads after language filter:', filtered.length);
  }
  
  return filtered;
}

async function testFiltering() {
  try {
    console.log('🧪 Starting filtering test...\n');
    
    // Get some sample ads from database
    const ads = await prisma.ad.findMany({
      include: {
        transcript: true,
        brand: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (ads.length === 0) {
      console.log('❌ No ads found in database. Please add some ads first.');
      return;
    }
    
    console.log(`📊 Found ${ads.length} ads for testing\n`);
    
    // Test 1: Status filtering
    console.log('=== TEST 1: STATUS FILTERING ===');
    const statusFilters = [
      { status: ['Running'] },
      { status: ['Not Running'] },
      { status: ['Running', 'Not Running'] }
    ];
    
    for (const filter of statusFilters) {
      console.log(`\n🔍 Testing filter: ${JSON.stringify(filter)}`);
      const result = filterAds(ads, filter);
      console.log(`✅ Result: ${result.length} ads found`);
      
      // Show sample results
      if (result.length > 0) {
        console.log('📋 Sample ads:');
        result.slice(0, 3).forEach(ad => {
          const status = getAdStatus(ad);
          console.log(`  - ${ad.id}: ${status}`);
        });
      }
    }
    
    // Test 2: Language filtering
    console.log('\n=== TEST 2: LANGUAGE FILTERING ===');
    const languageFilters = [
      { language: ['English'] },
      { language: ['Arabic'] },
      { language: ['Spanish'] },
      { language: ['English', 'Spanish'] }
    ];
    
    for (const filter of languageFilters) {
      console.log(`\n🔍 Testing filter: ${JSON.stringify(filter)}`);
      const result = filterAds(ads, filter);
      console.log(`✅ Result: ${result.length} ads found`);
      
      // Show sample results
      if (result.length > 0) {
        console.log('📋 Sample ads:');
        result.slice(0, 3).forEach(ad => {
          const language = getAdLanguage(ad);
          console.log(`  - ${ad.id}: ${language}`);
        });
      }
    }
    
    // Test 3: Combined filtering
    console.log('\n=== TEST 3: COMBINED FILTERING ===');
    const combinedFilters = [
      { status: ['Running'], language: ['English'] },
      { status: ['Not Running'], language: ['English'] }
    ];
    
    for (const filter of combinedFilters) {
      console.log(`\n🔍 Testing filter: ${JSON.stringify(filter)}`);
      const result = filterAds(ads, filter);
      console.log(`✅ Result: ${result.length} ads found`);
      
      // Show sample results
      if (result.length > 0) {
        console.log('📋 Sample ads:');
        result.slice(0, 3).forEach(ad => {
          const status = getAdStatus(ad);
          const language = getAdLanguage(ad);
          console.log(`  - ${ad.id}: status=${status}, language=${language}`);
        });
      }
    }
    
    // Test 4: Analyze all ads
    console.log('\n=== TEST 4: ANALYZE ALL ADS ===');
    const statusCounts = { 'Running': 0, 'Not Running': 0 };
    const languageCounts = { 'English': 0, 'Arabic': 0, 'Spanish': 0, 'French': 0, 'Chinese': 0 };
    
    ads.forEach(ad => {
      const status = getAdStatus(ad);
      const language = getAdLanguage(ad);
      
      status.forEach(s => {
        if (statusCounts[s] !== undefined) statusCounts[s]++;
      });
      
      language.forEach(l => {
        if (languageCounts[l] !== undefined) languageCounts[l]++;
      });
    });
    
    console.log('📊 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} ads`);
    });
    
    console.log('📊 Language distribution:');
    Object.entries(languageCounts).forEach(([language, count]) => {
      console.log(`  ${language}: ${count} ads`);
    });
    
    console.log('\n✅ Filtering test completed!');
    
    // Test 5: Find Spanish ads specifically
    console.log('\n=== TEST 5: FIND SPANISH ADS ===');
    const spanishAds = [];
    
    ads.forEach(ad => {
      const language = getAdLanguage(ad);
      if (language.includes('Spanish')) {
        spanishAds.push(ad);
      }
    });
    
    console.log(`📊 Found ${spanishAds.length} Spanish ads`);
    
    if (spanishAds.length > 0) {
      console.log('📋 Spanish ads found:');
      spanishAds.slice(0, 5).forEach(ad => {
        try {
          const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
          const snapshot = content?.snapshot || {};
          const text = [
            snapshot.body?.text,
            snapshot.title,
            snapshot.caption,
            snapshot.link_description,
            ad.text,
            ad.headline,
            ad.description
          ].filter(Boolean).join(' ');
          
          console.log(`  - ${ad.id}: "${text.substring(0, 100)}..."`);
        } catch (e) {
          console.log(`  - ${ad.id}: Error parsing content`);
        }
      });
    } else {
      console.log('❌ No Spanish ads found. Let\'s check some ads manually:');
      
      // Check first 5 ads manually
      ads.slice(0, 5).forEach(ad => {
        try {
          const content = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
          const snapshot = content?.snapshot || {};
          const text = [
            snapshot.body?.text,
            snapshot.title,
            snapshot.caption,
            snapshot.link_description,
            ad.text,
            ad.headline,
            ad.description
          ].filter(Boolean).join(' ');
          
          console.log(`  Ad ${ad.id}: "${text.substring(0, 100)}..."`);
          
          // Check for Spanish characters manually
          const hasSpanishChars = /[ñáéíóúü]/i.test(text);
          console.log(`    Has Spanish chars: ${hasSpanishChars}`);
          
        } catch (e) {
          console.log(`  Ad ${ad.id}: Error parsing content`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFiltering(); 