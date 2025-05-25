
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import { SyncResult, CatalogSyncData } from "./types";

/**
 * Sync artist catalogs - updates song catalogs for active artists
 */
export const syncArtistCatalogs = async (): Promise<SyncResult> => {
  try {
    console.log('Starting artist catalog sync...');
    
    // Get artists with upcoming shows that need catalog updates
    const { data: artists } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        last_synced_at,
        shows!inner(id, date)
      `)
      .gte('shows.date', new Date().toISOString())
      .lt('last_synced_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Not synced in 7 days
      .limit(20); // Process 20 artists at a time

    if (!artists?.length) {
      return { success: true, message: 'No artists need catalog sync' };
    }

    let processed = 0;
    for (const artist of artists) {
      try {
        // Import artist's catalog
        await spotifyService.importArtistCatalog(artist.id);
        
        // Update last_synced_at
        await supabase
          .from('artists')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', artist.id);
        
        processed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error syncing catalog for artist ${artist.name}:`, error);
      }
    }

    return { 
      success: true, 
      message: `Synced catalogs for ${processed} artists`,
      data: { processed } as CatalogSyncData
    };
  } catch (error) {
    console.error('Error syncing artist catalogs:', error);
    return { success: false, message: 'Failed to sync artist catalogs' };
  }
};
