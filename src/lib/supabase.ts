import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getStoredSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) return null;
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

const PAGE_SIZE = 1000;

/**
 * Supabase (PostgREST) returns at most 1000 rows per request, so tables that keep
 * growing (stock_mutations, jadwal_shift) must be read page by page.
 * `buildQuery` must return a fresh query with a deterministic order.
 */
export async function fetchAllRows<T>(
  buildQuery: () => any
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}
