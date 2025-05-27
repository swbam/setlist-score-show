-- Create function to update trending shows
CREATE OR REPLACE FUNCTION public.update_trending_shows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- This is a placeholder function that could be expanded
  -- to implement more complex trending logic
  -- For now, trending is based on view_count which is already tracked
  
  -- You could add logic here to:
  -- 1. Calculate trending scores based on views, votes, and recency
  -- 2. Store trending scores in a separate table
  -- 3. Cache trending results for performance
  
  -- Example: Log that trending update was called
  RAISE NOTICE 'Trending shows update called at %', NOW();
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_trending_shows() TO authenticated;