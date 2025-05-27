
// Configuration service to centralize API keys and ensure they're available
export const config = {
  supabase: {
    url: 'https://ailrmwtahifvstpfhbgn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw'
  },
  apis: {
    ticketmaster: 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b',
    setlistfm: 'xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL',
    spotify: {
      clientId: '2946864dc822469b9c672292ead45f43',
      clientSecret: 'feaf0fc901124b839b11e02f97d18a8d'
    }
  }
};

// Validation function to ensure all required keys are present
export const validateConfig = () => {
  const missing = [];
  
  if (!config.apis.ticketmaster) missing.push('Ticketmaster API Key');
  if (!config.apis.setlistfm) missing.push('Setlist.fm API Key');
  if (!config.apis.spotify.clientId) missing.push('Spotify Client ID');
  if (!config.apis.spotify.clientSecret) missing.push('Spotify Client Secret');
  
  if (missing.length > 0) {
    console.warn('Missing API keys:', missing);
    return false;
  }
  
  console.log('✅ All API keys configured');
  return true;
};

// Initialize config validation
validateConfig();
