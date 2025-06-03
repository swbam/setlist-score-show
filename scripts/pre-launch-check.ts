#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import chalk from 'chalk';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ailrmwtahifvstpfhbgn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '2946864dc822469b9c672292ead45f43';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b';
const SETLISTFM_API_KEY = process.env.SETLISTFM_API_KEY || 'xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL';

interface CheckResult {
  name: string;
  passed: boolean;
  error?: string;
  warning?: string;
}

class PreLaunchChecker {
  private results: CheckResult[] = [];
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  async runAllChecks() {
    console.log(chalk.blue.bold('\n🚀 Running Pre-Launch Checks...\n'));
    
    // Database checks
    await this.checkDatabaseConnectivity();
    await this.checkRequiredTables();
    await this.checkDatabaseFunctions();
    await this.checkIndexes();
    
    // API checks
    await this.checkSpotifyAPI();
    await this.checkTicketmasterAPI();
    await this.checkSetlistFmAPI();
    
    // Real-time checks
    await this.checkRealtimeConnection();
    
    // Data integrity checks
    await this.checkDataIntegrity();
    
    // Performance checks
    await this.checkQueryPerformance();
    
    // Display results
    this.displayResults();
  }
  
  private async checkDatabaseConnectivity() {
    const check: CheckResult = { name: 'Database Connectivity', passed: false };
    
    try {
      const { error } = await this.supabase
        .from('artists')
        .select('id')
        .limit(1);
        
      if (error) throw error;
      check.passed = true;
    } catch (error: any) {
      check.error = error.message;
    }
    
    this.results.push(check);
  }
  
  private async checkRequiredTables() {
    const requiredTables = [
      'artists', 'venues', 'shows', 'songs', 'setlists', 'setlist_songs',
      'votes', 'users', 'user_artists', 'vote_limits', 'user_vote_stats',
      'played_setlists', 'played_setlist_songs', 'artist_import_progress'
    ];
    
    for (const table of requiredTables) {
      const check: CheckResult = { name: `Table: ${table}`, passed: false };
      
      try {
        const { error } = await this.supabase
          .from(table)
          .select('*')
          .limit(0);
          
        if (error) throw error;
        check.passed = true;
      } catch (error: any) {
        check.error = `Table missing or inaccessible: ${error.message}`;
      }
      
      this.results.push(check);
    }
  }
  
  private async checkDatabaseFunctions() {
    const requiredFunctions = [
      'vote_for_song',
      'create_setlist_with_songs',
      'match_song_similarity',
      'refresh_trending_shows',
      'get_user_vote_stats'
    ];
    
    for (const func of requiredFunctions) {
      const check: CheckResult = { name: `Function: ${func}`, passed: false };
      
      try {
        const { data, error } = await this.supabase.rpc(func, {});
        
        // Some functions require parameters, so we expect an error
        // but not a "function does not exist" error
        if (error && !error.message.includes('does not exist')) {
          check.passed = true;
        } else if (!error) {
          check.passed = true;
        } else {
          throw new Error('Function does not exist');
        }
      } catch (error: any) {
        check.error = `Function missing: ${error.message}`;
      }
      
      this.results.push(check);
    }
  }
  
  private async checkIndexes() {
    const check: CheckResult = { name: 'Database Indexes', passed: false };
    
    try {
      const { data, error } = await this.supabase.rpc('get_index_count', {});
      
      if (error) {
        // Function might not exist, check manually
        const { data: indexes } = await this.supabase
          .from('pg_indexes')
          .select('indexname')
          .eq('schemaname', 'public');
          
        if (indexes && indexes.length > 20) {
          check.passed = true;
        } else {
          check.warning = 'Low number of indexes detected';
        }
      } else {
        check.passed = true;
      }
    } catch (error: any) {
      check.warning = 'Could not verify indexes';
    }
    
    this.results.push(check);
  }
  
  private async checkSpotifyAPI() {
    const check: CheckResult = { name: 'Spotify API', passed: false };
    
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });
      
      if (response.ok) {
        check.passed = true;
      } else {
        check.error = `API returned ${response.status}`;
      }
    } catch (error: any) {
      check.error = error.message;
    }
    
    this.results.push(check);
  }
  
  private async checkTicketmasterAPI() {
    const check: CheckResult = { name: 'Ticketmaster API', passed: false };
    
    try {
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events?apikey=${TICKETMASTER_API_KEY}&size=1`
      );
      
      if (response.ok) {
        check.passed = true;
      } else {
        check.error = `API returned ${response.status}`;
      }
    } catch (error: any) {
      check.error = error.message;
    }
    
    this.results.push(check);
  }
  
  private async checkSetlistFmAPI() {
    const check: CheckResult = { name: 'Setlist.fm API', passed: false };
    
    try {
      const response = await fetch(
        'https://api.setlist.fm/rest/1.0/search/setlists?artistName=test&p=1',
        {
          headers: {
            'Accept': 'application/json',
            'x-api-key': SETLISTFM_API_KEY
          }
        }
      );
      
      if (response.ok) {
        check.passed = true;
      } else {
        check.error = `API returned ${response.status}`;
      }
    } catch (error: any) {
      check.error = error.message;
    }
    
    this.results.push(check);
  }
  
  private async checkRealtimeConnection() {
    const check: CheckResult = { name: 'Real-time Subscriptions', passed: false };
    
    try {
      const channel = this.supabase.channel('test');
      
      const connected = await new Promise<boolean>((resolve) => {
        channel.subscribe((status) => {
          resolve(status === 'SUBSCRIBED');
        });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      });
      
      await channel.unsubscribe();
      
      if (connected) {
        check.passed = true;
      } else {
        check.error = 'Failed to establish real-time connection';
      }
    } catch (error: any) {
      check.error = error.message;
    }
    
    this.results.push(check);
  }
  
  private async checkDataIntegrity() {
    const checks = [
      {
        name: 'Orphaned Votes',
        query: `
          SELECT COUNT(*) as count 
          FROM votes v 
          LEFT JOIN setlist_songs ss ON v.setlist_song_id = ss.id 
          WHERE ss.id IS NULL
        `
      },
      {
        name: 'Shows Without Artists',
        query: `
          SELECT COUNT(*) as count 
          FROM shows s 
          LEFT JOIN artists a ON s.artist_id = a.id 
          WHERE a.id IS NULL
        `
      },
      {
        name: 'Songs Without Artists',
        query: `
          SELECT COUNT(*) as count 
          FROM songs s 
          LEFT JOIN artists a ON s.artist_id = a.id 
          WHERE a.id IS NULL
        `
      }
    ];
    
    for (const integrityCheck of checks) {
      const check: CheckResult = { 
        name: `Data Integrity: ${integrityCheck.name}`, 
        passed: false 
      };
      
      try {
        const { data, error } = await this.supabase
          .rpc('execute_query', { query: integrityCheck.query });
          
        if (error) {
          // Try direct query
          check.warning = 'Could not verify data integrity';
        } else if (data?.[0]?.count > 0) {
          check.warning = `Found ${data[0].count} orphaned records`;
          check.passed = true; // Pass with warning
        } else {
          check.passed = true;
        }
      } catch (error: any) {
        check.warning = 'Could not verify data integrity';
      }
      
      this.results.push(check);
    }
  }
  
  private async checkQueryPerformance() {
    const check: CheckResult = { name: 'Query Performance', passed: false };
    
    try {
      const start = Date.now();
      
      // Run a complex query similar to production workload
      const { error } = await this.supabase
        .from('shows')
        .select(`
          *,
          artists(*),
          venues(*),
          setlists(
            setlist_songs(
              *,
              songs(*)
            )
          )
        `)
        .gte('date', new Date().toISOString())
        .limit(10);
        
      const duration = Date.now() - start;
      
      if (!error && duration < 1000) {
        check.passed = true;
      } else if (!error && duration < 3000) {
        check.passed = true;
        check.warning = `Query took ${duration}ms (consider optimization)`;
      } else {
        check.error = error?.message || `Query too slow: ${duration}ms`;
      }
    } catch (error: any) {
      check.error = error.message;
    }
    
    this.results.push(check);
  }
  
  private displayResults() {
    console.log(chalk.blue.bold('\n📊 Pre-Launch Check Results:\n'));
    
    let passedCount = 0;
    let warningCount = 0;
    let failedCount = 0;
    
    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      const color = result.passed ? (result.warning ? 'yellow' : 'green') : 'red';
      
      console.log(chalk[color](`${icon} ${result.name}`));
      
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`));
      }
      
      if (result.warning) {
        console.log(chalk.yellow(`   Warning: ${result.warning}`));
      }
      
      if (result.passed && !result.warning) {
        passedCount++;
      } else if (result.passed && result.warning) {
        warningCount++;
      } else {
        failedCount++;
      }
    }
    
    console.log(chalk.blue.bold('\n📈 Summary:'));
    console.log(chalk.green(`   ✅ Passed: ${passedCount}`));
    console.log(chalk.yellow(`   ⚠️  Warnings: ${warningCount}`));
    console.log(chalk.red(`   ❌ Failed: ${failedCount}`));
    
    const readyForLaunch = failedCount === 0;
    
    if (readyForLaunch) {
      console.log(chalk.green.bold('\n✨ Application is ready for launch! 🚀'));
      if (warningCount > 0) {
        console.log(chalk.yellow('   (Consider addressing warnings for optimal performance)'));
      }
    } else {
      console.log(chalk.red.bold('\n⚠️  Application is NOT ready for launch!'));
      console.log(chalk.red('   Please fix all failed checks before deploying to production.'));
      process.exit(1);
    }
  }
}

// Run checks
const checker = new PreLaunchChecker();
checker.runAllChecks().catch(console.error);