import { createClient } from '@supabase/supabase-js';

// We allow dynamic initialization because the user might input credentials at runtime
export const initSupabase = (url, key) => {
  if (!url || !key) return null;
  return createClient(url, key);
};