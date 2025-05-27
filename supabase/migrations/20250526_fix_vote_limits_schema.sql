-- Fix vote_limits table schema to match TypeScript types
DROP TABLE IF EXISTS public.vote_limits CASCADE;

CREATE TABLE public.vote_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  show_id TEXT NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  daily_votes INTEGER DEFAULT 0,
  show_votes INTEGER DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, show_id)
);

-- Create indexes for performance
CREATE INDEX idx_vote_limits_user_id ON public.vote_limits(user_id);
CREATE INDEX idx_vote_limits_show_id ON public.vote_limits(show_id);
CREATE INDEX idx_vote_limits_daily_reset ON public.vote_limits(last_daily_reset);

-- Enable RLS
ALTER TABLE public.vote_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own vote limits" ON public.vote_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vote limits" ON public.vote_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote limits" ON public.vote_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Updated vote_for_song function with proper schema
CREATE OR REPLACE FUNCTION public.vote_for_song(setlist_song_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_show_id TEXT;
  v_existing_vote UUID;
  v_daily_votes INTEGER;
  v_show_votes INTEGER;
  v_last_reset DATE;
  v_max_daily_votes INTEGER := 50;
  v_max_show_votes INTEGER := 10;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get show_id from setlist_song
  SELECT s.show_id INTO v_show_id
  FROM public.setlist_songs ss
  JOIN public.setlists s ON ss.setlist_id = s.id
  WHERE ss.id = setlist_song_id;

  IF v_show_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid setlist song');
  END IF;

  -- Check if user has already voted for this song
  SELECT id INTO v_existing_vote
  FROM public.votes
  WHERE user_id = v_user_id AND setlist_song_id = vote_for_song.setlist_song_id;
  
  IF v_existing_vote IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already voted for this song');
  END IF;

  -- Get or create vote limits record
  INSERT INTO public.vote_limits (user_id, show_id, daily_votes, show_votes, last_daily_reset)
  VALUES (v_user_id, v_show_id, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id, show_id) DO UPDATE
  SET daily_votes = CASE 
    WHEN vote_limits.last_daily_reset < CURRENT_DATE THEN 0
    ELSE vote_limits.daily_votes
  END,
  last_daily_reset = CURRENT_DATE,
  updated_at = NOW()
  RETURNING daily_votes, show_votes, last_daily_reset INTO v_daily_votes, v_show_votes, v_last_reset;

  -- Check limits
  IF v_daily_votes >= v_max_daily_votes THEN
    RETURN json_build_object('success', false, 'error', 'Daily vote limit reached (50/50)');
  END IF;

  IF v_show_votes >= v_max_show_votes THEN
    RETURN json_build_object('success', false, 'error', 'Show vote limit reached (10/10)');
  END IF;

  -- Insert the vote
  INSERT INTO public.votes (user_id, setlist_song_id)
  VALUES (v_user_id, setlist_song_id);

  -- Increment vote count on setlist_songs
  UPDATE public.setlist_songs
  SET votes = votes + 1
  WHERE id = setlist_song_id;

  -- Update vote limits
  UPDATE public.vote_limits
  SET daily_votes = daily_votes + 1,
      show_votes = show_votes + 1,
      updated_at = NOW()
  WHERE user_id = v_user_id AND show_id = v_show_id;

  RETURN json_build_object(
    'success', true,
    'daily_votes_used', v_daily_votes + 1,
    'daily_votes_remaining', v_max_daily_votes - (v_daily_votes + 1),
    'show_votes_used', v_show_votes + 1,
    'show_votes_remaining', v_max_show_votes - (v_show_votes + 1)
  );
END;
$function$;

-- Function to get user vote stats for a show
CREATE OR REPLACE FUNCTION public.get_user_vote_stats(show_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_daily_votes INTEGER := 0;
  v_show_votes INTEGER := 0;
  v_max_daily_votes INTEGER := 50;
  v_max_show_votes INTEGER := 10;
  v_voted_songs JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'authenticated', false,
      'daily_votes_used', 0,
      'daily_votes_remaining', v_max_daily_votes,
      'show_votes_used', 0,
      'show_votes_remaining', v_max_show_votes,
      'voted_songs', '[]'::json
    );
  END IF;

  -- Get current vote counts
  SELECT 
    CASE 
      WHEN last_daily_reset < CURRENT_DATE THEN 0
      ELSE COALESCE(daily_votes, 0)
    END,
    COALESCE(show_votes, 0)
  INTO v_daily_votes, v_show_votes
  FROM public.vote_limits
  WHERE user_id = v_user_id AND show_id = show_id_param;

  -- Get voted songs for this show
  SELECT COALESCE(json_agg(ss.id), '[]'::json) INTO v_voted_songs
  FROM public.votes v
  JOIN public.setlist_songs ss ON v.setlist_song_id = ss.id
  JOIN public.setlists s ON ss.setlist_id = s.id
  WHERE v.user_id = v_user_id AND s.show_id = show_id_param;

  RETURN json_build_object(
    'authenticated', true,
    'daily_votes_used', v_daily_votes,
    'daily_votes_remaining', v_max_daily_votes - v_daily_votes,
    'show_votes_used', v_show_votes,
    'show_votes_remaining', v_max_show_votes - v_show_votes,
    'voted_songs', v_voted_songs
  );
END;
$function$;