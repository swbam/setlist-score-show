import { createServiceClient } from './supabase.ts';

export async function verifyAuth(req: Request): Promise<{ isAuthorized: boolean; isAdmin: boolean; userId?: string }> {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  
  // Check if it's a cron job request
  if (authHeader === `Bearer ${cronSecret}`) {
    return { isAuthorized: true, isAdmin: true };
  }
  
  // Check if it's an authenticated user request
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const supabase = createServiceClient();
      const token = authHeader.replace('Bearer ', '');
      
      // Verify the JWT token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const isAdmin = userData?.role === 'admin';
        return { isAuthorized: isAdmin, isAdmin, userId: user.id };
      }
    } catch (e) {
      console.error('Error verifying user token:', e);
    }
  }
  
  return { isAuthorized: false, isAdmin: false };
}