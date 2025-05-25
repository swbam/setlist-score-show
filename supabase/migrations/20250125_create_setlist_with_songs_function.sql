
-- Create function to create setlist with 5 random songs
CREATE OR REPLACE FUNCTION public.create_setlist_with_songs(p_show_id text)
RETURNS TABLE(setlist_id uuid, songs_added integer)
LANGUAGE plpgsql
AS $function$
DECLARE
  _setlist_id UUID;
  _artist_id TEXT;
  _songs_added INTEGER := 0;
  _song_record RECORD;
BEGIN
  -- Check if setlist already exists
  SELECT id INTO _setlist_id FROM public.setlists WHERE show_id = p_show_id;
  
  -- If setlist exists, return its ID and count songs
  IF _setlist_id IS NOT NULL THEN
    SELECT COUNT(*)::integer INTO _songs_added FROM public.setlist_songs WHERE setlist_id = _setlist_id;
    RETURN QUERY SELECT _setlist_id, _songs_added;
    RETURN;
  END IF;
  
  -- Get artist ID for the show
  SELECT artist_id INTO _artist_id FROM public.shows WHERE id = p_show_id;
  
  IF _artist_id IS NULL THEN
    RAISE EXCEPTION 'Show not found: %', p_show_id;
  END IF;
  
  -- Create new setlist
  INSERT INTO public.setlists (show_id)
  VALUES (p_show_id)
  RETURNING id INTO _setlist_id;
  
  -- Add 5 random songs from the artist's catalog
  FOR _song_record IN (
    SELECT id FROM public.songs 
    WHERE artist_id = _artist_id 
    ORDER BY RANDOM() 
    LIMIT 5
  )
  LOOP
    _songs_added := _songs_added + 1;
    INSERT INTO public.setlist_songs (setlist_id, song_id, position, votes)
    VALUES (_setlist_id, _song_record.id, _songs_added, 0);
  END LOOP;
  
  RETURN QUERY SELECT _setlist_id, _songs_added;
END;
$function$;
