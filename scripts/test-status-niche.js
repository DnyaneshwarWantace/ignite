const { PrismaClient } = require('@prisma/client');

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

const prisma = new PrismaClient();

async function testStatusAndNiche() {
  console.log('🔄 Testing Status and Niche Filters...\n');

  try {
    const ads = await prisma.ad.findMany({
      take: 10,
      include: {
        brand: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${ads.length} ads to test\n`);

    ads.forEach((ad, index) => {
      console.log(`\n--- Ad ${index + 1}: ${ad.id} ---`);
      console.log(`Brand: ${ad.brand?.name || 'Unknown'}`);
      
      try {
        const content = JSON.parse(ad.content);
        
        // Test status
        const status = getAdStatus(ad);
        console.log(`Status: ${status.join(', ')} (is_active: ${content.is_active})`);
        
        // Test niche
        const niche = getAdNiche(ad);
        console.log(`Niche: ${niche.join(', ')}`);
        console.log(`Page categories: ${content.snapshot?.page_categories?.join(', ') || 'None'}`);
        
        // Test status filter
        const statusFilters = ['Running', 'Not Running'];
        statusFilters.forEach(statusFilter => {
          const matches = status.includes(statusFilter);
          console.log(`  Status ${statusFilter}: ${matches ? '✅' : '❌'}`);
        });
        
        // Test niche filter
        const nicheFilters = ['Fashion', 'Beauty', 'Automotive', 'App/Software'];
        nicheFilters.forEach(nicheFilter => {
          const matches = niche.includes(nicheFilter);
          console.log(`  Niche ${nicheFilter}: ${matches ? '✅' : '❌'}`);
        });
        
      } catch (e) {
        console.log('❌ Error parsing content:', e.message);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStatusAndNiche(); 