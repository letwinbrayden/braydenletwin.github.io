import { getSupabase } from './supabase-client.js';

const supabase = getSupabase();

export async function fetchProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
