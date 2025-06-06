import { PrismaClient } from '@setlist/database';
import { Redis } from 'ioredis';
import { SupabaseClient } from '@supabase/supabase-js';
import { SpotifyService } from '../lib/spotify';
import { TicketmasterClient } from '../lib/ticketmaster';
import { SetlistFmClient } from '../lib/setlistfm';

declare module 'fastify' {
  export interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis | null; // redis can be null if REDIS_URL is not set
    supabase: SupabaseClient;
    spotify: SpotifyService;
    ticketmaster: TicketmasterClient;
    setlistfm: SetlistFmClient;
  }
}