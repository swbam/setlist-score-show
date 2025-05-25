
import { SyncResult } from "./types";
import { syncTrendingShows } from "./trendingSync";
import { syncArtistCatalogs } from "./catalogSync";
import { importRecentSetlists } from "./setlistImport";
import { updateTrendingStats } from "./statsUpdate";

/**
 * Run all background sync operations
 */
export const runFullSync = async (): Promise<SyncResult[]> => {
  console.log('Starting full background sync...');
  
  const results = await Promise.allSettled([
    syncTrendingShows(),
    syncArtistCatalogs(),
    importRecentSetlists(),
    updateTrendingStats()
  ]);

  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : { success: false, message: 'Sync operation failed' }
  );
};

/**
 * Manual sync trigger for development/testing
 */
export const triggerManualSync = async (syncType: 'trending' | 'catalogs' | 'setlists' | 'stats' | 'full'): Promise<SyncResult | SyncResult[]> => {
  switch (syncType) {
    case 'trending':
      return await syncTrendingShows();
    case 'catalogs':
      return await syncArtistCatalogs();
    case 'setlists':
      return await importRecentSetlists();
    case 'stats':
      return await updateTrendingStats();
    case 'full':
      return await runFullSync();
    default:
      return { success: false, message: 'Invalid sync type' };
  }
};

// Export all sync functions
export { syncTrendingShows } from "./trendingSync";
export { syncArtistCatalogs } from "./catalogSync";
export { importRecentSetlists } from "./setlistImport";
export { updateTrendingStats } from "./statsUpdate";
export type { SyncResult } from "./types";
