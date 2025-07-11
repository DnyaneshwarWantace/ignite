const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to format time duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Helper function to get emoji for status
function getStatusEmoji(status) {
  const emojis = {
    pending: '⏳',
    processing: '🔄',
    success: '✅',
    failed: '❌'
  };
  return emojis[status] || '❓';
}

// Helper function to format percentage
function formatPercentage(value, total) {
  if (total === 0) return '0.0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

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
    
    // Print overall status
    console.log('🔢 Overall Status:');
    statusCounts.forEach(status => {
      const percentage = formatPercentage(status._count.mediaStatus, totalAds);
      console.log(`   ${getStatusEmoji(status.mediaStatus)} ${status.mediaStatus.toUpperCase()}: ${status._count.mediaStatus} (${percentage})`);
    });
    
    // Get processing efficiency stats
    const successfulAds = await prisma.ad.findMany({
      where: { mediaStatus: 'success' },
      select: {
        mediaDownloadedAt: true,
        createdAt: true,
        localImageUrl: true,
        localVideoUrl: true
      }
    });

    const totalSuccessful = successfulAds.length;
    const imagesProcessed = successfulAds.filter(ad => ad.localImageUrl).length;
    const videosProcessed = successfulAds.filter(ad => ad.localVideoUrl).length;
    
    console.log('\n📈 Processing Efficiency:');
    console.log(`   🖼️ Images Processed: ${imagesProcessed}`);
    console.log(`   🎥 Videos Processed: ${videosProcessed}`);
    
    if (totalSuccessful > 0) {
      const processingTimes = successfulAds
        .filter(ad => ad.mediaDownloadedAt)
        .map(ad => ad.mediaDownloadedAt.getTime() - ad.createdAt.getTime());
      
      const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const minProcessingTime = Math.min(...processingTimes);
      const maxProcessingTime = Math.max(...processingTimes);
      
      console.log('\n⏱️ Processing Times:');
      console.log(`   Average: ${formatDuration(avgProcessingTime)}`);
      console.log(`   Fastest: ${formatDuration(minProcessingTime)}`);
      console.log(`   Slowest: ${formatDuration(maxProcessingTime)}`);
    }

    // Get retry statistics
    const retryStats = await prisma.ad.groupBy({
      by: ['mediaRetryCount'],
      _count: true,
      where: {
        mediaRetryCount: { gt: 0 }
      }
    });

    if (retryStats.length > 0) {
      console.log('\n🔄 Retry Statistics:');
      retryStats.forEach(stat => {
        console.log(`   ${stat.mediaRetryCount} retries: ${stat._count} ads`);
      });
    }

    // Get recent activity
    const recentActivity = await prisma.ad.findMany({
      where: {
        OR: [
          { mediaStatus: 'success' },
          { mediaStatus: 'failed' }
        ],
        mediaDownloadedAt: { not: null }
      },
      orderBy: { mediaDownloadedAt: 'desc' },
      take: 5,
      select: {
        libraryId: true,
        mediaStatus: true,
        mediaDownloadedAt: true,
        mediaError: true
      }
    });

    if (recentActivity.length > 0) {
      console.log('\n🕒 Recent Activity:');
      recentActivity.forEach(activity => {
        const timeAgo = formatDuration(Date.now() - activity.mediaDownloadedAt.getTime());
        const status = getStatusEmoji(activity.mediaStatus);
        console.log(`   ${status} ${activity.libraryId} (${timeAgo} ago)`);
        if (activity.mediaStatus === 'failed' && activity.mediaError) {
          console.log(`     Error: ${activity.mediaError}`);
        }
      });
    }

    // Get pending items that need attention
    const pendingCount = await prisma.ad.count({
      where: {
        mediaStatus: 'pending'
      }
    });

    const stuckProcessing = await prisma.ad.count({
      where: {
        mediaStatus: 'processing',
        updatedAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000) // Stuck for more than 30 minutes
        }
      }
    });

    if (pendingCount > 0 || stuckProcessing > 0) {
      console.log('\n⚠️ Needs Attention:');
      if (pendingCount > 0) {
        console.log(`   ⏳ ${pendingCount} ads waiting to be processed`);
        console.log('   💡 Run media worker to process these ads');
      }
      if (stuckProcessing > 0) {
        console.log(`   ⚠️ ${stuckProcessing} ads stuck in processing state`);
        console.log('   💡 These may need manual intervention');
      }
    }

  } catch (error) {
    console.error('❌ Error checking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the status check
checkMediaStatus(); 