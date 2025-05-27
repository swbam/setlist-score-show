-- Create vote_limits table to track user voting limits
CREATE TABLE IF NOT EXISTS public.vote_limits (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  daily_votes INTEGER DEFAULT 0,
  last_reset DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vote_limits_user_id ON public.vote_limits(user_id);

-- Create or replace the vote_for_song function with vote limit enforcement
CREATE OR REPLACE FUNCTION public.vote_for_song(p_setlist_song_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_existing_vote UUID;
  v_daily_votes INTEGER;
  v_last_reset DATE;
  v_max_votes_per_song INTEGER := 10;
  v_max_daily_votes INTEGER := 50;
  v_user_votes_on_song INTEGER;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Check if user has already voted for this song
  SELECT id INTO v_existing_vote
  FROM public.votes
  WHERE user_id = v_user_id AND setlist_song_id = p_setlist_song_id;
  
  IF v_existing_vote IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You have already voted for this song');
  END IF;

  -- Get or create vote limits record
  INSERT INTO public.vote_limits (user_id, daily_votes, last_reset)
  VALUES (v_user_id, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET daily_votes = CASE 
    WHEN vote_limits.last_reset < CURRENT_DATE THEN 0
    ELSE vote_limits.daily_votes
  END,
  last_reset = CURRENT_DATE
  RETURNING daily_votes, last_reset INTO v_daily_votes, v_last_reset;

  -- Check daily vote limit
  IF v_daily_votes >= v_max_daily_votes THEN
    RETURN json_build_object('success', false, 'error', 'Daily vote limit reached (50 votes)');
  END IF;

  -- Count user's votes for this specific song's show
  SELECT COUNT(*)::INTEGER INTO v_user_votes_on_song
  FROM public.votes v
  JOIN public.setlist_songs ss ON v.setlist_song_id = ss.id
  WHERE v.user_id = v_user_id 
    AND ss.setlist_id = (SELECT setlist_id FROM public.setlist_songs WHERE id = p_setlist_song_id);

  -- Check per-show vote limit
  IF v_user_votes_on_song >= v_max_votes_per_song THEN
    RETURN json_build_object('success', false, 'error', 'Maximum votes per show reached (10 votes)');
  END IF;

  -- Insert the vote
  INSERT INTO public.votes (user_id, setlist_song_id)
  VALUES (v_user_id, p_setlist_song_id);

  -- Increment vote count on setlist_songs
  UPDATE public.setlist_songs
  SET votes = votes + 1
  WHERE id = p_setlist_song_id;

  -- Update daily vote count
  UPDATE public.vote_limits
  SET daily_votes = daily_votes + 1
  WHERE user_id = v_user_id;

  RETURN json_build_object(
    'success', true, 
    'daily_votes_used', v_daily_votes + 1,
    'daily_votes_remaining', v_max_daily_votes - (v_daily_votes + 1),
    'show_votes_used', v_user_votes_on_song + 1,
    'show_votes_remaining', v_max_votes_per_song - (v_user_votes_on_song + 1)
  );
END;
$function$;

-- Create function to get user's vote status for a show
CREATE OR REPLACE FUNCTION public.get_user_votes_for_show(p_show_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_setlist_id UUID;
  v_votes_data JSON;
  v_daily_votes INTEGER;
  v_max_daily_votes INTEGER := 50;
  v_max_show_votes INTEGER := 10;
  v_show_votes_used INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('authenticated', false);
  END IF;

  -- Get setlist ID for the show
  SELECT id INTO v_setlist_id FROM public.setlists WHERE show_id = p_show_id;
  
  -- Get current daily votes
  SELECT COALESCE(
    CASE 
      WHEN last_reset < CURRENT_DATE THEN 0
      ELSE daily_votes
    END, 0
  ) INTO v_daily_votes
  FROM public.vote_limits
  WHERE user_id = v_user_id;

  -- Count votes for this show
  SELECT COUNT(*)::INTEGER INTO v_show_votes_used
  FROM public.votes v
  JOIN public.setlist_songs ss ON v.setlist_song_id = ss.id
  WHERE v.user_id = v_user_id AND ss.setlist_id = v_setlist_id;

  -- Get voted songs
  SELECT json_agg(ss.song_id) INTO v_votes_data
  FROM public.votes v
  JOIN public.setlist_songs ss ON v.setlist_song_id = ss.id
  WHERE v.user_id = v_user_id AND ss.setlist_id = v_setlist_id;

  RETURN json_build_object(
    'authenticated', true,
    'daily_votes_used', COALESCE(v_daily_votes, 0),
    'daily_votes_remaining', v_max_daily_votes - COALESCE(v_daily_votes, 0),
    'show_votes_used', COALESCE(v_show_votes_used, 0),
    'show_votes_remaining', v_max_show_votes - COALESCE(v_show_votes_used, 0),
    'voted_song_ids', COALESCE(v_votes_data, '[]'::json)
  );
END;
$function$;

-- Add RLS policies
ALTER TABLE public.vote_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vote limits" ON public.vote_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vote limits" ON public.vote_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote limits" ON public.vote_limits
  FOR UPDATE USING (auth.uid() = user_id);