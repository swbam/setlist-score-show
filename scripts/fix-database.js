const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDatabase() {
  console.log('Fixing database...')
  
  try {
    // Test connection
    const { data: test, error: testError } = await supabase
      .from('shows')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Database connection error:', testError)
      return
    }
    
    console.log('Database connected successfully')
    
    // Create RPC function
    console.log('Creating increment_vote_count function...')
    const { error: rpcError } = await supabase.rpc('query', {
      query: `
        CREATE OR REPLACE FUNCTION increment_vote_count(setlist_song_id UUID)
        RETURNS void AS $$
        BEGIN
          UPDATE setlist_songs
          SET vote_count = vote_count + 1
          WHERE id = setlist_song_id;
        END;
        $$ LANGUAGE plpgsql;
      `
    }).single()
    
    if (rpcError && !rpcError.message.includes('already exists')) {
      console.error('Error creating RPC function:', rpcError)
    } else {
      console.log('RPC function created successfully')
    }
    
    // Create trending calculation function
    console.log('Creating trending calculation function...')
    const { error: trendingFuncError } = await supabase.rpc('query', {
      query: `
        CREATE OR REPLACE FUNCTION calculate_trending_score(
          total_votes INT,
          unique_voters INT,
          days_until_show INT,
          view_count INT DEFAULT 0
        )
        RETURNS FLOAT AS $$
        DECLARE
          urgency_weight FLOAT := 1.0;
          engagement_weight FLOAT := 1.0;
          popularity_weight FLOAT := 1.0;
          score FLOAT;
        BEGIN
          IF days_until_show <= 7 THEN
            urgency_weight := 2.0;
          ELSIF days_until_show <= 14 THEN
            urgency_weight := 1.5;
          ELSIF days_until_show <= 30 THEN
            urgency_weight := 1.2;
          END IF;

          IF total_votes > 0 THEN
            engagement_weight := 1.0 + (unique_voters::FLOAT / total_votes::FLOAT);
          END IF;

          IF view_count > 1000 THEN
            popularity_weight := 1.5;
          ELSIF view_count > 500 THEN
            popularity_weight := 1.3;
          ELSIF view_count > 100 THEN
            popularity_weight := 1.1;
          END IF;

          score := (total_votes * urgency_weight * engagement_weight * popularity_weight);
          
          RETURN score;
        END;
        $$ LANGUAGE plpgsql;
      `
    }).single()
    
    if (trendingFuncError && !trendingFuncError.message.includes('already exists')) {
      console.error('Error creating trending function:', trendingFuncError)
    } else {
      console.log('Trending function created successfully')
    }
    
    // Create materialized view for trending shows
    console.log('Creating trending_shows_view...')
    const { error: viewError } = await supabase.rpc('query', {
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS trending_shows_view AS
        WITH show_stats AS (
          SELECT 
            s.id,
            s.date,
            s.title,
            s.status,
            s.view_count,
            s.artist_id,
            s.venue_id,
            COUNT(DISTINCT v.id) as total_votes,
            COUNT(DISTINCT v.user_id) as unique_voters,
            EXTRACT(DAY FROM (s.date - CURRENT_DATE)) as days_until_show
          FROM shows s
          LEFT JOIN setlists sl ON sl.show_id = s.id
          LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
          LEFT JOIN votes v ON v.setlist_song_id = ss.id
          WHERE s.status = 'upcoming'
            AND s.date >= CURRENT_DATE
            AND s.date <= CURRENT_DATE + INTERVAL '180 days'
          GROUP BY s.id
        )
        SELECT 
          ss.*,
          calculate_trending_score(
            ss.total_votes::INT,
            ss.unique_voters::INT,
            ss.days_until_show::INT,
            ss.view_count::INT
          ) as trending_score
        FROM show_stats ss
        WHERE ss.total_votes > 0 OR ss.view_count > 0
        ORDER BY trending_score DESC;
      `
    }).single()
    
    if (viewError && !viewError.message.includes('already exists')) {
      console.error('Error creating materialized view:', viewError)
    } else {
      console.log('Materialized view created successfully')
    }
    
    // Create regular view alias
    console.log('Creating trending_shows view alias...')
    const { error: aliasError } = await supabase.rpc('query', {
      query: `
        CREATE OR REPLACE VIEW trending_shows AS
        SELECT 
          id as show_id,
          date,
          title,
          status,
          view_count,
          artist_id,
          venue_id,
          total_votes::INT,
          unique_voters::INT,
          trending_score
        FROM trending_shows_view;
      `
    }).single()
    
    if (aliasError && !aliasError.message.includes('already exists')) {
      console.error('Error creating view alias:', aliasError)
    } else {
      console.log('View alias created successfully')
    }
    
    // Grant permissions
    console.log('Granting permissions...')
    const { error: grantError } = await supabase.rpc('query', {
      query: `
        GRANT SELECT ON trending_shows_view TO anon, authenticated;
        GRANT SELECT ON trending_shows TO anon, authenticated;
        GRANT EXECUTE ON FUNCTION increment_vote_count TO authenticated;
        GRANT EXECUTE ON FUNCTION calculate_trending_score TO anon, authenticated;
      `
    }).single()
    
    if (grantError) {
      console.error('Error granting permissions:', grantError)
    } else {
      console.log('Permissions granted successfully')
    }
    
    console.log('Database fixes complete!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixDatabase()