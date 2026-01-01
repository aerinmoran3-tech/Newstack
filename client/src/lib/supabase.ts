/**
 * Supabase Frontend Client
 * =========================
 * Creates and exports the Supabase client for frontend operations.
 * 
 * SAFETY: This module checks for environment variables before initialization.
 * If not configured, it exports null and logs a helpful error message.
 * This prevents cryptic errors and guides developers to configure secrets.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;

// Validate configuration and create client
if (supabaseUrl && supabaseKey) {
  _supabase = createClient(supabaseUrl, supabaseKey);
} else {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseKey) missing.push('VITE_SUPABASE_ANON_KEY');
  console.error(
    `[SUPABASE] Configuration incomplete. Missing: ${missing.join(', ')}\n` +
    'Authentication and database features will not work.\n' +
    'Add these variables to Replit Secrets or .env. See SETUP.md for instructions.'
  );
}

export function isSupabaseConfigured(): boolean {
  return _supabase !== null;
}

export function getSupabaseOrThrow(): SupabaseClient {
  if (!_supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    );
  }
  return _supabase;
}

// Export a safe proxy object so property access fails with a helpful message
const supabaseProxy = new Proxy({}, {
  get(_, prop) {
    if (_supabase) {
      // @ts-expect-error delegate to real client if available
      return (_supabase as any)[prop];
    }
    throw new Error(`[SUPABASE] Client not configured. Missing VITE variables. Accessed property: ${String(prop)}`);
  },
  apply(_, thisArg, args) {
    if (_supabase) {
      return (_supabase as any).apply(thisArg, args);
    }
    throw new Error('[SUPABASE] Client not configured. Missing VITE variables.');
  }
}) as unknown as SupabaseClient;

export const supabase = _supabase ?? supabaseProxy;
