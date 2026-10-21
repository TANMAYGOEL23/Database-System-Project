import { createClient } from '@supabase/supabase-js';

// Verified live Supabase project configuration
const DEFAULT_SUPABASE_URL = 'https://khypyudvethxwhshrwjl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_EFn-BauC7ZEOAGsyN6WDvA_BvkPS7ow';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta as any).env?.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    supabaseUrl.startsWith('http') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
};

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-url.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key'
);

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  configured: isSupabaseConfigured(),
  projectId: supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] : '',
});

export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
  projectId?: string;
  usersCount?: number;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase URL or Key missing in .env',
    };
  }

  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('user_id', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      return {
        connected: false,
        message: error.message,
        projectId: getSupabaseConfig().projectId,
      };
    }

    return {
      connected: true,
      message: 'Connected to Supabase PostgreSQL',
      projectId: getSupabaseConfig().projectId,
      usersCount: count || (data ? data.length : 0),
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Network error connecting to Supabase',
      projectId: getSupabaseConfig().projectId,
    };
  }
};
