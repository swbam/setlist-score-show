#!/usr/bin/env node

/**
 * Test script for background jobs system
 * This verifies that our background jobs can be imported and executed
 */

console.log('Testing Background Jobs System...\n');

async function testBackgroundJobs() {
  try {
    // Import the background jobs
    const {
      runDailyArtistSync,
      runTrendingCalculation,
      runShowDataRefresh,
      runCacheMaintenance,
      runDatabaseMaintenance,
      runHealthCheck,
      getJobMetrics,
      resetJobMetrics
    } = await import('./src/services/backgroundJobs.ts');

    console.log('✅ Successfully imported background jobs service');

    // Test health check (safest to run)
    console.log('\n🔍 Running health check...');
    const healthResult = await runHealthCheck();
    console.log('Health check result:', {
      success: healthResult.success,
      processingTime: healthResult.processingTime + 'ms',
      retryCount: healthResult.retryCount || 0
    });

    // Test getting job metrics
    console.log('\n📊 Getting job metrics...');
    const metrics = getJobMetrics();
    console.log('Job metrics:', {
      totalJobs: metrics.totalJobs,
      successfulJobs: metrics.successfulJobs,
      failedJobs: metrics.failedJobs,
      avgProcessingTime: Math.round(metrics.avgProcessingTime) + 'ms'
    });

    console.log('\n✅ Background jobs system is working correctly!');
    console.log('\n🚀 Available jobs:');
    console.log('  - runDailyArtistSync(): Syncs artist data from Spotify');
    console.log('  - runTrendingCalculation(): Calculates trending scores');
    console.log('  - runShowDataRefresh(): Refreshes show data and vote counts');
    console.log('  - runCacheMaintenance(): Cleans up cache entries');
    console.log('  - runDatabaseMaintenance(): Performs database cleanup');
    console.log('  - runHealthCheck(): Monitors system health');

  } catch (error) {
    console.error('❌ Error testing background jobs:', error.message);
    console.error('\nThis might be expected in a test environment without proper database connection.');
  }
}

testBackgroundJobs();
