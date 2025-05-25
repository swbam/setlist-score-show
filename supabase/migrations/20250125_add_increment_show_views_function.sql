
-- Create function to increment show views
CREATE OR REPLACE FUNCTION public.increment_show_views(show_id text)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.shows
  SET view_count = view_count + 1
  WHERE id = show_id;
END;
$function$;
