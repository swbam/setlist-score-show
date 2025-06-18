const fetch = require('node-fetch');

const CRON_SECRET = '6155002300';

async function triggerSync() {
  const functionUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw';
  
  console.log('🚀 Triggering existing top shows sync...\n');
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
        'apikey': anonKey
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sync completed successfully!');
      console.log('\n📊 Results:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Sync failed:', data);
    }
  } catch (error) {
    console.error('❌ Error calling sync function:', error.message);
  }
}

// Also trigger trending shows calculation
async function triggerTrending() {
  const functionUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/refresh_trending_shows';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw';
  
  console.log('\n🎯 Refreshing trending shows...\n');
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
        'apikey': anonKey
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Trending refresh completed!');
      console.log('\n📊 Results:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Trending refresh failed:', data);
    }
  } catch (error) {
    console.error('❌ Error calling trending function:', error.message);
  }
}

async function run() {
  await triggerSync();
  await triggerTrending();
}

run();