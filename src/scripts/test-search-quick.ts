#!/usr/bin/env node
import * as searchService from '../services/search';

async function quickTest() {
  console.log('🔍 Quick Search Test\n');
  
  const queries = ['Taylor', 'Drake', 'Ed'];
  
  for (const query of queries) {
    console.log(`Searching for: "${query}"`);
    const start = Date.now();
    
    try {
      const results = await searchService.searchArtistsAndShows(query);
      const elapsed = Date.now() - start;
      
      console.log(`✅ Found in ${elapsed}ms:`);
      console.log(`   - ${results.artists.length} artists`);
      console.log(`   - ${results.shows.length} shows`);
      
      if (results.artists.length > 0) {
        console.log(`   First artist: ${results.artists[0].name}`);
      }
      if (results.shows.length > 0) {
        console.log(`   First show: ${results.shows[0].name}`);
      }
    } catch (error) {
      console.error(`❌ Error:`, error.message);
    }
    
    console.log('');
  }
}

quickTest().catch(console.error);