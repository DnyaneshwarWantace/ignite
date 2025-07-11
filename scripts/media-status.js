const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMediaStatus() {
  console.log('📊 Media Processing Status Report\n');
  
  try {
    // Get overall status breakdown
    const statusCounts = await prisma.ad.groupBy({
      by: ['mediaStatus'],
      _count: {
        mediaStatus: true
      }
    });
    
    const totalAds = await prisma.ad.count();
    
    console.log('🔢 Overall Status:');
    statusCounts.forEach(status => {
      const percentage = ((status._count.mediaStatus / totalAds) * 100).toFixed(1);
      console.log(`   ${getStatusEmoji(status.mediaStatus)} ${status.mediaStatus.toUpperCase()}: ${status._count.mediaStatus} (${percentage}%)`);
    });
    
    console.log(`\n📋 Total Ads: ${totalAds}`);
    
    // Get brand breakdown
    const brandBreakdown = await prisma.brand.findMany({
      select: {
        name: true,
        _count: {
          select: {
            ads: true
          }
        },
        ads: {
          select: {
            mediaStatus: true
          }
        }
      }
    });
    
    if (brandBreakdown.length > 0) {
      console.log('\n🏢 Brand Breakdown:');
      brandBreakdown.forEach(brand => {
        const brandStats = {
          pending: 0,
          processing: 0,
          success: 0,
          failed: 0
        };
        
        brand.ads.forEach(ad => {
          brandStats[ad.mediaStatus] = (brandStats[ad.mediaStatus] || 0) + 1;
        });
        
        console.log(`\n   ${brand.name} (${brand._count.ads} ads):`);
        Object.entries(brandStats).forEach(([status, count]) => {
          if (count > 0) {
            console.log(`     ${getStatusEmoji(status)} ${status}: ${count}`);
          }
        });
      });
    }
    
    // Get recent activity
    const recentSuccesses = await prisma.ad.findMany({
      where: {
        mediaStatus: 'success',
        mediaDownloadedAt: {
          not: null
        }
      },
      select: {
        libraryId: true,
        mediaDownloadedAt: true,
        brand: {
          select: { name: true }
        }
      },
      orderBy: {
        mediaDownloadedAt: 'desc'
      },
      take: 5
    });
    
    if (recentSuccesses.length > 0) {
      console.log('\n🕒 Recent Successes:');
      recentSuccesses.forEach(ad => {
        const timeAgo = getTimeAgo(ad.mediaDownloadedAt);
        console.log(`   ✅ ${ad.brand?.name || 'Unknown'} - ${ad.libraryId} (${timeAgo})`);
      });
    }
    
    // Get pending count
    const pendingCount = await prisma.ad.count({
      where: { mediaStatus: 'pending' }
    });
    
    if (pendingCount > 0) {
      console.log(`\n⏳ ${pendingCount} ads ready for processing`);
      console.log('   Run: npm run media-smart');
    } else {
      console.log('\n✨ All ads processed!');
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getStatusEmoji(status) {
  const emojis = {
    pending: '⏳',
    processing: '🔄', 
    success: '✅',
    failed: '❌'
  };
  return emojis[status] || '❓';
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

checkMediaStatus(); 