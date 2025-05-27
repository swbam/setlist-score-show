import { supabase } from '@/integrations/supabase/client';

export function subscribeToSetlistVotes(setlistId: string, onUpdate: (payload: any) => void) {
  const channel = supabase
    .channel(`setlist:${setlistId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'setlist_songs',
        filter: `setlist_id=eq.${setlistId}`
      },
      (payload) => onUpdate(payload)
    )
    .subscribe();
    
  return () => {
    channel.unsubscribe();
  };
}