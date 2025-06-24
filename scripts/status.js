const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const statusBreakdown = await prisma.ad.groupBy({
      by: ['mediaStatus'],
      _count: { mediaStatus: true }
    });
    
    console.log('📊 Media Processing Status:');
    statusBreakdown.forEach(status => {
      const emoji = {
        'pending': '⏳',
        'processing': '🔄',
        'success': '✅',
        'failed': '❌'
      }[status.mediaStatus] || '❓';
      
      console.log(`   ${emoji} ${status.mediaStatus}: ${status._count.mediaStatus} ads`);
    });
    
    const successCount = statusBreakdown.find(s => s.mediaStatus === 'success')?._count.mediaStatus || 0;
    const totalAds = statusBreakdown.reduce((sum, s) => sum + s._count.mediaStatus, 0);
    const completionRate = totalAds > 0 ? ((successCount / totalAds) * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 Success rate: ${completionRate}% (${successCount}/${totalAds})`);
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkStatus();
}

module.exports = { checkStatus }; 