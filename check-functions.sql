-- Check what functions exist in the database
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    l.lanname as language
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
AND (p.proname LIKE '%trending%' OR p.proname LIKE '%top_shows%' OR p.proname LIKE '%sample%')
ORDER BY p.proname;