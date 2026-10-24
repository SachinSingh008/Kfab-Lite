import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpskidjmetjhadghpntl.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2tpZGptZXRqaGFkZ2hwbnRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTcxNTM4NiwiZXhwIjoyMTA1MjkxMzg2fQ.meo3U6xo_I-uubPrGZUraijfMRissyLvyWmZT6rU4wg';

let cachedAdmin: SupabaseClient | null = null;

/**
 * Server-only administrative Supabase client using the Service Role Key.
 * NEVER import this into client components ('use client').
 */
export function getAdminClient(): SupabaseClient | null {
  if (!serviceRoleKey) {
    return null;
  }
  if (!cachedAdmin) {
    cachedAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cachedAdmin;
}
