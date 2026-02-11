require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkStatus() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Count by media_status from Supabase (same DB the app uses)
    const [totalRes, successRes, pendingRes, processingRes, failedRes] = await Promise.all([
      supabase.from('ads').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('media_status', 'success'),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('media_status', 'pending'),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('media_status', 'processing'),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('media_status', 'failed')
    ]);

    if (totalRes.error) {
      console.error('❌ Status check failed:', totalRes.error.message);
      process.exit(1);
    }

    const totalAds = totalRes.count ?? 0;
    const counts = {
      success: successRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      processing: processingRes.count ?? 0,
      failed: failedRes.count ?? 0
    };

    console.log('\n📊 Media Processing Status (Supabase ads table):');
    const emoji = { pending: '⏳', processing: '🔄', success: '✅', failed: '❌' };
    ['success', 'pending', 'processing', 'failed'].forEach((status) => {
      const n = counts[status] || 0;
      if (n > 0 || status === 'success' || status === 'pending') {
        console.log(`   ${emoji[status] || '❓'} ${status}: ${n} ads`);
      }
    });

    const successCount = counts.success || 0;
    const remaining = (counts.pending || 0) + (counts.processing || 0) + (counts.failed || 0);
    const completionRate = totalAds > 0 ? ((successCount / totalAds) * 100).toFixed(1) : 0;

    console.log(`\n📋 Total ads: ${totalAds}`);
    console.log(`🎯 Successful: ${successCount}`);
    console.log(`⏳ Remaining: ${remaining} (pending + processing + failed)`);
    console.log(`📈 Success rate: ${completionRate}%`);

    if (counts.failed > 0) {
      const { data: failedAds, error: failedErr } = await supabase
        .from('ads')
        .select('library_id, media_error, media_retry_count')
        .eq('media_status', 'failed')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!failedErr && failedAds && failedAds.length > 0) {
        console.log('\n❌ Failed ads (why they failed):');
        const reasonCounts = {};
        failedAds.forEach((ad) => {
          const reason = ad.media_error || 'No error message';
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });
        Object.entries(reasonCounts).forEach(([reason, n]) => {
          console.log(`   • ${n}x ${reason}`);
        });
        console.log(`   (showing reasons for up to 30 failed; total failed: ${counts.failed})`);
      }
    }

    console.log('');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkStatus();
}

module.exports = { checkStatus };
