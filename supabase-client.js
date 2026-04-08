import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase-config.js';

let cachedClient = null;

function looksConfigured(value) {
  return Boolean(value) && !value.includes('YOUR_') && !value.includes('your-');
}

export function getSupabase() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!looksConfigured(SUPABASE_URL) || !looksConfigured(SUPABASE_ANON_KEY)) {
    return null;
  }

  cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cachedClient;
}
