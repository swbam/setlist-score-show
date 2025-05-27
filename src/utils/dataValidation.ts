
import { z } from 'zod';

// Database entity schemas
export const ArtistSchema = z.object({
  id: z.string().min(1, 'Artist ID is required'),
  name: z.string().min(1, 'Artist name is required').max(255, 'Artist name too long'),
  image_url: z.string().url().optional().nullable(),
  popularity: z.number().int().min(0).max(100).optional(),
  genres: z.array(z.string()).optional(),
  spotify_url: z.string().url().optional().nullable(),
  last_synced_at: z.string().datetime().optional()
});

export const VenueSchema = z.object({
  id: z.string().min(1, 'Venue ID is required'),
  name: z.string().min(1, 'Venue name is required').max(255, 'Venue name too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().max(50, 'State name too long').optional().nullable(),
  country: z.string().min(1, 'Country is required').max(50, 'Country name too long'),
  address: z.string().max(500, 'Address too long').optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable()
});

export const ShowSchema = z.object({
  id: z.string().min(1, 'Show ID is required'),
  artist_id: z.string().min(1, 'Artist ID is required'),
  venue_id: z.string().min(1, 'Venue ID is required'),
  name: z.string().max(255, 'Show name too long').optional().nullable(),
  date: z.string().datetime('Invalid date format'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional().nullable(),
  status: z.enum(['scheduled', 'postponed', 'canceled']),
  ticketmaster_url: z.string().url().optional().nullable(),
  view_count: z.number().int().min(0).default(0)
});

export const SongSchema = z.object({
  id: z.string().min(1, 'Song ID is required'),
  artist_id: z.string().min(1, 'Artist ID is required'),
  name: z.string().min(1, 'Song name is required').max(255, 'Song name too long'),
  album: z.string().min(1, 'Album name is required').max(255, 'Album name too long'),
  duration_ms: z.number().int().min(0, 'Duration must be positive'),
  popularity: z.number().int().min(0).max(100),
  spotify_url: z.string().url('Invalid Spotify URL')
});

export const SetlistSongSchema = z.object({
  id: z.string().uuid('Invalid setlist song ID'),
  setlist_id: z.string().uuid('Invalid setlist ID'),
  song_id: z.string().min(1, 'Song ID is required'),
  position: z.number().int().min(1, 'Position must be positive'),
  votes: z.number().int().min(0, 'Votes cannot be negative')
});

export const VoteSchema = z.object({
  id: z.string().uuid('Invalid vote ID'),
  user_id: z.string().uuid('Invalid user ID'),
  setlist_song_id: z.string().uuid('Invalid setlist song ID'),
  created_at: z.string().datetime()
});

// API request schemas
export const VoteRequestSchema = z.object({
  setlist_song_id: z.string().uuid('Invalid setlist song ID')
});

export const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  location: z.string().max(100, 'Location too long').optional(),
  dateRange: z.string().max(50, 'Date range too long').optional(),
  genre: z.string().max(50, 'Genre too long').optional(),
  sortBy: z.enum(['relevance', 'date', 'popularity', 'votes']).optional()
});

export const AddSongRequestSchema = z.object({
  setlist_id: z.string().uuid('Invalid setlist ID'),
  song_id: z.string().min(1, 'Song ID is required')
});

// Validation utilities
export function validateEntity<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

export function validatePartialEntity<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: Partial<T> } | { success: false; errors: string[] } {
  try {
    // Use deepPartial() for recursive partial validation
    const partialSchema = schema.deepPartial();
    const validatedData = partialSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

// Data sanitization
export function sanitizeSearchQuery(query: string): string {
  // Remove special characters that could be problematic
  return query
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .trim()
    .substring(0, 100); // Limit length
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
}

// Rate limiting validation
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier)!;
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (validRequests.length >= config.maxRequests) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  
  return true;
}

// Data integrity checks
export function validateShowDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);
  
  return date >= now && date <= oneYearFromNow;
}

export function validateVoteIntegrity(userId: string, setlistSongId: string, existingVotes: string[]): boolean {
  // Check if user already voted for this song
  return !existingVotes.includes(`${userId}:${setlistSongId}`);
}

export function validateSetlistSongOrder(songs: { position: number; id: string }[]): boolean {
  const positions = songs.map(s => s.position).sort((a, b) => a - b);
  
  // Check for duplicates and gaps
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== i + 1) {
      return false;
    }
  }
  
  return true;
}

// Export types for use in other files
export type Artist = z.infer<typeof ArtistSchema>;
export type Venue = z.infer<typeof VenueSchema>;
export type Show = z.infer<typeof ShowSchema>;
export type Song = z.infer<typeof SongSchema>;
export type SetlistSong = z.infer<typeof SetlistSongSchema>;
export type Vote = z.infer<typeof VoteSchema>;
export type VoteRequest = z.infer<typeof VoteRequestSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type AddSongRequest = z.infer<typeof AddSongRequestSchema>;
