
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

export async function syncAll(): Promise<SyncResult[]> {
  console.log('Starting full sync of all data...');
  
  const results: SyncResult[] = [];
  
  // Run all sync operations
  const [
    catalogResult,
    trendingResult,
    setlistResult,
    statsResult
  ] = await Promise.all([
    syncArtistCatalogs().catch(error => ({ 
      success: false, 
      message: `Catalog sync failed: ${error.message}`
    })),
    syncTrendingShows().catch(error => ({ 
      success: false, 
      message: `Trending sync failed: ${error.message}`
    })),
    importRecentSetlists().then(count => ({ 
      success: true, 
      message: `Imported ${count} recent setlists`
    })).catch(error => ({ 
      success: false, 
      message: `Setlist import failed: ${error.message}`
    })),
    updateTrendingStats().catch(error => ({ 
      success: false, 
      message: `Stats update failed: ${error.message}`
    }))
  ]);
  
  results.push(catalogResult, trendingResult, setlistResult, statsResult);
  
  console.log('Full sync completed');
  return results;
}

export async function syncArtistData(artistId: string): Promise<SyncResult> {
  console.log(`Syncing data for artist: ${artistId}`);
  
  try {
    const { syncArtistCatalog } = await import("@/services/catalog");
    const result = await syncArtistCatalog(artistId);
    return {
      success: result,
      message: result ? 'Artist data synced successfully' : 'Failed to sync artist data'
    };
  } catch (error) {
    console.error(`Error syncing artist ${artistId}:`, error);
    return {
      success: false,
      message: `Failed to sync artist: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
