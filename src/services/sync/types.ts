
export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface TrendingSyncData {
  processed: number;
}

export interface CatalogSyncData {
  processed: number;
}

export interface SetlistSyncData {
  processed: number;
}

export interface TrendingStatsData {
  analyzed: number;
}
