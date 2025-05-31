import { createClient } from '@supabase/supabase-js';
import { importFullArtistCatalog } from '../../src/services/spotify';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: Request) {
  // Verify cron secret
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get artists needing update (not synced in 7 days)
  const { data: artists } = await supabase
    .from('artists')
    .select('id')
    .or('last_synced_at.is.null,last_synced_at.lt.now() - interval \'7 days\'')
    .limit(10);

  for (const artist of artists || []) {
    await importFullArtistCatalog(artist.id);
  }

  return new Response('OK');
}
