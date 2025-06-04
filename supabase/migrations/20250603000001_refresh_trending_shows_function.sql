CREATE OR REPLACE FUNCTION public.refresh_trending_shows()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$;
