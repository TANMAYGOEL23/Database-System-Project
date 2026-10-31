import { createClient } from "@supabase/supabase-js";

// Read environment variables with defensive normalization
let rawUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || "").trim();

const supabaseUrl = rawUrl;

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === "string" &&
    supabaseUrl.trim().length > 0 &&
    supabaseUrl.startsWith("http") &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseUrl.includes("your-project-id")
  );
};

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : "https://placeholder-url.supabase.co",
  isSupabaseConfigured() ? supabaseAnonKey : "placeholder-anon-key",
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  },
);
