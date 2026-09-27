import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';

// Server-side administrative client (uses Service Role Key if available, or Anon Key)
const adminKey = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;

export const supabaseAdmin: SupabaseClient = createClient(ENV.SUPABASE_URL, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const hasServiceRoleKey = Boolean(
  ENV.SUPABASE_SERVICE_ROLE_KEY && ENV.SUPABASE_SERVICE_ROLE_KEY.length > 20
);

/**
 * Creates a Supabase client authenticated as the calling user.
 * Preserves Row Level Security (RLS) and auth.uid() context.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
