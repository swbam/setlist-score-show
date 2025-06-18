import { corsHeaders } from './cors.ts';

export function verifyAuth(req: Request): Response | null {
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const cronSecretHeader = req.headers.get('x-cron-secret');
  const envCronSecret = Deno.env.get('CRON_SECRET');

  const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
  const isCron = envCronSecret && cronSecretHeader === envCronSecret;

  if (isServiceRole || isCron) {
    return null; // Authorized
  }
  
  console.error('Unauthorized request: Invalid credentials provided.');
  return new Response(
    JSON.stringify({ success: false, message: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
} 